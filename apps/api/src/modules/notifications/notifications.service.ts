import { Injectable, Logger } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private db: ShiftService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
      } : undefined,
    });
  }

  async getUserNotifications(userId: string) {
    const [unreadCount, notifications] = await Promise.all([
      this.db.notification.count({ where: { userId, read: false } }),
      this.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { unreadCount, notifications };
  }

  async markAsRead(notificationId: string) {
    return this.db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async sendEmail(to: string, subject: string, htmlContent: string, templateName?: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'CAS Platform <no-reply@adani.com>',
        to,
        subject,
        html: htmlContent,
      });

      await this.db.emailLog.create({
        data: {
          to,
          subject,
          template: templateName,
          status: 'SENT',
        },
      });
      this.logger.log(`Email successfully sent to ${to}: ${subject}`);
    } catch (err: any) {
      this.logger.warn(`Could not send email to ${to}: ${err.message}. Logging failure.`);
      await this.db.emailLog.create({
        data: {
          to,
          subject,
          template: templateName,
          status: 'FAILED',
          error: err.message,
        },
      });
    }
  }

  async getEmailLogs() {
    return this.db.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
