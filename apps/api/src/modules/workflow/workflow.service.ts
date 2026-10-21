import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { WorkflowStatus, WorkflowAction, UserRole } from '@cas/shared';

export interface WorkflowTransitionDto {
  action: WorkflowAction;
  remarks?: string;
}

@Injectable()
export class WorkflowService {
  constructor(private db: ShiftService) {}

  /**
   * Determine the initial pending status when a request is submitted.
   * If creator is Site Supervisor, skip L1 and start directly at L2.
   */
  getInitialStatus(creatorRole: UserRole): { status: WorkflowStatus; currentLevel: string } {
    if (creatorRole === UserRole.SITE_SUPERVISOR) {
      return { status: WorkflowStatus.PENDING_L2, currentLevel: 'L2' };
    }
    return { status: WorkflowStatus.PENDING_L1, currentLevel: 'L1' };
  }

  /**
   * Record a workflow step in the history and update the workflow instance & entity status
   */
  async processAction(params: {
    entityType: 'GREEN_ZONE_CREATION' | 'GREEN_ZONE_MORTALITY' | 'MIS_YEARLY' | 'MIS_MONTHLY';
    entityId: string;
    action: WorkflowAction;
    actor: { id: string; role: UserRole; name: string };
    remarks?: string;
  }) {
    const { entityType, entityId, action, actor, remarks } = params;

    // Fetch entity and current status
    const instance = await this.db.workflowInstance.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
    });

    if (!instance) {
      throw new NotFoundException(`Workflow instance not found for ${entityType} ${entityId}`);
    }

    const currentStatus = instance.status;
    const currentLevel = instance.currentLevel;
    const isGreenZone = entityType.startsWith('GREEN_ZONE');
    const isMis = entityType.startsWith('MIS');

    // Rule validation based on action
    if (action === WorkflowAction.CANCEL) {
      if (instance.createdById !== actor.id && actor.role !== UserRole.CAS_ADMIN) {
        throw new ForbiddenException('Only the creator can cancel this request');
      }
      if (![WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3, WorkflowStatus.DRAFT, WorkflowStatus.CALLBACK, WorkflowStatus.RETURNED].includes(currentStatus as WorkflowStatus)) {
        throw new BadRequestException('Cannot cancel request in its current state');
      }
      if (!remarks) {
        throw new BadRequestException('Remarks are mandatory when cancelling a request');
      }

      return this.updateStatus({
        instanceId: instance.id,
        entityType,
        entityId,
        newStatus: WorkflowStatus.CANCELLED,
        newLevel: null,
        actorId: actor.id,
        action,
        remarks,
      });
    }

    if (action === WorkflowAction.CALLBACK) {
      if (!isGreenZone) {
        throw new BadRequestException('Callback is only permitted for Green Zone requests');
      }
      if (instance.createdById !== actor.id && actor.role !== UserRole.CAS_ADMIN) {
        throw new ForbiddenException('Only the creator can call back this request');
      }
      if (![WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3].includes(currentStatus as WorkflowStatus)) {
        throw new BadRequestException('Request can only be called back while pending approval');
      }
      if (!remarks) {
        throw new BadRequestException('Remarks are mandatory when calling back a request');
      }

      return this.updateStatus({
        instanceId: instance.id,
        entityType,
        entityId,
        newStatus: WorkflowStatus.CALLBACK,
        newLevel: null,
        actorId: actor.id,
        action,
        remarks,
      });
    }

    if (action === WorkflowAction.RETURN) {
      if (!isGreenZone) {
        throw new BadRequestException('Return to creator is only permitted for Green Zone requests');
      }
      if (!remarks) {
        throw new BadRequestException('Remarks are mandatory when returning a request');
      }
      this.validateApproverEligibility(actor.role, currentLevel);

      return this.updateStatus({
        instanceId: instance.id,
        entityType,
        entityId,
        newStatus: WorkflowStatus.RETURNED,
        newLevel: null,
        actorId: actor.id,
        action,
        remarks,
      });
    }

    if (action === WorkflowAction.REJECT) {
      if (!remarks) {
        throw new BadRequestException('Remarks are mandatory when rejecting a request');
      }
      this.validateApproverEligibility(actor.role, currentLevel);

      return this.updateStatus({
        instanceId: instance.id,
        entityType,
        entityId,
        newStatus: WorkflowStatus.REJECTED,
        newLevel: null,
        actorId: actor.id,
        action,
        remarks,
      });
    }

    if (action === WorkflowAction.APPROVE) {
      this.validateApproverEligibility(actor.role, currentLevel);

      let nextStatus: WorkflowStatus;
      let nextLevel: string | null;

      if (currentLevel === 'L1') {
        nextStatus = WorkflowStatus.PENDING_L2;
        nextLevel = 'L2';
      } else if (currentLevel === 'L2') {
        nextStatus = WorkflowStatus.PENDING_L3;
        nextLevel = 'L3';
      } else if (currentLevel === 'L3') {
        nextStatus = WorkflowStatus.COMPLETE;
        nextLevel = null;
      } else {
        throw new BadRequestException('Request is not in an approvable state');
      }

      return this.updateStatus({
        instanceId: instance.id,
        entityType,
        entityId,
        newStatus: nextStatus,
        newLevel: nextLevel,
        actorId: actor.id,
        action,
        remarks: remarks || 'Approved',
      });
    }

    throw new BadRequestException(`Unsupported action ${action}`);
  }

  /**
   * Check if current actor role matches current level:
   * L1 => SITE_SUPERVISOR or CAS_ADMIN
   * L2 => BU_ADMINISTRATOR or CAS_ADMIN
   * L3 => CAS_ADMIN
   */
  private validateApproverEligibility(role: UserRole, level: string | null) {
    if (role === UserRole.CAS_ADMIN) return; // CAS Admin can act as fallback at any level

    if (level === 'L1' && role !== UserRole.SITE_SUPERVISOR) {
      throw new ForbiddenException('Only a Site Supervisor can act on L1 approval');
    }
    if (level === 'L2' && role !== UserRole.BU_ADMINISTRATOR) {
      throw new ForbiddenException('Only a BU Administrator can act on L2 approval');
    }
    if (level === 'L3') {
      throw new ForbiddenException('Only a CAS Admin can act on L3 approval');
    }
  }

  private async updateStatus(params: {
    instanceId: string;
    entityType: string;
    entityId: string;
    newStatus: WorkflowStatus;
    newLevel: string | null;
    actorId: string;
    action: WorkflowAction;
    remarks: string;
  }) {
    const { instanceId, entityType, entityId, newStatus, newLevel, actorId, action, remarks } = params;

    // Use transaction to update workflow instance, history step, and the underlying entity
    return this.db.$transaction(async (tx) => {
      // 1. Update workflow instance
      const updatedInstance = await tx.workflowInstance.update({
        where: { id: instanceId },
        data: {
          status: newStatus,
          currentLevel: newLevel,
        },
      });

      // 2. Record step in history
      await tx.workflowStepHistory.create({
        data: {
          workflowInstanceId: instanceId,
          entityType,
          entityId,
          level: newLevel || 'FINAL',
          actorId,
          action,
          remarks,
        },
      });

      // 3. Update the specific domain model status
      if (entityType === 'GREEN_ZONE_CREATION' || entityType === 'GREEN_ZONE_MORTALITY') {
        await tx.greenZoneRequest.update({
          where: { id: entityId },
          data: {
            status: newStatus,
            currentLevel: newLevel,
            updatedById: actorId,
          },
        });
      } else if (entityType === 'MIS_YEARLY') {
        await tx.misYearlyBudget.update({
          where: { id: entityId },
          data: {
            status: newStatus,
            currentLevel: newLevel,
            updatedById: actorId,
          },
        });
      } else if (entityType === 'MIS_MONTHLY') {
        await tx.misMonthlyExpense.update({
          where: { id: entityId },
          data: {
            status: newStatus,
            currentLevel: newLevel,
            updatedById: actorId,
          },
        });
      }

      // 4. Create in-app notification for the creator
      if (updatedInstance.createdById !== actorId) {
        await tx.notification.create({
          data: {
            userId: updatedInstance.createdById,
            title: `Request ${action}`,
            message: `Your ${entityType.replace(/_/g, ' ')} has been ${action.toLowerCase()}ed (${newStatus}).`,
            link: `/${entityType.toLowerCase().includes('green') ? 'green-zone' : 'mis'}/requests/${entityId}`,
          },
        });
      }

      // 5. Create in-app notification for pending approvers if moving to a new level
      if (newLevel) {
        // Find users eligible for this level
        const targetRole =
          newLevel === 'L1'
            ? UserRole.SITE_SUPERVISOR
            : newLevel === 'L2'
              ? UserRole.BU_ADMINISTRATOR
              : UserRole.CAS_ADMIN;

        const approvers = await tx.user.findMany({
          where: { role: targetRole, active: true },
          select: { id: true },
          take: 5,
        });

        for (const app of approvers) {
          await tx.notification.create({
            data: {
              userId: app.id,
              title: `Pending ${newLevel} Approval`,
              message: `New request requires your review: ${entityType.replace(/_/g, ' ')}.`,
              link: `/${entityType.toLowerCase().includes('green') ? 'green-zone' : 'mis'}/approvals`,
            },
          });
        }
      }

      return updatedInstance;
    });
  }

  /**
   * Get full approval timeline history for an entity
   */
  async getHistory(entityType: string, entityId: string) {
    return this.db.workflowStepHistory.findMany({
      where: { entityType, entityId },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
