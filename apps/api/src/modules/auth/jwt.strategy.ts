import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ShiftService } from '../../shift/shift.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private db: ShiftService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'cas_digital_platform_secret_key_2026_super_secure_jwt',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      include: {
        userBusinesses: { select: { businessId: true } },
        userLocations: { select: { locationId: true } },
        userSiteLocations: { select: { siteLocationId: true } },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      employeeCode: user.employeeCode,
      role: user.role,
      businessIds: user.userBusinesses.map((b) => b.businessId),
      locationIds: user.userLocations.map((l) => l.locationId),
      siteLocationIds: user.userSiteLocations.map((s) => s.siteLocationId),
    };
  }
}
