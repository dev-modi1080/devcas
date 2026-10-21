import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { WorkflowService } from '../workflow/workflow.service';
import {
  getFiscalYear,
  isWithinEntryWindow,
  calculateManpowerEfficiency,
  BudgetType,
  WorkflowStatus,
  WorkflowAction,
  UserRole,
} from '@cas/shared';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MisService {
  constructor(
    private db: ShiftService,
    private workflowService: WorkflowService,
  ) {}

  private async generateYearlyRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.misYearlyBudget.count();
    const seq = String(count + 1).padStart(6, '0');
    return `MISY-${year}-${seq}`;
  }

  private async generateMonthlyRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.db.misMonthlyExpense.count();
    const seq = String(count + 1).padStart(6, '0');
    return `MISM-${year}-${seq}`;
  }

  // ==================== YEARLY BUDGET ====================
  async createYearlyBudget(
    data: {
      type: BudgetType;
      businessId: string;
      companyId: string;
      locationId: string;
      siteLocationId: string;
      budgetAmount: number;
      remarks?: string;
      attachments?: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
      isSubmit?: boolean;
    },
    user: any,
  ) {
    const now = new Date();
    const fiscalYear = getFiscalYear(now);
    const isAprilWindow = now.getMonth() === 3 && isWithinEntryWindow(now, 1, 10); // April is month 3

    // Check setting for blocking late entry
    if (!isAprilWindow) {
      const blockLateSetting = await this.db.systemSetting.findUnique({
        where: { key: 'BLOCK_LATE_MIS_ENTRY' },
      });
      if (blockLateSetting?.value === 'true') {
        throw new BadRequestException('Yearly budget entry is closed. Entry is only permitted from 1 to 10 April.');
      }
    }

    // Attachments must be PDF only
    if (data.attachments) {
      for (const att of data.attachments) {
        if (!att.fileName.toLowerCase().endsWith('.pdf') && att.mimeType !== 'application/pdf') {
          throw new BadRequestException(`File ${att.fileName} is invalid. Only PDF attachments are allowed.`);
        }
      }
    }

    const requestNo = await this.generateYearlyRequestNo();
    const { status, currentLevel } = data.isSubmit
      ? this.workflowService.getInitialStatus(user.role)
      : { status: WorkflowStatus.DRAFT, currentLevel: null };

    return this.db.$transaction(async (tx) => {
      const entity = await tx.misYearlyBudget.create({
        data: {
          requestNo,
          type: data.type,
          businessId: data.businessId,
          companyId: data.companyId,
          locationId: data.locationId,
          siteLocationId: data.siteLocationId,
          fiscalYear,
          budgetAmount: data.budgetAmount,
          remarks: data.remarks,
          isLateEntry: !isAprilWindow,
          status,
          currentLevel,
          createdById: user.id,
          attachments: {
            create: (data.attachments || []).map((att) => ({
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
              uploadedById: user.id,
            })),
          },
        },
      });

      const instance = await tx.workflowInstance.create({
        data: {
          entityType: 'MIS_YEARLY',
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
            entityType: 'MIS_YEARLY',
            entityId: entity.id,
            level: 'CREATOR',
            actorId: user.id,
            action: WorkflowAction.SUBMIT,
            remarks: 'Yearly budget submitted for approval',
          },
        });
      }

      return entity;
    });
  }

  // ==================== MONTHLY EXPENSE ====================
  async createMonthlyExpense(
    data: {
      type: BudgetType;
      businessId: string;
      companyId: string;
      locationId: string;
      siteLocationId: string;
      expenseCategoryId: string;
      month: string; // YYYY-MM
      consumedCost: number;
      maleWorkforceCount?: number;
      femaleWorkforceCount?: number;
      areaHa?: number;
      remarks?: string;
      attachments?: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
      isSubmit?: boolean;
    },
    user: any,
  ) {
    const now = new Date();
    const currentFY = getFiscalYear(now);
    const entryDate = new Date(`${data.month}-01`);
    const entryFY = getFiscalYear(entryDate);

    // Rule: previous months of current fiscal year only; no future months
    if (entryDate > now) {
      throw new BadRequestException('Future months are not allowed for expense entry');
    }
    if (entryFY !== currentFY) {
      throw new BadRequestException(`Selected month must be within current fiscal year (${currentFY})`);
    }

    const isWindow = isWithinEntryWindow(now, 1, 10);
    if (!isWindow) {
      const blockLateSetting = await this.db.systemSetting.findUnique({
        where: { key: 'BLOCK_LATE_MIS_ENTRY' },
      });
      if (blockLateSetting?.value === 'true') {
        throw new BadRequestException('Monthly expense entry is closed. Entry is only permitted from 1st to 10th of each month.');
      }
    }

    // Attachments: PDF only
    if (data.attachments) {
      for (const att of data.attachments) {
        if (!att.fileName.toLowerCase().endsWith('.pdf') && att.mimeType !== 'application/pdf') {
          throw new BadRequestException(`File ${att.fileName} is invalid. Only PDF attachments are allowed.`);
        }
      }
    }

    const requestNo = await this.generateMonthlyRequestNo();
    const { status, currentLevel } = data.isSubmit
      ? this.workflowService.getInitialStatus(user.role)
      : { status: WorkflowStatus.DRAFT, currentLevel: null };

    return this.db.$transaction(async (tx) => {
      const entity = await tx.misMonthlyExpense.create({
        data: {
          requestNo,
          type: data.type,
          businessId: data.businessId,
          companyId: data.companyId,
          locationId: data.locationId,
          siteLocationId: data.siteLocationId,
          expenseCategoryId: data.expenseCategoryId,
          month: data.month,
          fiscalYear: currentFY,
          consumedCost: data.consumedCost,
          maleWorkforceCount: data.maleWorkforceCount || 0,
          femaleWorkforceCount: data.femaleWorkforceCount || 0,
          areaHa: data.areaHa || 0,
          remarks: data.remarks,
          isLateEntry: !isWindow,
          status,
          currentLevel,
          createdById: user.id,
          attachments: {
            create: (data.attachments || []).map((att) => ({
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
              uploadedById: user.id,
            })),
          },
        },
      });

      const instance = await tx.workflowInstance.create({
        data: {
          entityType: 'MIS_MONTHLY',
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
            entityType: 'MIS_MONTHLY',
            entityId: entity.id,
            level: 'CREATOR',
            actorId: user.id,
            action: WorkflowAction.SUBMIT,
            remarks: 'Monthly expense submitted for approval',
          },
        });
      }

      return entity;
    });
  }

  async findMyEntries(userId: string) {
    const [yearly, monthly] = await Promise.all([
      this.db.misYearlyBudget.findMany({
        where: { createdById: userId },
        include: { business: true, company: true, location: true, siteLocation: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.db.misMonthlyExpense.findMany({
        where: { createdById: userId },
        include: { business: true, company: true, location: true, siteLocation: true, expenseCategory: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { yearly, monthly };
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
      return { yearly: [], monthly: [] };
    }

    const where: any = { status: targetStatus };
    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.locationIds?.length) where.locationId = { in: user.locationIds };
      if (user.businessIds?.length) where.businessId = { in: user.businessIds };
    }

    const [yearly, monthly] = await Promise.all([
      this.db.misYearlyBudget.findMany({
        where,
        include: { business: true, company: true, location: true, siteLocation: true, attachments: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.db.misMonthlyExpense.findMany({
        where,
        include: { business: true, company: true, location: true, siteLocation: true, expenseCategory: true, attachments: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return { yearly, monthly };
  }

  async findOneYearly(id: string) {
    const item = await this.db.misYearlyBudget.findUnique({
      where: { id },
      include: { business: true, company: true, location: true, siteLocation: true, attachments: true },
    });
    if (!item) throw new NotFoundException('Yearly budget not found');
    return item;
  }

  async findOneMonthly(id: string) {
    const item = await this.db.misMonthlyExpense.findUnique({
      where: { id },
      include: { business: true, company: true, location: true, siteLocation: true, expenseCategory: true, attachments: true },
    });
    if (!item) throw new NotFoundException('Monthly expense not found');
    return item;
  }

  // ==================== GLOBAL SEARCH REPORT ====================
  async searchGlobalReport(filters: any, user: any) {
    const where: any = {};
    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.businessIds?.length) where.businessId = { in: user.businessIds };
      if (user.locationIds?.length) where.locationId = { in: user.locationIds };
    }

    if (filters.type) where.type = filters.type;
    if (filters.businessId) where.businessId = filters.businessId;
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.locationId) where.locationId = filters.locationId;
    if (filters.siteLocationId) where.siteLocationId = filters.siteLocationId;
    if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
    if (filters.expenseCategoryId) where.expenseCategoryId = filters.expenseCategoryId;
    if (filters.status) where.status = filters.status;
    if (filters.month) where.month = filters.month;

    const page = parseInt(filters.page || '1', 10);
    const pageSize = parseInt(filters.pageSize || '20', 10);
    const skip = (page - 1) * pageSize;

    const [total, monthlyData] = await Promise.all([
      this.db.misMonthlyExpense.count({ where }),
      this.db.misMonthlyExpense.findMany({
        where,
        include: {
          business: true,
          company: true,
          location: true,
          siteLocation: true,
          expenseCategory: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const enriched = monthlyData.map((m) => {
      const efficiency = calculateManpowerEfficiency(m.maleWorkforceCount, m.femaleWorkforceCount, Number(m.areaHa));
      return {
        ...m,
        manpowerEfficiency: efficiency,
      };
    });

    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), data: enriched };
  }

  async exportGlobalReportExcel(filters: any, user: any, res: Response) {
    const result = await this.searchGlobalReport({ ...filters, page: 1, pageSize: 5000 }, user);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('MIS Expense Report');

    worksheet.columns = [
      { header: 'Request No', key: 'requestNo', width: 20 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Business', key: 'business', width: 16 },
      { header: 'Company', key: 'company', width: 16 },
      { header: 'Location', key: 'location', width: 18 },
      { header: 'Site Location', key: 'siteLocation', width: 22 },
      { header: 'Expense Category', key: 'category', width: 22 },
      { header: 'Month', key: 'month', width: 14 },
      { header: 'Fiscal Year', key: 'fiscalYear', width: 14 },
      { header: 'Consumed Cost (INR)', key: 'cost', width: 20 },
      { header: 'Male Workforce', key: 'male', width: 16 },
      { header: 'Female Workforce', key: 'female', width: 16 },
      { header: 'Area (Ha.)', key: 'area', width: 14 },
      { header: 'Manpower efficiency', key: 'efficiency', width: 22 },
      { header: 'Is Late Entry?', key: 'late', width: 14 },
      { header: 'Created Date', key: 'createdAt', width: 16 },
    ];

    result.data.forEach((r) => {
      worksheet.addRow({
        requestNo: r.requestNo,
        type: r.type,
        status: r.status,
        business: r.business.code,
        company: r.company.shortName,
        location: r.location.description,
        siteLocation: r.siteLocation.description,
        category: r.expenseCategory.description,
        month: r.month,
        fiscalYear: r.fiscalYear,
        cost: Number(r.consumedCost),
        male: r.maleWorkforceCount,
        female: r.femaleWorkforceCount,
        area: Number(r.areaHa),
        efficiency: r.manpowerEfficiency !== null ? r.manpowerEfficiency : '',
        late: r.isLateEntry ? 'Yes' : 'No',
        createdAt: r.createdAt.toISOString().slice(0, 10),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=MIS_Expense_Report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  // ==================== DASHBOARD ====================
  async getDashboardStats(type: BudgetType = BudgetType.CAPEX, user: any) {
    const currentFY = getFiscalYear();
    const accessScope: any = { type, fiscalYear: currentFY };

    if (user.role !== UserRole.CAS_ADMIN) {
      if (user.businessIds?.length) accessScope.businessId = { in: user.businessIds };
      if (user.locationIds?.length) accessScope.locationId = { in: user.locationIds };
    }

    // Overall stats for monthly expenses
    const [overallCreated, overallOpen, overallComplete, overallReject] = await Promise.all([
      this.db.misMonthlyExpense.count({ where: accessScope }),
      this.db.misMonthlyExpense.count({
        where: {
          ...accessScope,
          status: { in: [WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3] },
        },
      }),
      this.db.misMonthlyExpense.count({ where: { ...accessScope, status: WorkflowStatus.COMPLETE } }),
      this.db.misMonthlyExpense.count({ where: { ...accessScope, status: WorkflowStatus.REJECTED } }),
    ]);

    // My stats
    const myScope = { ...accessScope, createdById: user.id };
    const [myCreated, myOpen, myCompleted, myCancelled, myDraft] = await Promise.all([
      this.db.misMonthlyExpense.count({ where: myScope }),
      this.db.misMonthlyExpense.count({
        where: {
          ...myScope,
          status: { in: [WorkflowStatus.PENDING_L1, WorkflowStatus.PENDING_L2, WorkflowStatus.PENDING_L3] },
        },
      }),
      this.db.misMonthlyExpense.count({ where: { ...myScope, status: WorkflowStatus.COMPLETE } }),
      this.db.misMonthlyExpense.count({ where: { ...myScope, status: WorkflowStatus.CANCELLED } }),
      this.db.misMonthlyExpense.count({ where: { ...myScope, status: WorkflowStatus.DRAFT } }),
    ]);

    // Pending action for approver
    let pendingAction = 0;
    if (user.role === UserRole.SITE_SUPERVISOR) {
      pendingAction = await this.db.misMonthlyExpense.count({
        where: { type, status: WorkflowStatus.PENDING_L1, ...(user.locationIds?.length ? { locationId: { in: user.locationIds } } : {}) },
      });
    } else if (user.role === UserRole.BU_ADMINISTRATOR) {
      pendingAction = await this.db.misMonthlyExpense.count({
        where: { type, status: WorkflowStatus.PENDING_L2, ...(user.businessIds?.length ? { businessId: { in: user.businessIds } } : {}) },
      });
    } else if (user.role === UserRole.CAS_ADMIN) {
      pendingAction = await this.db.misMonthlyExpense.count({
        where: { type, status: WorkflowStatus.PENDING_L3 },
      });
    }

    const actionTaken = await this.db.workflowStepHistory.count({
      where: {
        actorId: user.id,
        entityType: { in: ['MIS_YEARLY', 'MIS_MONTHLY'] },
        action: { in: [WorkflowAction.APPROVE, WorkflowAction.REJECT] },
      },
    });

    // Month-wise request bar chart for the current fiscal year
    const monthlyExpenses = await this.db.misMonthlyExpense.findMany({
      where: accessScope,
      select: { month: true, consumedCost: true, status: true },
    });

    const monthBuckets: Record<string, { month: string; totalRequests: number; completedCost: number }> = {};
    monthlyExpenses.forEach((exp) => {
      if (!monthBuckets[exp.month]) {
        monthBuckets[exp.month] = { month: exp.month, totalRequests: 0, completedCost: 0 };
      }
      monthBuckets[exp.month].totalRequests++;
      if (exp.status === WorkflowStatus.COMPLETE) {
        monthBuckets[exp.month].completedCost += Number(exp.consumedCost);
      }
    });

    // Business-wise bar chart: Total Budget (approved yearly entries) vs Consumed (approved monthly entries)
    const businesses = await this.db.business.findMany({ where: { isDeleted: false } });
    const businessComparison = await Promise.all(
      businesses.map(async (b) => {
        const budgets = await this.db.misYearlyBudget.findMany({
          where: { businessId: b.id, type, fiscalYear: currentFY, status: WorkflowStatus.COMPLETE },
          select: { budgetAmount: true },
        });
        const expenses = await this.db.misMonthlyExpense.findMany({
          where: { businessId: b.id, type, fiscalYear: currentFY, status: WorkflowStatus.COMPLETE },
          select: { consumedCost: true },
        });

        const totalBudget = budgets.reduce((sum, item) => sum + Number(item.budgetAmount), 0);
        const totalConsumed = expenses.reduce((sum, item) => sum + Number(item.consumedCost), 0);

        return {
          businessCode: b.code,
          businessName: b.description,
          totalBudget,
          totalConsumed,
          utilizationPercent: totalBudget > 0 ? Number(((totalConsumed / totalBudget) * 100).toFixed(1)) : 0,
        };
      }),
    );

    return {
      type,
      currentFY,
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
        pendingAction,
        actionTaken,
        draft: myDraft,
      },
      monthlyChart: Object.values(monthBuckets),
      businessComparison,
    };
  }
}
