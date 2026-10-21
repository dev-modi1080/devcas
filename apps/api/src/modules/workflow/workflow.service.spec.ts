import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from './workflow.service';
import { ShiftService } from '../../shift/shift.service';
import { UserRole, WorkflowStatus, WorkflowAction } from '@cas/shared';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('WorkflowService (Unit Tests for all paths)', () => {
  let service: WorkflowService;
  let db: any;

  beforeEach(async () => {
    db = {
      workflowInstance: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation((args) => Promise.resolve({
          id: args.where.id,
          createdById: 'user-creator',
          ...args.data,
        })),
      },
      workflowStepHistory: {
        create: jest.fn(),
      },
      greenZoneRequest: {
        update: jest.fn(),
      },
      misYearlyBudget: {
        update: jest.fn(),
      },
      misMonthlyExpense: {
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([{ id: 'approver-1' }]),
      },
      $transaction: jest.fn(async (cb) => cb(db)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        { provide: ShiftService, useValue: db },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  describe('getInitialStatus (Skip L1 logic)', () => {
    it('routes to L1 for standard Site User', () => {
      const res = service.getInitialStatus(UserRole.SITE_USER);
      expect(res.status).toBe(WorkflowStatus.PENDING_L1);
      expect(res.currentLevel).toBe('L1');
    });

    it('skips L1 and routes directly to L2 when creator is Site Supervisor', () => {
      const res = service.getInitialStatus(UserRole.SITE_SUPERVISOR);
      expect(res.status).toBe(WorkflowStatus.PENDING_L2);
      expect(res.currentLevel).toBe('L2');
    });
  });

  describe('Approval sequential path', () => {
    it('advances from L1 to L2 on Site Supervisor approval', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-1',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-1',
        status: WorkflowStatus.PENDING_L1,
        currentLevel: 'L1',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-1',
        action: WorkflowAction.APPROVE,
        actor: { id: 'user-supervisor', role: UserRole.SITE_SUPERVISOR, name: 'Supervisor' },
        remarks: 'L1 Approved',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.PENDING_L2, currentLevel: 'L2' }),
        }),
      );
    });

    it('advances from L2 to L3 on BU Administrator approval', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-2',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-2',
        status: WorkflowStatus.PENDING_L2,
        currentLevel: 'L2',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-2',
        action: WorkflowAction.APPROVE,
        actor: { id: 'user-bu', role: UserRole.BU_ADMINISTRATOR, name: 'BU Admin' },
        remarks: 'L2 Approved',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.PENDING_L3, currentLevel: 'L3' }),
        }),
      );
    });

    it('marks request COMPLETE on L3 CAS Admin approval', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-3',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-3',
        status: WorkflowStatus.PENDING_L3,
        currentLevel: 'L3',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-3',
        action: WorkflowAction.APPROVE,
        actor: { id: 'user-admin', role: UserRole.CAS_ADMIN, name: 'CAS Admin' },
        remarks: 'Final Approval Granted',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.COMPLETE, currentLevel: null }),
        }),
      );
    });
  });

  describe('Reject, Return, Callback, Cancel paths', () => {
    it('marks REJECTED with mandatory remarks', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-4',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-4',
        status: WorkflowStatus.PENDING_L1,
        currentLevel: 'L1',
        createdById: 'user-creator',
      });

      await expect(
        service.processAction({
          entityType: 'GREEN_ZONE_CREATION',
          entityId: 'req-4',
          action: WorkflowAction.REJECT,
          actor: { id: 'user-sup', role: UserRole.SITE_SUPERVISOR, name: 'Supervisor' },
          remarks: '', // Missing remarks
        }),
      ).rejects.toThrow(BadRequestException);

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-4',
        action: WorkflowAction.REJECT,
        actor: { id: 'user-sup', role: UserRole.SITE_SUPERVISOR, name: 'Supervisor' },
        remarks: 'Invalid sapling density',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.REJECTED, currentLevel: null }),
        }),
      );
    });

    it('handles RETURN to creator (Green Zone only)', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-5',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-5',
        status: WorkflowStatus.PENDING_L1,
        currentLevel: 'L1',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-5',
        action: WorkflowAction.RETURN,
        actor: { id: 'user-sup', role: UserRole.SITE_SUPERVISOR, name: 'Supervisor' },
        remarks: 'Please re-attach clear photos',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.RETURNED, currentLevel: null }),
        }),
      );
    });

    it('handles CALLBACK by creator (Green Zone only)', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-6',
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-6',
        status: WorkflowStatus.PENDING_L1,
        currentLevel: 'L1',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'GREEN_ZONE_CREATION',
        entityId: 'req-6',
        action: WorkflowAction.CALLBACK,
        actor: { id: 'user-creator', role: UserRole.SITE_USER, name: 'Creator' },
        remarks: 'Need to correct botanical name',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.CALLBACK, currentLevel: null }),
        }),
      );
    });

    it('handles CANCEL by creator with remarks', async () => {
      db.workflowInstance.findUnique.mockResolvedValue({
        id: 'inst-7',
        entityType: 'MIS_MONTHLY',
        entityId: 'req-7',
        status: WorkflowStatus.PENDING_L2,
        currentLevel: 'L2',
        createdById: 'user-creator',
      });

      await service.processAction({
        entityType: 'MIS_MONTHLY',
        entityId: 'req-7',
        action: WorkflowAction.CANCEL,
        actor: { id: 'user-creator', role: UserRole.SITE_USER, name: 'Creator' },
        remarks: 'Duplicate entry raised by mistake',
      });

      expect(db.workflowInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: WorkflowStatus.CANCELLED, currentLevel: null }),
        }),
      );
    });
  });
});
