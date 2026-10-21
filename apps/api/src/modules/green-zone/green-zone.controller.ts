import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GreenZoneService } from './green-zone.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Response } from 'express';

@ApiTags('Green Zone')
@Controller('green-zone')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GreenZoneController {
  constructor(private readonly greenZoneService: GreenZoneService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Create or draft Green Zone request (Creation or Mortality)' })
  async create(@Body() body: any, @CurrentUser() user: any) {
    return this.greenZoneService.create(body, user);
  }

  @Get('requests/my')
  @ApiOperation({ summary: 'Get requests created by the logged-in user' })
  async getMyRequests(@CurrentUser() user: any) {
    return this.greenZoneService.findMyRequests(user.id);
  }

  @Get('requests/pending-approvals')
  @ApiOperation({ summary: 'Get requests pending approval for the current user' })
  async getPendingApprovals(@CurrentUser() user: any) {
    return this.greenZoneService.findPendingApprovals(user);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get single Green Zone request details' })
  async getOne(@Param('id') id: string) {
    return this.greenZoneService.findOne(id);
  }

  @Get('reports/global-search')
  @ApiOperation({ summary: 'Global search report with filters' })
  async searchGlobalReport(@Query() query: any, @CurrentUser() user: any) {
    return this.greenZoneService.searchGlobalReport(query, user);
  }

  @Get('reports/global-search/export')
  @ApiOperation({ summary: 'Export global search report to Excel' })
  async exportExcel(@Query() query: any, @CurrentUser() user: any, @Res() res: Response) {
    return this.greenZoneService.exportGlobalReportExcel(query, user, res);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get Green Zone dashboard statistics' })
  async getDashboardStats(@CurrentUser() user: any) {
    return this.greenZoneService.getDashboardStats(user);
  }
}
