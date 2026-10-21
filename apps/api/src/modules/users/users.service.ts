import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { UserRole } from '@cas/shared';

@Injectable()
export class UsersService {
  constructor(private db: ShiftService) {}

  async findAll(query?: { search?: string; role?: UserRole; active?: boolean }) {
    const where: any = {};
    if (query?.role) where.role = query.role;
    if (query?.active !== undefined) where.active = query.active;
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.db.user.findMany({
      where,
      include: {
        userBusinesses: { include: { business: true } },
        userLocations: { include: { location: true } },
        userSiteLocations: { include: { siteLocation: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      include: {
        userBusinesses: { include: { business: true } },
        userLocations: { include: { location: true } },
        userSiteLocations: { include: { siteLocation: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: {
    name: string;
    email: string;
    employeeCode: string;
    role: UserRole;
    businessIds?: string[];
    locationIds?: string[];
    siteLocationIds?: string[];
  }) {
    const existing = await this.db.user.findFirst({
      where: { OR: [{ email: data.email }, { employeeCode: data.employeeCode }] },
    });
    if (existing) {
      throw new BadRequestException('User with this email or employee code already exists');
    }

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          employeeCode: data.employeeCode,
          role: data.role,
        },
      });

      if (data.businessIds?.length) {
        await tx.userBusiness.createMany({
          data: data.businessIds.map((bId) => ({ userId: user.id, businessId: bId })),
        });
      }

      if (data.locationIds?.length) {
        await tx.userLocation.createMany({
          data: data.locationIds.map((lId) => ({ userId: user.id, locationId: lId })),
        });
      }

      if (data.siteLocationIds?.length) {
        await tx.userSiteLocation.createMany({
          data: data.siteLocationIds.map((sId) => ({ userId: user.id, siteLocationId: sId })),
        });
      }

      return user;
    });
  }

  async update(
    id: string,
    data: {
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
    await this.findOne(id);

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          employeeCode: data.employeeCode,
          role: data.role,
          active: data.active,
        },
      });

      if (data.businessIds !== undefined) {
        await tx.userBusiness.deleteMany({ where: { userId: id } });
        if (data.businessIds.length) {
          await tx.userBusiness.createMany({
            data: data.businessIds.map((bId) => ({ userId: id, businessId: bId })),
          });
        }
      }

      if (data.locationIds !== undefined) {
        await tx.userLocation.deleteMany({ where: { userId: id } });
        if (data.locationIds.length) {
          await tx.userLocation.createMany({
            data: data.locationIds.map((lId) => ({ userId: id, locationId: lId })),
          });
        }
      }

      if (data.siteLocationIds !== undefined) {
        await tx.userSiteLocation.deleteMany({ where: { userId: id } });
        if (data.siteLocationIds.length) {
          await tx.userSiteLocation.createMany({
            data: data.siteLocationIds.map((sId) => ({ userId: id, siteLocationId: sId })),
          });
        }
      }

      return user;
    });
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.db.user.update({
      where: { id },
      data: { active: !user.active },
    });
  }
}
