import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@cas/shared';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('trigger-approval-reminders')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Manually trigger approval reminders job' })
  async triggerApprovalReminders() {
    return this.jobsService.triggerApprovalReminders();
  }

  @Post('trigger-mis-yearly-reminders')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Manually trigger MIS yearly budget reminder job' })
  async triggerMisYearlyReminders() {
    return this.jobsService.triggerMisYearlyReminders();
  }

  @Post('trigger-mis-monthly-reminders')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Manually trigger MIS monthly expense reminder job' })
  async triggerMisMonthlyReminders() {
    return this.jobsService.triggerMisMonthlyReminders();
  }
}
