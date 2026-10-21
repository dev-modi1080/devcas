import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkflowAction } from '@cas/shared';

@ApiTags('Workflow')
@Controller('workflow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post(':entityType/:entityId/action')
  @ApiOperation({ summary: 'Execute workflow action (Approve, Reject, Return, Callback, Cancel)' })
  async executeAction(
    @Param('entityType') entityType: any,
    @Param('entityId') entityId: string,
    @Body() body: { action: WorkflowAction; remarks?: string },
    @CurrentUser() user: any,
  ) {
    return this.workflowService.processAction({
      entityType,
      entityId,
      action: body.action,
      actor: user,
      remarks: body.remarks,
    });
  }

  @Get(':entityType/:entityId/history')
  @ApiOperation({ summary: 'Get workflow history timeline' })
  async getHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.workflowService.getHistory(entityType, entityId);
  }
}
