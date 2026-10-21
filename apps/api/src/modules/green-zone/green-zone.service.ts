import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { WorkflowService } from '../workflow/workflow.service';
import { calculatePlantationArea, RequestType, WorkflowStatus, WorkflowAction, UserRole } from '@cas/shared';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class GreenZoneService {
  constructor(
    private db: ShiftService,
    private workflowService: WorkflowService,
  ) {}

  private async generateRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.greenZoneRequest.count();
    const nextSeq = String(count + 1).padStart(6, '0');
    return `GZ-${year}-${nextSeq}`;
  }

  async create(
    data: {
      type?: RequestType;
      parentRequestId?: string;
      businessId: string;
      companyId: string;
      locationId: string;
      siteLocationId: string;
      greenZoneId: string;
      plantationCategoryId?: string;
      plantationTypeId?: string;
      botanicalId?: string;
      irrigationTypeId?: string;
      distanceRowToRowM?: number;
      distancePlantToPlantM?: number;
      treeCount?: number;
      palmCount?: number;
      mangroveCount?: number;
      shrubCount?: number;
      groundCoverArea?: number;
      overlapWithCover?: boolean;
      plantationMonthYear?: string;
      remarks?: string;
      mortalityCount?: number;
      photos?: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
      isSubmit?: boolean;
    },
    user: any,
  ) {
    const type = data.type || RequestType.CREATION;

    // Mortality request validations
    if (type === RequestType.MORTALITY) {
      if (!data.parentRequestId) {
        throw new BadRequestException('Parent creation request is required for mortality request');
      }
      const parent = await this.db.greenZoneRequest.findUnique({
        where: { id: data.parentRequestId },
        include: { childMortalities: { where: { status: WorkflowStatus.COMPLETE } } },
      });
      if (!parent || parent.status !== WorkflowStatus.COMPLETE) {
        throw new BadRequestException('Invalid or incomplete parent request');
      }

      const originalCount = parent.treeCount || parent.palmCount || parent.mangroveCount || parent.shrubCount || 0;
      const alreadyMortality = parent.childMortalities.reduce((sum, m) => sum + (m.mortalityCount || 0), 0);
      const remainingLive = originalCount - alreadyMortality;

      if (!data.mortalityCount || data.mortalityCount < 1) {
        throw new BadRequestException('Mortality count must be at least 1');
      }
      if (data.mortalityCount > remainingLive) {
        throw new BadRequestException(`Mortality count (${data.mortalityCount}) exceeds remaining live count (${remainingLive})`);
      }
    }

    // Auto-calculate area for Trees, Palm, Shrubs
    let calculatedArea = 0;
    if (data.treeCount && data.distanceRowToRowM && data.distancePlantToPlantM) {
      calculatedArea = calculatePlantationArea(data.treeCount, data.distanceRowToRowM, data.distancePlantToPlantM);
    } else if (data.palmCount && data.distanceRowToRowM && data.distancePlantToPlantM) {
      calculatedArea = calculatePlantationArea(data.palmCount, data.distanceRowToRowM, data.distancePlantToPlantM);
    } else if (data.shrubCount && data.distanceRowToRowM && data.distancePlantToPlantM) {
      calculatedArea = calculatePlantationArea(data.shrubCount, data.distanceRowToRowM, data.distancePlantToPlantM);
    } else if (data.groundCoverArea) {
      calculatedArea = Number(data.groundCoverArea);
    }

    if (data.isSubmit && (!data.photos || data.photos.length === 0)) {
      throw new BadRequestException('At least one photograph is required to submit a request');
    }

    const requestNo = await this.generateRequestNo();
    const { status, currentLevel } = data.isSubmit
      ? this.workflowService.getInitialStatus(user.role)
      : { status: WorkflowStatus.DRAFT, currentLevel: null };

    return this.db.$transaction(async (tx) => {
      const entity = await tx.greenZoneRequest.create({
        data: {
          requestNo,
          type,
          parentRequestId: data.parentRequestId,
          businessId: data.businessId,
          companyId: data.companyId,
          locationId: data.locationId,
          siteLocationId: data.siteLocationId,
          greenZoneId: data.greenZoneId,
          plantationCategoryId: data.plantationCategoryId,
          plantationTypeId: data.plantationTypeId,
          botanicalId: data.botanicalId,
          irrigationTypeId: data.irrigationTypeId,
          distanceRowToRowM: data.distanceRowToRowM,
          distancePlantToPlantM: data.distancePlantToPlantM,
          treeCount: data.treeCount,
          palmCount: data.palmCount,
          mangroveCount: data.mangroveCount,
          shrubCount: data.shrubCount,
          groundCoverArea: data.groundCoverArea,
          calculatedAreaHa: calculatedArea,
          overlapWithCover: data.overlapWithCover || false,
          plantationMonthYear: data.plantationMonthYear,
          remarks: data.remarks,
          mortalityCount: data.mortalityCount,
          status,
          currentLevel,
          createdById: user.id,
          photos: {
            create: (data.photos || []).map((p) => ({
              fileName: p.fileName,
              fileUrl: p.fileUrl,
              fileSize: p.fileSize,
              mimeType: p.mimeType,
              uploadedById: user.id,
            })),
          },
        },
      });

      const entityType = type === RequestType.MORTALITY ? 'GREEN_ZONE_MORTALITY' : 'GREEN_ZONE_CREATION';

      const instance = await tx.workflowInstance.create({
        data: {
          entityType,
          entityId: entity.id,
          status,
          currentLevel,
          createdById: user.id,
        },
      });

      if (data.isSubmit) {
        await tx.workflowStepHistory.create({
          data: {
            workflowInstanceId: instance.id,
            entityType,
            entityId: entity.id,
            level: 'CREATOR',
            actorId: user.id,
            action: WorkflowAction.SUBMIT,
            remarks: 'Request submitted for approval',
          },
        });
      }

      return entity;
    });
  }

  async findOne(id: string) {
    const request = await this.db.greenZoneRequest.findUnique({
      where: { id },
      include: {
        business: true,
        company: true,
        location: true,
        siteLocation: true,
        greenZone: true,
        plantationCategory: true,
        plantationType: true,
        botanical: true,
        irrigationType: true,
        photos: true,
        parentRequest: true,
        childMortalities: { where: { status: WorkflowStatus.COMPLETE } },
      },
    });

    if (!request) throw new NotFoundException('Green zone request not found');

    const originalCount = request.treeCount || request.palmCount || request.mangroveCount || request.shrubCount || 0;
    const mortalitySum = request.childMortalities.reduce((acc, curr) => acc + (curr.mortalityCount || 0), 0);
    const liveCount = originalCount - mortalitySum;

    return {
      ...request,
      originalPlantCount: originalCount,
      approvedMortalityCount: mortalitySum,
      remainingLiveCount: liveCount,
    };
  }

  async findMyRequests(userId: string) {
    return this.db.greenZoneRequest.findMany({
      where: { createdById: userId },
      include: {
        business: true,
        company: true,
        location: true,
        siteLocation: true,
        plantationType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingApprovals(user: any) {
    let targetStatus: WorkflowStatus;
    if (user.role === UserRole.SITE_SUPERVISOR) {
      targetStatus = WorkflowStatus.PENDING_L1;
    } else if (user.role === UserRole.BU_ADMINISTRATOR) {
      targetStatus = WorkflowStatus.PENDING_L2;
    } else if (user.role === UserRole.CAS_ADMIN) {
      targetStatus = WorkflowStatus.PENDING_L3;
    } else {
      return [];
    }

    const where: any = {
      status: targetStatus,
    };

    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.locationIds?.length) where.locationId = { in: user.locationIds };
      if (user.businessIds?.length) where.businessId = { in: user.businessIds };
    }

    return this.db.greenZoneRequest.findMany({
      where,
      include: {
        business: true,
        company: true,
        location: true,
        siteLocation: true,
        plantationType: true,
        photos: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async searchGlobalReport(filters: any, user: any) {
    const where: any = {};

    // Filter by role access scope
    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.businessIds?.length) where.businessId = { in: user.businessIds };
      if (user.locationIds?.length) where.locationId = { in: user.locationIds };
    }

    if (filters.businessId) where.businessId = filters.businessId;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.siteLocationId) where.siteLocationId = filters.siteLocationId;
    if (filters.plantationCategoryId) where.plantationCategoryId = filters.plantationCategoryId;
    if (filters.plantationTypeId) where.plantationTypeId = filters.plantationTypeId;
    if (filters.botanicalId) where.botanicalId = filters.botanicalId;
    if (filters.greenZoneId) where.greenZoneId = filters.greenZoneId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.plantationMonthYear) where.plantationMonthYear = filters.plantationMonthYear;

    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) where.createdAt.gte = new Date(filters.createdFrom);
      if (filters.createdTo) where.createdAt.lte = new Date(filters.createdTo);
    }

    const page = parseInt(filters.page || '1', 10);
    const pageSize = parseInt(filters.pageSize || '20', 10);
    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      this.db.greenZoneRequest.count({ where }),
      this.db.greenZoneRequest.findMany({
        where,
        include: {
          business: true,
          company: true,
          location: true,
          siteLocation: true,
          greenZone: true,
          plantationCategory: true,
          plantationType: true,
          botanical: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), data };
  }

  async exportGlobalReportExcel(filters: any, user: any, res: Response) {
    const result = await this.searchGlobalReport({ ...filters, page: 1, pageSize: 5000 }, user);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Green Zone Report');

    worksheet.columns = [
      { header: 'Request No', key: 'requestNo', width: 20 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Business', key: 'business', width: 16 },
      { header: 'Company', key: 'company', width: 16 },
      { header: 'Location', key: 'location', width: 18 },
      { header: 'Site Location', key: 'siteLocation', width: 22 },
      { header: 'Green Zone No', key: 'greenZone', width: 18 },
      { header: 'Plantation Type', key: 'plantationType', width: 20 },
      { header: 'Species / Botanical', key: 'botanical', width: 24 },
      { header: 'Plants Count', key: 'count', width: 14 },
      { header: 'Area (Ha.)', key: 'area', width: 14 },
      { header: 'Overlaps?', key: 'overlap', width: 12 },
      { header: 'Plantation Mon-Yr', key: 'monthYear', width: 18 },
      { header: 'Created Date', key: 'createdAt', width: 18 },
    ];

    result.data.forEach((r) => {
      const count = r.treeCount || r.palmCount || r.mangroveCount || r.shrubCount || r.mortalityCount || 0;
      worksheet.addRow({
        requestNo: r.requestNo,
        type: r.type,
        status: r.status,
        business: r.business.code,
        company: r.company.shortName,
        location: r.location.description,
        siteLocation: r.siteLocation.description,
        greenZone: r.greenZone.greenZoneNo,
        plantationType: r.plantationType?.description || '-',
        botanical: r.botanical?.description || '-',
        count,
        area: Number(r.calculatedAreaHa),
        overlap: r.overlapWithCover ? 'Yes' : 'No',
        monthYear: r.plantationMonthYear || '-',
        createdAt: r.createdAt.toISOString().slice(0, 10),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=GreenZone_Global_Report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  async getDashboardStats(user: any) {
    const accessScope: any = {};
    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.businessIds?.length) accessScope.businessId = { in: user.businessIds };
      if (user.locationIds?.length) accessScope.locationId = { in: user.locationIds };
    }

    // Overall stats
    const [overallCreated, overallOpen, overallComplete, overallReject] = await Promise.all([
      this.db.greenZoneRequest.count({ where: accessScope }),
      this.db.greenZoneRequest.count({
        where: {
          ...accessScope,
          status: { in: [WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3] },
        },
      }),
      this.db.greenZoneRequest.count({ where: { ...accessScope, status: WorkflowStatus.COMPLETE } }),
      this.db.greenZoneRequest.count({ where: { ...accessScope, status: WorkflowStatus.REJECTED } }),
    ]);

    // My statistics
    const myScope = { createdById: user.id };
    const [myCreated, myOpen, myCompleted, myCancelled, myDraft] = await Promise.all([
      this.db.greenZoneRequest.count({ where: myScope }),
      this.db.greenZoneRequest.count({
        where: {
          ...myScope,
          status: { in: [WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3] },
        },
      }),
      this.db.greenZoneRequest.count({ where: { ...myScope, status: WorkflowStatus.COMPLETE } }),
      this.db.greenZoneRequest.count({ where: { ...myScope, status: WorkflowStatus.CANCELLED } }),
      this.db.greenZoneRequest.count({ where: { ...myScope, status: WorkflowStatus.DRAFT } }),
    ]);

    // Pending action for me (approver inbox count)
    let pendingActionCount = 0;
    if (user.role === UserRole.SITE_SUPERVISOR) {
      pendingActionCount = await this.db.greenZoneRequest.count({
        where: { status: WorkflowStatus.PENDING_L1, ...(user.locationIds?.length ? { locationId: { in: user.locationIds } } : {}) },
      });
    } else if (user.role === UserRole.BU_ADMINISTRATOR) {
      pendingActionCount = await this.db.greenZoneRequest.count({
        where: { status: WorkflowStatus.PENDING_L2, ...(user.businessIds?.length ? { businessId: { in: user.businessIds } } : {}) },
      });
    } else if (user.role === UserRole.CAS_ADMIN) {
      pendingActionCount = await this.db.greenZoneRequest.count({
        where: { status: WorkflowStatus.PENDING_L3 },
      });
    }

    // Action taken by me
    const actionTakenCount = await this.db.workflowStepHistory.count({
      where: {
        actorId: user.id,
        action: { in: [WorkflowAction.APPROVE, WorkflowAction.REJECT, WorkflowAction.RETURN] },
      },
    });

    // Month-wise request counts for recent months
    const requests = await this.db.greenZoneRequest.findMany({
      where: accessScope,
      select: { createdAt: true, status: true },
    });

    const monthCounts: Record<string, { month: string; total: number; completed: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    months.forEach((m) => {
      monthCounts[m] = { month: m, total: 0, completed: 0 };
    });

    requests.forEach((r) => {
      const d = new Date(r.createdAt);
      if (d.getFullYear() === currentYear) {
        const m = months[d.getMonth()];
        if (monthCounts[m]) {
          monthCounts[m].total++;
          if (r.status === WorkflowStatus.COMPLETE) monthCounts[m].completed++;
        }
      }
    });

    return {
      overall: {
        created: overallCreated,
        open: overallOpen,
        complete: overallComplete,
        reject: overallReject,
      },
      myStats: {
        created: myCreated,
        open: myOpen,
        completed: myCompleted,
        cancelled: myCancelled,
        pendingAction: pendingActionCount,
        actionTaken: actionTakenCount,
        draft: myDraft,
      },
      monthlyChart: Object.values(monthCounts),
    };
  }
}
