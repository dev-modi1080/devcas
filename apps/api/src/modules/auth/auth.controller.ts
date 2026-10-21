import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('dev-users')
  @ApiOperation({ summary: 'Get list of users for DEV_LOGIN mode' })
  async getDevUsers() {
    return this.authService.getDevUsers();
  }

  @Post('dev-login')
  @ApiOperation({ summary: 'Login as any user in DEV_LOGIN mode' })
  async devLogin(@Body('userId') userId: string) {
    return this.authService.devLogin(userId);
  }

  @Post('sso/simulate')
  @ApiOperation({ summary: 'Simulate SSO Login callback' })
  async simulateSso(
    @Body() body: { email: string; name: string; employeeCode?: string },
  ) {
    return this.authService.ssoCallback(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user and access permissions' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get auth mode configuration' })
  getAuthConfig() {
    return {
      authMode: process.env.AUTH_MODE || 'dev',
      oidcConfigured: !!(process.env.OIDC_CLIENT_ID && process.env.OIDC_ISSUER),
    };
  }
}
