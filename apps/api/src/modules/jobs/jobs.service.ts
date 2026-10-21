import { Injectable, Logger } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowStatus, UserRole } from '@cas/shared';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private db: ShiftService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Daily job: Check for pending approval requests that have been waiting for >= 3 days.
   * Send reminder email & notification to pending approvers.
   */
  async triggerApprovalReminders() {
    this.logger.log('Starting Approval Reminders job...');

    const setting = await this.db.systemSetting.findUnique({
      where: { key: 'APPROVAL_REMINDER_DAYS' },
    });
    const days = parseInt(setting?.value || '3', 10);
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);

    // Find all pending workflow instances older than threshold
    const pendingInstances = await this.db.workflowInstance.findMany({
      where: {
        status: { in: [WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3] },
        updatedAt: { lte: thresholdDate },
      },
    });

    let reminderCount = 0;

    for (const inst of pendingInstances) {
      const targetRole =
        inst.currentLevel === 'L1'
          ? UserRole.SITE_SUPERVISOR
          : inst.currentLevel === 'L2'
            ? UserRole.BU_ADMINISTRATOR
            : UserRole.CAS_ADMIN;

      const approvers = await this.db.user.findMany({
        where: { role: targetRole, active: true },
      });

      for (const app of approvers) {
        await this.notificationsService.sendEmail(
          app.email,
          `Reminder: Action Pending on ${inst.entityType.replace(/_/g, ' ')}`,
          `<p>Dear ${app.name},</p><p>This is a reminder that a request (${inst.entityType.replace(/_/g, ' ')}) has been pending your ${inst.currentLevel} approval for over ${days} days. Please review and act on it at your earliest convenience.</p><p><a href="${process.env.WEB_URL || 'http://localhost:3000'}">Open CAS Portal</a></p>`,
          'approval_reminder',
        );

        await this.db.notification.create({
          data: {
            userId: app.id,
            title: `Reminder: Pending ${inst.currentLevel} Approval`,
            message: `A ${inst.entityType.replace(/_/g, ' ')} request is pending your review for over ${days} days.`,
            link: `/${inst.entityType.toLowerCase().includes('green') ? 'green-zone' : 'mis'}/approvals`,
          },
        });

        reminderCount++;
      }
    }

    this.logger.log(`Approval reminders sent: ${reminderCount}`);
    return { success: true, pendingRequestsChecked: pendingInstances.length, remindersSent: reminderCount };
  }

  /**
   * MIS Yearly reminder: Sent to all Site Supervisors on 1st April and 10th April.
   */
  async triggerMisYearlyReminders() {
    this.logger.log('Starting MIS Yearly Budget Reminder job...');
    const supervisors = await this.db.user.findMany({
      where: { role: UserRole.SITE_SUPERVISOR, active: true },
    });

    for (const sup of supervisors) {
      await this.notificationsService.sendEmail(
        sup.email,
        'Action Required: Submit Yearly Budget for CAS',
        `<p>Dear ${sup.name},</p><p>The yearly budget entry window for the new fiscal year is open from 1 to 10 April. Please submit the Capex and Opex budgets for your assigned locations.</p><p><a href="${process.env.WEB_URL || 'http://localhost:3000'}/mis/yearly-budget">Go to Yearly Budget Entry</a></p>`,
        'mis_yearly_reminder',
      );

      await this.db.notification.create({
        data: {
          userId: sup.id,
          title: 'Yearly Budget Entry Open',
          message: 'The yearly budget entry window (1-10 April) is now open. Please submit Capex/Opex budgets.',
          link: '/mis/yearly-budget',
        },
      });
    }

    return { success: true, remindersSent: supervisors.length };
  }

  /**
   * MIS Monthly reminder: Sent on 3rd, 6th, and 9th of each month.
   */
  async triggerMisMonthlyReminders() {
    this.logger.log('Starting MIS Monthly Expense Reminder job...');
    const supervisors = await this.db.user.findMany({
      where: { role: UserRole.SITE_SUPERVISOR, active: true },
    });

    for (const sup of supervisors) {
      await this.notificationsService.sendEmail(
        sup.email,
        'Reminder: Submit Monthly Expense Entry for CAS',
        `<p>Dear ${sup.name},</p><p>This is a reminder to submit the monthly expense, workforce counts, and green area numbers for your locations before the 10th of the month.</p><p><a href="${process.env.WEB_URL || 'http://localhost:3000'}/mis/monthly-expense">Go to Monthly Expense Entry</a></p>`,
        'mis_monthly_reminder',
      );

      await this.db.notification.create({
        data: {
          userId: sup.id,
          title: 'Monthly Expense Entry Reminder',
          message: 'Please ensure your monthly expense entries are submitted by the 10th.',
          link: '/mis/monthly-expense',
        },
      });
    }

    return { success: true, remindersSent: supervisors.length };
  }
}
