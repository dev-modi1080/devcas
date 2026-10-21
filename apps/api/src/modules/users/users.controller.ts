import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@cas/shared';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with access mappings' })
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('active') active?: string,
  ) {
    return this.usersService.findAll({
      search,
      role,
      active: active !== undefined ? active === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Create new user (CAS Admin only)' })
  async create(
    @Body()
    body: {
      name: string;
      email: string;
      employeeCode: string;
      role: UserRole;
      businessIds?: string[];
      locationIds?: string[];
      siteLocationIds?: string[];
    },
  ) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Update user and mappings (CAS Admin only)' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      employeeCode?: string;
      role?: UserRole;
      active?: boolean;
      businessIds?: string[];
      locationIds?: string[];
      siteLocationIds?: string[];
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.CAS_ADMIN)
  @ApiOperation({ summary: 'Toggle user active/inactive (CAS Admin only)' })
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
