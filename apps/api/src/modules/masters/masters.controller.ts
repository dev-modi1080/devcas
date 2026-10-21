import { Controller, Get, Post, Put, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MastersService } from './masters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserRole } from '@cas/shared';
import { Response } from 'express';

@ApiTags('Masters')
@Controller('masters')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MastersController {
  constructor(private readonly mastersService: MastersService) {}

  @Get('cascading')
  @ApiOperation({ summary: 'Get cascading master options based on user access' })
  async getCascadingOptions(@CurrentUser() user: any) {
    return this.mastersService.getCascadingOptions(user);
  }

  @Get('businesses')
  @ApiOperation({ summary: 'Get all businesses' })
  async getBusinesses(@Query('includeInactive') includeInactive?: string) {
    return this.mastersService.getBusinesses(includeInactive === 'true');
  }

  @Post('businesses')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create business (Admin)' })
  async createBusiness(@Body() body: { code: string; description: string }, @CurrentUser() user: any) {
    return this.mastersService.createBusiness({ ...body, userId: user.id });
  }

  @Put('businesses/:id')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update business (Admin)' })
  async updateBusiness(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.updateBusiness(id, { ...body, userId: user.id });
  }

  @Get('companies')
  @ApiOperation({ summary: 'Get companies, optionally filtered by businessId' })
  async getCompanies(@Query('businessId') businessId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.mastersService.getCompanies(businessId, includeInactive === 'true');
  }

  @Post('companies')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create company (Admin)' })
  async createCompany(@Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.createCompany({ ...body, userId: user.id });
  }

  @Put('companies/:id')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update company (Admin)' })
  async updateCompany(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.updateCompany(id, { ...body, userId: user.id });
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  async getLocations(@Query('includeInactive') includeInactive?: string) {
    return this.mastersService.getLocations(includeInactive === 'true');
  }

  @Post('locations')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create location (Admin)' })
  async createLocation(@Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.createLocation({ ...body, userId: user.id });
  }

  @Put('locations/:id')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update location (Admin)' })
  async updateLocation(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.updateLocation(id, { ...body, userId: user.id });
  }

  @Get('site-locations')
  @ApiOperation({ summary: 'Get site locations, optionally filtered by locationId' })
  async getSiteLocations(@Query('locationId') locationId?: string, @Query('includeInactive') includeInactive?: string) {
    return this.mastersService.getSiteLocations(locationId, includeInactive === 'true');
  }

  @Post('site-locations')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create site location (Admin)' })
  async createSiteLocation(@Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.createSiteLocation({ ...body, userId: user.id });
  }

  @Put('site-locations/:id')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update site location (Admin)' })
  async updateSiteLocation(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.updateSiteLocation(id, { ...body, userId: user.id });
  }

  @Get('green-zones')
  @ApiOperation({ summary: 'Get green zones filtered by hierarchy' })
  async getGreenZones(@Query() query: any) {
    return this.mastersService.getGreenZones(query);
  }

  @Post('green-zones')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create green zone (Admin)' })
  async createGreenZone(@Body() body: any, @CurrentUser() user: any) {
    return this.mastersService.createGreenZone({ ...body, userId: user.id });
  }

  @Get('plantation-types')
  @ApiOperation({ summary: 'Get plantation types with botanicals and spacing master values' })
  async getPlantationTypes() {
    return this.mastersService.getPlantationTypes();
  }

  @Get('plantation-categories')
  @ApiOperation({ summary: 'Get plantation categories' })
  async getPlantationCategories() {
    return this.mastersService.getPlantationCategories();
  }

  @Get('botanicals')
  @ApiOperation({ summary: 'Get botanicals, optionally filtered by plantationTypeId' })
  async getBotanicals(@Query('plantationTypeId') plantationTypeId?: string) {
    return this.mastersService.getBotanicals(plantationTypeId);
  }

  @Get('irrigation-types')
  @ApiOperation({ summary: 'Get irrigation types' })
  async getIrrigationTypes() {
    return this.mastersService.getIrrigationTypes();
  }

  @Get('expense-categories')
  @ApiOperation({ summary: 'Get expense categories' })
  async getExpenseCategories() {
    return this.mastersService.getExpenseCategories();
  }

  @Get('export/:masterType')
  @ApiOperation({ summary: 'Export master to Excel' })
  async exportToExcel(@Param('masterType') masterType: string, @Res() res: Response) {
    return this.mastersService.exportMasterToExcel(masterType, res);
  }
}
