import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ShiftService } from '../../shift/shift.service';

@Injectable()
export class AuthService {
  constructor(
    private db: ShiftService,
    private jwtService: JwtService,
  ) {}

  async getDevUsers() {
    if (process.env.AUTH_MODE !== 'dev') {
      throw new BadRequestException('DEV_LOGIN is only available when AUTH_MODE=dev');
    }

    return this.db.user.findMany({
      where: { active: true },
      include: {
        userBusinesses: { include: { business: true } },
        userLocations: { include: { location: true } },
        userSiteLocations: { include: { siteLocation: true } },
      },
      orderBy: { role: 'asc' },
    });
  }

  async devLogin(userId: string) {
    if (process.env.AUTH_MODE !== 'dev') {
      throw new BadRequestException('DEV_LOGIN is only available when AUTH_MODE=dev');
    }

    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        userBusinesses: true,
        userLocations: true,
        userSiteLocations: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeCode: user.employeeCode,
        role: user.role,
        businessIds: (user.userBusinesses || []).map((b) => b.businessId),
        locationIds: (user.userLocations || []).map((l) => l.locationId),
        siteLocationIds: (user.userSiteLocations || []).map((s) => s.siteLocationId),
      },
    };
  }

  async ssoCallback(userInfo: { email: string; name: string; employeeCode?: string }) {
    let user = await this.db.user.findUnique({
      where: { email: userInfo.email },
      include: {
        userBusinesses: true,
        userLocations: true,
        userSiteLocations: true,
      },
    });

    if (!user) {
      // Auto-provision as SITE_USER if not present
      user = await this.db.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          employeeCode: userInfo.employeeCode || `EMP-${Date.now().toString().slice(-4)}`,
          role: 'SITE_USER',
        },
        include: {
          userBusinesses: true,
          userLocations: true,
          userSiteLocations: true,
        },
      });
    }

    if (!user.active) {
      throw new UnauthorizedException('User account has been deactivated');
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeCode: user.employeeCode,
        role: user.role,
        businessIds: user.userBusinesses.map((b) => b.businessId),
        locationIds: user.userLocations.map((l) => l.locationId),
        siteLocationIds: user.userSiteLocations.map((s) => s.siteLocationId),
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        userBusinesses: { include: { business: true } },
        userLocations: { include: { location: true } },
        userSiteLocations: { include: { siteLocation: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      role: user.role,
      active: user.active,
      businesses: (user.userBusinesses || []).map((b) => b.business).filter(Boolean),
      locations: (user.userLocations || []).map((l) => l.location).filter(Boolean),
      siteLocations: (user.userSiteLocations || []).map((s) => s.siteLocation).filter(Boolean),
      businessIds: (user.userBusinesses || []).map((b) => b.businessId),
      locationIds: (user.userLocations || []).map((l) => l.locationId),
      siteLocationIds: (user.userSiteLocations || []).map((s) => s.siteLocationId),
    };
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    );
  }
}
