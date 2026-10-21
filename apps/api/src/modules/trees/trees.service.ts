import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ShiftService } from '../../shift/shift.service';
import { getFiscalYear, getFiscalYearMonths, getFiscalYearDateRange, WorkflowStatus, UserRole } from '@cas/shared';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
// `pdfmake` publishes a CommonJS constructor — it must be required, not default-imported.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake');

@Injectable()
export class TreesService {
  constructor(private db: ShiftService) {}

  // ==================== YEARLY TARGET ENTRY ====================
  async createOrUpdateTarget(
    data: {
      businessId: string;
      companyId: string;
      locationId: string;
      siteLocationId: string;
      fiscalYear?: string;
      plantationType: string; // Tree, Palm, Mangrove
      targetCount: number;
      remarks?: string;
    },
    user: any,
  ) {
    if (user.role !== UserRole.CAS_ADMIN) {
      throw new ForbiddenException('Only CAS Admin can manage 100 Million Trees targets');
    }

    const allowedTypes = ['Tree', 'Palm', 'Mangrove'];
    if (!allowedTypes.includes(data.plantationType)) {
      throw new BadRequestException('Plantation type must be one of: Tree, Palm, Mangrove');
    }

    const currentFY = getFiscalYear();
    const fiscalYear = data.fiscalYear || currentFY;

    // Check if target already exists
    const existing = await this.db.treeTarget.findUnique({
      where: {
        siteLocationId_fiscalYear_plantationType: {
          siteLocationId: data.siteLocationId,
          fiscalYear,
          plantationType: data.plantationType,
        },
      },
    });

    if (existing) {
      // Rule: CAS Admin can edit target count only, for the current fiscal year only, remarks mandatory
      if (fiscalYear !== currentFY) {
        throw new BadRequestException(`Editing targets is only allowed for the current fiscal year (${currentFY})`);
      }
      if (!data.remarks) {
        throw new BadRequestException('Remarks are mandatory when editing an existing target count');
      }

      return this.db.$transaction(async (tx) => {
        const oldVal = existing.targetCount;
        const updated = await tx.treeTarget.update({
          where: { id: existing.id },
          data: {
            targetCount: data.targetCount,
            remarks: data.remarks,
            updatedById: user.id,
          },
        });

        await tx.treeTargetHistory.create({
          data: {
            treeTargetId: existing.id,
            oldTargetCount: oldVal,
            newTargetCount: data.targetCount,
            remarks: data.remarks,
            changedById: user.id,
          },
        });

        return updated;
      });
    }

    return this.db.treeTarget.create({
      data: {
        businessId: data.businessId,
        companyId: data.companyId,
        locationId: data.locationId,
        siteLocationId: data.siteLocationId,
        fiscalYear,
        plantationType: data.plantationType,
        targetCount: data.targetCount,
        remarks: data.remarks || 'Initial target created',
        createdById: user.id,
      },
    });
  }

  async getTargets(filters?: { businessId?: string; locationId?: string; siteLocationId?: string; fiscalYear?: string }) {
    const where: any = {};
    if (filters?.businessId) where.businessId = filters.businessId;
    if (filters?.locationId) where.locationId = filters.locationId;
    if (filters?.siteLocationId) where.siteLocationId = filters.siteLocationId;
    if (filters?.fiscalYear) where.fiscalYear = filters.fiscalYear;

    return this.db.treeTarget.findMany({
      where,
      include: {
        business: true,
        company: true,
        location: true,
        siteLocation: true,
        histories: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== OPENING BALANCES ====================
  async setOpeningBalance(
    data: {
      siteLocationId: string;
      plantationType: string;
      count: number;
      fiscalYear?: string;
    },
    user: any,
  ) {
    if (user.role !== UserRole.CAS_ADMIN) {
      throw new ForbiddenException('Only CAS Admin can set opening balances');
    }
    const fiscalYear = data.fiscalYear || getFiscalYear();

    return this.db.treeOpeningBalance.upsert({
      where: {
        siteLocationId_fiscalYear_plantationType: {
          siteLocationId: data.siteLocationId,
          fiscalYear,
          plantationType: data.plantationType,
        },
      },
      update: { count: data.count },
      create: {
        siteLocationId: data.siteLocationId,
        plantationType: data.plantationType,
        count: data.count,
        fiscalYear,
        createdById: user.id,
      },
    });
  }

  async getOpeningBalances(query: any) {
    const where: any = {};
    if (query.siteLocationId) where.siteLocationId = query.siteLocationId;
    if (query.fiscalYear) where.fiscalYear = query.fiscalYear;

    return this.db.treeOpeningBalance.findMany({
      where,
      include: {
        siteLocation: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== 100 MILLION TREES REPORT ====================
  async generateReport(filters: {
    businessId?: string;
    companyId?: string;
    locationId?: string;
    siteLocationId?: string;
    fiscalYear?: string;
  }) {
    const fiscalYear = filters.fiscalYear || getFiscalYear();
    const { startDate, endDate } = getFiscalYearDateRange(fiscalYear);
    const months = getFiscalYearMonths(fiscalYear); // 12 months (Apr to Mar)

    // Allowed plantation types for 100M trees
    const allowedTypes = ['Tree', 'Palm', 'Mangrove'];

    // Find all site locations matching filter
    const siteWhere: any = { isDeleted: false };
    if (filters.siteLocationId) siteWhere.id = filters.siteLocationId;
    if (filters.locationId) siteWhere.locationId = filters.locationId;

    const siteLocations = await this.db.siteLocation.findMany({
      where: siteWhere,
      include: {
        location: true,
        greenZones: {
          include: { business: true, company: true },
          take: 1,
        },
      },
    });

    const reportRows: any[] = [];
    let grandTotalTarget = 0;
    let grandTotalCompleted = 0;

    for (let i = 0; i < siteLocations.length; i++) {
      const site = siteLocations[i];
      const gz = site.greenZones[0];
      if (!gz) continue;

      if (filters.businessId && gz.businessId !== filters.businessId) continue;
      if (filters.companyId && gz.companyId !== filters.companyId) continue;

      // 1. Target for this site location in this FY
      const targets = await this.db.treeTarget.findMany({
        where: { siteLocationId: site.id, fiscalYear },
      });
      const targetCount = targets.reduce((acc, t) => acc + t.targetCount, 0);

      // 2. Opening Balance
      const openingBalances = await this.db.treeOpeningBalance.findMany({
        where: { siteLocationId: site.id, fiscalYear },
      });
      const openingCount = openingBalances.reduce((acc, b) => acc + b.count, 0);

      // 3. Approved Green Zone creation requests before this fiscal year start
      const priorCreations = await this.db.greenZoneRequest.findMany({
        where: {
          siteLocationId: site.id,
          status: WorkflowStatus.COMPLETE,
          type: 'CREATION',
          plantationType: { code: { in: allowedTypes } },
          createdAt: { lt: startDate },
        },
      });
      const priorMortalities = await this.db.greenZoneRequest.findMany({
        where: {
          siteLocationId: site.id,
          status: WorkflowStatus.COMPLETE,
          type: 'MORTALITY',
          createdAt: { lt: startDate },
        },
      });

      const priorCreatedCount = priorCreations.reduce(
        (sum, r) => sum + (r.treeCount || r.palmCount || r.mangroveCount || 0),
        0,
      );
      const priorMortalityCount = priorMortalities.reduce((sum, r) => sum + (r.mortalityCount || 0), 0);
      const plantationTillYearStart = openingCount + (priorCreatedCount - priorMortalityCount);

      // 4. Completed Plantation inside this Fiscal Year
      const fyCreations = await this.db.greenZoneRequest.findMany({
        where: {
          siteLocationId: site.id,
          status: WorkflowStatus.COMPLETE,
          type: 'CREATION',
          plantationType: { code: { in: allowedTypes } },
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      const fyMortalities = await this.db.greenZoneRequest.findMany({
        where: {
          siteLocationId: site.id,
          status: WorkflowStatus.COMPLETE,
          type: 'MORTALITY',
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const fyCreatedCount = fyCreations.reduce(
        (sum, r) => sum + (r.treeCount || r.palmCount || r.mangroveCount || 0),
        0,
      );
      const fyMortalityCount = fyMortalities.reduce((sum, r) => sum + (r.mortalityCount || 0), 0);
      const completedFY = Math.max(0, fyCreatedCount - fyMortalityCount);

      const balanceFY = targetCount - completedFY;

      // 5. Month-wise progress breakdown (Apr through Mar)
      const monthlyProgress: Record<string, number> = {};
      months.forEach((m) => {
        const monthCreations = fyCreations.filter((r) => {
          const d = new Date(r.createdAt);
          return d.getMonth() === m.calendarMonth && d.getFullYear() === m.calendarYear;
        });
        const monthMortalities = fyMortalities.filter((r) => {
          const d = new Date(r.createdAt);
          return d.getMonth() === m.calendarMonth && d.getFullYear() === m.calendarYear;
        });

        const created = monthCreations.reduce(
          (sum, r) => sum + (r.treeCount || r.palmCount || r.mangroveCount || 0),
          0,
        );
        const mort = monthMortalities.reduce((sum, r) => sum + (r.mortalityCount || 0), 0);
        monthlyProgress[m.key] = Math.max(0, created - mort);
      });

      grandTotalTarget += targetCount;
      grandTotalCompleted += completedFY;

      reportRows.push({
        srNo: reportRows.length + 1,
        business: gz.business.code,
        company: gz.company.shortName,
        location: site.location.description,
        siteLocation: site.description,
        fiscalYear,
        plantationTillYearStart,
        targetPlantationFY: targetCount,
        completedPlantationFY: completedFY,
        balancePlantationFY: balanceFY,
        monthlyProgress,
      });
    }

    const grandTotalBalance = grandTotalTarget - grandTotalCompleted;
    const achievementPercent =
      grandTotalTarget > 0 ? Number(((grandTotalCompleted / grandTotalTarget) * 100).toFixed(1)) : 0;

    return {
      fiscalYear,
      summary: {
        totalTarget: grandTotalTarget,
        totalCompleted: grandTotalCompleted,
        totalBalance: grandTotalBalance,
        achievementPercent,
      },
      months: months.map((m) => m.key),
      rows: reportRows,
    };
  }

  // ==================== EXCEL EXPORT ====================
  async exportReportExcel(filters: any, res: Response) {
    const data = await this.generateReport(filters);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('100 Million Trees Progress');

    const columns: any[] = [
      { header: 'Sr. No.', key: 'srNo', width: 10 },
      { header: 'Business', key: 'business', width: 16 },
      { header: 'Company', key: 'company', width: 16 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Site Location', key: 'siteLocation', width: 22 },
      { header: 'Fiscal Year', key: 'fiscalYear', width: 14 },
      { header: 'Plantation till this year start (Nos.)', key: 'plantationTillYearStart', width: 26 },
      { header: 'Target Plantation FY (Nos.)', key: 'targetPlantationFY', width: 22 },
      { header: 'Completed Plantation FY (Nos.)', key: 'completedPlantationFY', width: 22 },
      { header: 'Balance Plantation FY (Nos.)', key: 'balancePlantationFY', width: 22 },
    ];

    data.months.forEach((m) => {
      columns.push({ header: m, key: m, width: 10 });
    });

    worksheet.columns = columns;

    data.rows.forEach((r) => {
      const rowObj: any = {
        srNo: r.srNo,
        business: r.business,
        company: r.company,
        location: r.location,
        siteLocation: r.siteLocation,
        fiscalYear: r.fiscalYear,
        plantationTillYearStart: r.plantationTillYearStart,
        targetPlantationFY: r.targetPlantationFY,
        completedPlantationFY: r.completedPlantationFY,
        balancePlantationFY: r.balancePlantationFY,
      };
      data.months.forEach((m) => {
        rowObj[m] = r.monthlyProgress[m] || 0;
      });
      worksheet.addRow(rowObj);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=100_Million_Trees_${data.fiscalYear}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }

  // ==================== PDF EXPORT ====================
  async exportReportPdf(filters: any, res: Response) {
    const data = await this.generateReport(filters);

    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };

    const printer = new PdfPrinter(fonts);

    const tableBody: any[] = [];
    // Header
    tableBody.push([
      { text: 'Sr', style: 'tableHeader' },
      { text: 'Business', style: 'tableHeader' },
      { text: 'Location', style: 'tableHeader' },
      { text: 'Site Location', style: 'tableHeader' },
      { text: 'Opening', style: 'tableHeader' },
      { text: 'Target', style: 'tableHeader' },
      { text: 'Completed', style: 'tableHeader' },
      { text: 'Balance', style: 'tableHeader' },
    ]);

    data.rows.forEach((r) => {
      tableBody.push([
        String(r.srNo),
        r.business,
        r.location,
        r.siteLocation,
        r.plantationTillYearStart.toLocaleString('en-IN'),
        r.targetPlantationFY.toLocaleString('en-IN'),
        r.completedPlantationFY.toLocaleString('en-IN'),
        r.balancePlantationFY.toLocaleString('en-IN'),
      ]);
    });

    const docDefinition: any = {
      pageOrientation: 'landscape',
      content: [
        { text: 'Adani Enterprises Ltd - Corporate Agri Sustainability', style: 'subHeader' },
        { text: `100 Million Trees Initiative - FY ${data.fiscalYear} Progress Report`, style: 'header' },
        {
          text: `Summary: Target: ${data.summary.totalTarget.toLocaleString('en-IN')} | Completed: ${data.summary.totalCompleted.toLocaleString('en-IN')} | Achievement: ${data.summary.achievementPercent}%`,
          style: 'summaryStrip',
        },
        {
          table: {
            headerRows: 1,
            widths: [25, 60, 90, 110, 60, 60, 60, 60],
            body: tableBody,
          },
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
        subHeader: { fontSize: 11, color: '#5B6475', margin: [0, 0, 0, 4] },
        summaryStrip: { fontSize: 12, bold: true, color: '#2670DC', margin: [0, 0, 0, 14] },
        tableHeader: { bold: true, fontSize: 9, color: 'black' },
      },
      defaultStyle: { fontSize: 8 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=100_Million_Trees_${data.fiscalYear}.pdf`);
    pdfDoc.pipe(res);
    pdfDoc.end();
  }
}
