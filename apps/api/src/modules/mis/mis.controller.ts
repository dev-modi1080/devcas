import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MisService } from './mis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BudgetType } from '@cas/shared';
import { Response } from 'express';

@ApiTags('MIS')
@Controller('mis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MisController {
  constructor(private readonly misService: MisService) {}

  @Post('yearly-budget')
  @ApiOperation({ summary: 'Create or draft yearly budget entry' })
  async createYearlyBudget(@Body() body: any, @CurrentUser() user: any) {
    return this.misService.createYearlyBudget(body, user);
  }

  @Post('monthly-expense')
  @ApiOperation({ summary: 'Create or draft monthly expense entry' })
  async createMonthlyExpense(@Body() body: any, @CurrentUser() user: any) {
    return this.misService.createMonthlyExpense(body, user);
  }

  @Get('entries/my')
  @ApiOperation({ summary: 'Get entries created by logged-in user' })
  async getMyEntries(@CurrentUser() user: any) {
    return this.misService.findMyEntries(user.id);
  }

  @Get('entries/pending-approvals')
  @ApiOperation({ summary: 'Get MIS entries pending approval' })
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.misService.findPendingApprovals(user);
  }

  @Get('yearly-budget/:id')
  @ApiOperation({ summary: 'Get single yearly budget details' })
  async getOneYearly(@Param('id') id: string) {
    return this.misService.findOneYearly(id);
  }

  @Get('monthly-expense/:id')
  @ApiOperation({ summary: 'Get single monthly expense details' })
  async getOneMonthly(@Param('id') id: string) {
    return this.misService.findOneMonthly(id);
  }

  @Get('reports/global-search')
  @ApiOperation({ summary: 'MIS global search report with manpower efficiency' })
  async searchGlobalReport(@Query() query: any, @CurrentUser() user: any) {
    return this.misService.searchGlobalReport(query, user);
  }

  @Get('reports/global-search/export')
  @ApiOperation({ summary: 'Export MIS global search report to Excel' })
  async exportExcel(@Query() query: any, @CurrentUser() user: any, @Res() res: Response) {
    return this.misService.exportGlobalReportExcel(query, user, res);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get MIS dashboard statistics with Capex/Opex toggle' })
  async getDashboardStats(@Query('type') type: BudgetType = BudgetType.CAPEX, @CurrentUser() user: any) {
    return this.misService.getDashboardStats(type, user);
  }
}
