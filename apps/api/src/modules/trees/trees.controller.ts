import { Controller, Get, Post, Body, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TreesService } from './trees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '@cas/shared';
import { Response } from 'express';

@ApiTags('100 Million Trees')
@Controller('trees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post('targets')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create or update yearly target (CAS Admin only)' })
  async createOrUpdateTarget(@Body() body: any, @CurrentUser() user: any) {
    return this.treesService.createOrUpdateTarget(body, user);
  }

  @Get('targets')
  @ApiOperation({ summary: 'List targets with edit history' })
  async getTargets(@Query() query: any) {
    return this.treesService.getTargets(query);
  }

  @Post('opening-balance')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Set opening balance for site location (CAS Admin only)' })
  async setOpeningBalance(@Body() body: any, @CurrentUser() user: any) {
    return this.treesService.setOpeningBalance(body, user);
  }

  @Get('opening-balances')
  @ApiOperation({ summary: 'List opening balances' })
  async getOpeningBalances(@Query() query: any) {
    return this.treesService.getOpeningBalances(query);
  }

  @Get('report')
  @ApiOperation({ summary: 'Generate 100 Million Trees Progress Report' })
  async getReport(@Query() query: any) {
    return this.treesService.generateReport(query);
  }

  @Get('report/export/excel')
  @ApiOperation({ summary: 'Export 100 Million Trees Report to Excel' })
  async exportExcel(@Query() query: any, @Res() res: Response) {
    return this.treesService.exportReportExcel(query, res);
  }

  @Get('report/export/pdf')
  @ApiOperation({ summary: 'Export 100 Million Trees Report to PDF' })
  async exportPdf(@Query() query: any, @Res() res: Response) {
    return this.treesService.exportReportPdf(query, res);
  }
}
