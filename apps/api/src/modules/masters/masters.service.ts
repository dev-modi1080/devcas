import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MastersService {
  constructor(private db: ShiftService) {}

  // =================== BUSINESS ===================
  async getBusinesses(includeInactive = false) {
    return this.db.business.findMany({
      where: includeInactive ? {} : { isDeleted: false },
      orderBy: { code: 'asc' },
    });
  }

  async createBusiness(data: { code: string; description: string; userId?: string }) {
    const existing = await this.db.business.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`Business code ${data.code} already exists`);
    return this.db.business.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        createdById: data.userId,
      },
    });
  }

  async updateBusiness(id: string, data: { code?: string; description?: string; isDeleted?: boolean; userId?: string }) {
    return this.db.business.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        isDeleted: data.isDeleted,
        updatedById: data.userId,
      },
    });
  }

  // =================== COMPANY ===================
  async getCompanies(businessId?: string, includeInactive = false) {
    const where: any = includeInactive ? {} : { isDeleted: false };
    if (businessId) where.businessId = businessId;
    return this.db.company.findMany({
      where,
      include: { business: true },
      orderBy: { code: 'asc' },
    });
  }

  async createCompany(data: { businessId: string; code: string; shortName: string; description: string; userId?: string }) {
    return this.db.company.create({
      data: {
        businessId: data.businessId,
        code: data.code.toUpperCase(),
        shortName: data.shortName,
        description: data.description,
        createdById: data.userId,
      },
    });
  }

  async updateCompany(id: string, data: { code?: string; shortName?: string; description?: string; isDeleted?: boolean; userId?: string }) {
    return this.db.company.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        shortName: data.shortName,
        description: data.description,
        isDeleted: data.isDeleted,
        updatedById: data.userId,
      },
    });
  }

  // =================== LOCATION ===================
  async getLocations(includeInactive = false) {
    return this.db.location.findMany({
      where: includeInactive ? {} : { isDeleted: false },
      orderBy: { code: 'asc' },
    });
  }

  async createLocation(data: { code: string; description: string; userId?: string }) {
    const existing = await this.db.location.findUnique({ where: { code: data.code } });
    if (existing) throw new BadRequestException(`Location code ${data.code} already exists`);
    return this.db.location.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        createdById: data.userId,
      },
    });
  }

  async updateLocation(id: string, data: { code?: string; description?: string; isDeleted?: boolean; userId?: string }) {
    return this.db.location.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        isDeleted: data.isDeleted,
        updatedById: data.userId,
      },
    });
  }

  // =================== SITE LOCATION ===================
  async getSiteLocations(locationId?: string, includeInactive = false) {
    const where: any = includeInactive ? {} : { isDeleted: false };
    if (locationId) where.locationId = locationId;
    return this.db.siteLocation.findMany({
      where,
      include: { location: true },
      orderBy: { code: 'asc' },
    });
  }

  async createSiteLocation(data: { locationId: string; code: string; description: string; userId?: string }) {
    return this.db.siteLocation.create({
      data: {
        locationId: data.locationId,
        code: data.code.toUpperCase(),
        description: data.description,
        createdById: data.userId,
      },
    });
  }

  async updateSiteLocation(id: string, data: { code?: string; description?: string; isDeleted?: boolean; userId?: string }) {
    return this.db.siteLocation.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        isDeleted: data.isDeleted,
        updatedById: data.userId,
      },
    });
  }

  // =================== GREEN ZONE ===================
  async getGreenZones(filters?: { businessId?: string; companyId?: string; locationId?: string; siteLocationId?: string }) {
    const where: any = { isDeleted: false };
    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.companyId) where.companyId = filters.companyId;
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.siteLocationId) where.siteLocationId = filters.siteLocationId;

    return this.db.greenZone.findMany({
      where,
      include: {
        business: true,
        company: true,
        location: true,
        siteLocation: true,
      },
      orderBy: { greenZoneNo: 'asc' },
    });
  }

  async createGreenZone(data: {
    businessId: string;
    companyId: string;
    locationId: string;
    siteLocationId: string;
    greenZoneNo: string;
    description?: string;
    userId?: string;
  }) {
    const existing = await this.db.greenZone.findUnique({ where: { greenZoneNo: data.greenZoneNo } });
    if (existing) throw new BadRequestException(`Green Zone No ${data.greenZoneNo} already exists`);

    return this.db.greenZone.create({
      data: {
        businessId: data.businessId,
        companyId: data.companyId,
        locationId: data.locationId,
        siteLocationId: data.siteLocationId,
        greenZoneNo: data.greenZoneNo,
        description: data.description,
        createdById: data.userId,
      },
    });
  }

  // =================== MODULE MASTERS ===================
  async getPlantationCategories() {
    return this.db.plantationCategory.findMany({ where: { isDeleted: false }, orderBy: { code: 'asc' } });
  }

  async getPlantationTypes() {
    return this.db.plantationType.findMany({
      where: { isDeleted: false },
      include: {
        botanicals: { where: { isDeleted: false }, orderBy: { code: 'asc' } },
        distanceRowToRows: { where: { isDeleted: false } },
        distancePlantToPlants: { where: { isDeleted: false } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getBotanicals(plantationTypeId?: string) {
    const where: any = { isDeleted: false };
    if (plantationTypeId) where.plantationTypeId = plantationTypeId;
    return this.db.botanical.findMany({ where, include: { plantationType: true }, orderBy: { description: 'asc' } });
  }

  async getIrrigationTypes() {
    return this.db.irrigationType.findMany({ where: { isDeleted: false }, orderBy: { code: 'asc' } });
  }

  async getExpenseCategories() {
    return this.db.expenseCategory.findMany({ where: { isDeleted: false }, orderBy: { code: 'asc' } });
  }

  // =================== CASCADING SELECTIONS ===================
  async getCascadingOptions(user: { businessIds: string[]; locationIds: string[]; siteLocationIds: string[]; role: string }) {
    const isCasAdmin = user.role === 'CAS_ADMIN';

    const businesses = await this.db.business.findMany({
      where: isCasAdmin ? { isDeleted: false } : { id: { in: user.businessIds }, isDeleted: false },
      orderBy: { code: 'asc' },
    });

    const locations = await this.db.location.findMany({
      where: isCasAdmin ? { isDeleted: false } : { id: { in: user.locationIds }, isDeleted: false },
      orderBy: { code: 'asc' },
    });

    const siteLocations = await this.db.siteLocation.findMany({
      where: isCasAdmin ? { isDeleted: false } : { id: { in: user.siteLocationIds }, isDeleted: false },
      include: { location: true },
      orderBy: { code: 'asc' },
    });

    const plantationTypes = await this.getPlantationTypes();
    const plantationCategories = await this.getPlantationCategories();
    const irrigationTypes = await this.getIrrigationTypes();
    const expenseCategories = await this.getExpenseCategories();

    return {
      businesses,
      locations,
      siteLocations,
      plantationTypes,
      plantationCategories,
      irrigationTypes,
      expenseCategories,
    };
  }

  // =================== EXCEL EXPORT & IMPORT ===================
  async exportMasterToExcel(masterType: string, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(masterType);

    if (masterType === 'businesses') {
      const data = await this.db.business.findMany({ orderBy: { code: 'asc' } });
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Business Short Code', key: 'code', width: 25 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
      ];
      data.forEach((b) => worksheet.addRow({ id: b.id, code: b.code, description: b.description, status: b.isDeleted ? 'Inactive' : 'Active' }));
    } else if (masterType === 'locations') {
      const data = await this.db.location.findMany({ orderBy: { code: 'asc' } });
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Location Code', key: 'code', width: 25 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Status', key: 'status', width: 15 },
      ];
      data.forEach((l) => worksheet.addRow({ id: l.id, code: l.code, description: l.description, status: l.isDeleted ? 'Inactive' : 'Active' }));
    } else if (masterType === 'green-zones') {
      const data = await this.getGreenZones();
      worksheet.columns = [
        { header: 'Green Zone No', key: 'greenZoneNo', width: 25 },
        { header: 'Business', key: 'business', width: 20 },
        { header: 'Company', key: 'company', width: 20 },
        { header: 'Location', key: 'location', width: 20 },
        { header: 'Site Location', key: 'siteLocation', width: 25 },
        { header: 'Description', key: 'description', width: 30 },
      ];
      data.forEach((gz) =>
        worksheet.addRow({
          greenZoneNo: gz.greenZoneNo,
          business: gz.business.code,
          company: gz.company.code,
          location: gz.location.code,
          siteLocation: gz.siteLocation.code,
          description: gz.description || '',
        }),
      );
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${masterType}_export.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }
}
