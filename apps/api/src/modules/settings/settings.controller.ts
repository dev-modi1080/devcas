import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@cas/shared';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings' })
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Post()
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update system setting (CAS Admin only)' })
  async update(@Body() body: { key: string; value: string; description?: string }) {
    return this.settingsService.updateSetting(body.key, body.value, body.description);
  }
}
