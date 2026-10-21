/**
 * Seeds the local SQLite database with the CAS demo dataset.
 *
 * Usage: `npm run shift:seed --workspace=@cas/api`
 */
import { BudgetType, RequestType, UserRole, WorkflowStatus } from '@cas/shared';
import { ShiftService } from './shift.service';

export async function seed(shift: ShiftService): Promise<void> {
  console.log(`Seeding CAS Platform database (${shift.databaseFile})...`);

  shift.ensureSchema();

  // 1. System Settings -----------------------------------------------------
  const settings = [
    { key: 'APPROVAL_REMINDER_DAYS', value: '3', description: 'Days before approval reminder is sent' },
    { key: 'MIS_ENTRY_WINDOW_DAYS', value: '10', description: 'End day of monthly entry window (1 to N)' },
    { key: 'MAX_FILE_SIZE_MB', value: '5', description: 'Maximum file upload size in MB' },
    { key: 'BLOCK_LATE_MIS_ENTRY', value: 'false', description: 'Block late MIS submissions outside window' },
  ];
  for (const setting of settings) {
    await shift.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // 2. Businesses ----------------------------------------------------------
  const bRenewable = await shift.business.upsert({
    where: { code: 'AGEL' },
    update: {},
    create: { code: 'AGEL', description: 'Adani Green Energy Ltd (Renewables)' },
  });

  const bAgri = await shift.business.upsert({
    where: { code: 'AWL' },
    update: {},
    create: { code: 'AWL', description: 'Adani Wilmar Ltd (Agri Business)' },
  });

  const bPorts = await shift.business.upsert({
    where: { code: 'APSEZ' },
    update: {},
    create: { code: 'APSEZ', description: 'Adani Ports and Special Economic Zone' },
  });

  // 3. Companies -----------------------------------------------------------
  const cKhavda = await shift.company.upsert({
    where: { businessId_code: { businessId: bRenewable.id, code: 'KRE' } },
    update: {},
    create: {
      businessId: bRenewable.id,
      code: 'KRE',
      shortName: 'Khavda RE Park',
      description: 'Khavda Renewable Energy Park Co.',
    },
  });

  const cWilmarMundra = await shift.company.upsert({
    where: { businessId_code: { businessId: bAgri.id, code: 'AWO' } },
    update: {},
    create: {
      businessId: bAgri.id,
      code: 'AWO',
      shortName: 'Adani Wilmar Edible Oils',
      description: 'Adani Wilmar Refining & Plantation Division',
    },
  });

  const cPortsMundra = await shift.company.upsert({
    where: { businessId_code: { businessId: bPorts.id, code: 'MPSEZ' } },
    update: {},
    create: {
      businessId: bPorts.id,
      code: 'MPSEZ',
      shortName: 'Mundra Port SEZ',
      description: 'Mundra Port & Marine Terminal',
    },
  });

  // 4. Locations -----------------------------------------------------------
  const locMundra = await shift.location.upsert({
    where: { code: 'MUN' },
    update: {},
    create: { code: 'MUN', description: 'Mundra Complex (Gujarat)' },
  });

  const locKawai = await shift.location.upsert({
    where: { code: 'KAW' },
    update: {},
    create: { code: 'KAW', description: 'Kawai Thermal & Green Zone (Rajasthan)' },
  });

  const locHazira = await shift.location.upsert({
    where: { code: 'HAZ' },
    update: {},
    create: { code: 'HAZ', description: 'Hazira Coastal Belt (Gujarat)' },
  });

  // 5. Site Locations ------------------------------------------------------
  const slMundraNorth = await shift.siteLocation.upsert({
    where: { locationId_code: { locationId: locMundra.id, code: 'MUN-N' } },
    update: {},
    create: { locationId: locMundra.id, code: 'MUN-N', description: 'Mundra North Green Belt' },
  });

  const slMundraCoastal = await shift.siteLocation.upsert({
    where: { locationId_code: { locationId: locMundra.id, code: 'MUN-C' } },
    update: {},
    create: { locationId: locMundra.id, code: 'MUN-C', description: 'Mundra Mangrove Conservation Zone' },
  });

  const slKawaiSolar = await shift.siteLocation.upsert({
    where: { locationId_code: { locationId: locKawai.id, code: 'KAW-S' } },
    update: {},
    create: { locationId: locKawai.id, code: 'KAW-S', description: 'Kawai Boundary Shelter Belt' },
  });

  const slHaziraPort = await shift.siteLocation.upsert({
    where: { locationId_code: { locationId: locHazira.id, code: 'HAZ-P' } },
    update: {},
    create: { locationId: locHazira.id, code: 'HAZ-P', description: 'Hazira Port Eco Park' },
  });

  // 6. Green Zones ---------------------------------------------------------
  const gz1 = await shift.greenZone.upsert({
    where: { greenZoneNo: 'GZ-MUN-001' },
    update: {},
    create: {
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneNo: 'GZ-MUN-001',
      description: 'Mundra Township Perimeter Forest',
    },
  });

  const gz2 = await shift.greenZone.upsert({
    where: { greenZoneNo: 'GZ-MUN-002' },
    update: {},
    create: {
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraCoastal.id,
      greenZoneNo: 'GZ-MUN-002',
      description: 'Creek Mangrove Restoration Sanctuary',
    },
  });

  const gz3 = await shift.greenZone.upsert({
    where: { greenZoneNo: 'GZ-KAW-001' },
    update: {},
    create: {
      businessId: bRenewable.id,
      companyId: cKhavda.id,
      locationId: locKawai.id,
      siteLocationId: slKawaiSolar.id,
      greenZoneNo: 'GZ-KAW-001',
      description: 'Kawai Solar Park Windbreak Belt',
    },
  });

  // 7. Users per role ------------------------------------------------------
  const userSite = await shift.user.upsert({
    where: { email: 'site.user@adani.com' },
    update: {},
    create: {
      name: 'Ramesh Patel',
      email: 'site.user@adani.com',
      employeeCode: 'EMP-1001',
      role: UserRole.SITE_USER,
    },
  });

  const userSupervisor = await shift.user.upsert({
    where: { email: 'site.supervisor@adani.com' },
    update: {},
    create: {
      name: 'Suresh Sharma',
      email: 'site.supervisor@adani.com',
      employeeCode: 'EMP-1002',
      role: UserRole.SITE_SUPERVISOR,
    },
  });

  const userBuAdmin = await shift.user.upsert({
    where: { email: 'bu.admin@adani.com' },
    update: {},
    create: {
      name: 'Vikram Adani',
      email: 'bu.admin@adani.com',
      employeeCode: 'EMP-1003',
      role: UserRole.BU_ADMINISTRATOR,
    },
  });

  const userCasAdmin = await shift.user.upsert({
    where: { email: 'cas.admin@adani.com' },
    update: {},
    create: {
      name: 'Pooja Mehta',
      email: 'cas.admin@adani.com',
      employeeCode: 'EMP-1004',
      role: UserRole.CAS_ADMIN,
    },
  });

  // Map users to businesses & locations
  await shift.userBusiness.deleteMany({});
  await shift.userLocation.deleteMany({});
  await shift.userSiteLocation.deleteMany({});

  // Ramesh: Site User mapped to Mundra
  await shift.userBusiness.create({ data: { userId: userSite.id, businessId: bPorts.id } });
  await shift.userLocation.create({ data: { userId: userSite.id, locationId: locMundra.id } });
  await shift.userSiteLocation.create({ data: { userId: userSite.id, siteLocationId: slMundraNorth.id } });
  await shift.userSiteLocation.create({ data: { userId: userSite.id, siteLocationId: slMundraCoastal.id } });

  // Suresh: Supervisor mapped to Mundra and Kawai
  await shift.userBusiness.create({ data: { userId: userSupervisor.id, businessId: bPorts.id } });
  await shift.userBusiness.create({ data: { userId: userSupervisor.id, businessId: bRenewable.id } });
  await shift.userLocation.create({ data: { userId: userSupervisor.id, locationId: locMundra.id } });
  await shift.userLocation.create({ data: { userId: userSupervisor.id, locationId: locKawai.id } });
  await shift.userSiteLocation.create({ data: { userId: userSupervisor.id, siteLocationId: slMundraNorth.id } });
  await shift.userSiteLocation.create({ data: { userId: userSupervisor.id, siteLocationId: slKawaiSolar.id } });

  // Vikram: BU Admin mapped to APSEZ and AGEL
  await shift.userBusiness.create({ data: { userId: userBuAdmin.id, businessId: bPorts.id } });
  await shift.userBusiness.create({ data: { userId: userBuAdmin.id, businessId: bRenewable.id } });

  // 8. Masters -------------------------------------------------------------
  const pCategories = [
    { code: 'REG', description: 'Regular Plantation' },
    { code: 'MIYA', description: 'Miyawaki Dense Forest' },
    { code: 'AVEN', description: 'Avenue / Roadside Plantation' },
    { code: 'SHEL', description: 'Perimeter Shelter Belt' },
    { code: 'MANG', description: 'Mangrove Restoration' },
  ];
  for (const category of pCategories) {
    await shift.plantationCategory.upsert({ where: { code: category.code }, update: {}, create: category });
  }

  const pTypes = [
    { code: 'Tree', description: 'Tree' },
    { code: 'Palm', description: 'Palm' },
    { code: 'Shrub', description: 'Shrub' },
    { code: 'Mangrove', description: 'Mangrove' },
    { code: 'Ground Cover & Lawn', description: 'Ground Cover & Lawn' },
  ];
  const typeMap: Record<string, string> = {};
  for (const plantationType of pTypes) {
    const created = await shift.plantationType.upsert({
      where: { code: plantationType.code },
      update: {},
      create: plantationType,
    });
    typeMap[plantationType.code] = created.id;
  }

  const botanicals = [
    { type: 'Tree', code: 'NEEM', description: 'Azadirachta indica (Neem)' },
    { type: 'Tree', code: 'PEEPAL', description: 'Ficus religiosa (Peepal)' },
    { type: 'Tree', code: 'KARANJ', description: 'Pongamia pinnata (Karanj)' },
    { type: 'Tree', code: 'CONO', description: 'Conocarpus erectus' },
    { type: 'Palm', code: 'DATE', description: 'Phoenix dactylifera (Date Palm)' },
    { type: 'Palm', code: 'ROYAL', description: 'Roystonea regia (Royal Palm)' },
    { type: 'Shrub', code: 'BOUGA', description: 'Bougainvillea spectabilis' },
    { type: 'Shrub', code: 'NERIUM', description: 'Nerium oleander' },
    { type: 'Mangrove', code: 'AVIC', description: 'Avicennia marina (Grey Mangrove)' },
    { type: 'Mangrove', code: 'RHIZO', description: 'Rhizophora mucronata' },
    { type: 'Ground Cover & Lawn', code: 'BERM', description: 'Cynodon dactylon (Bermuda Lawn)' },
  ];
  for (const botanical of botanicals) {
    await shift.botanical.upsert({
      where: { code: botanical.code },
      update: {},
      create: {
        plantationTypeId: typeMap[botanical.type],
        code: botanical.code,
        description: botanical.description,
      },
    });
  }

  const irrigations = [
    { code: 'DRIP', description: 'Automated Drip Irrigation' },
    { code: 'SPRINK', description: 'Sprinkler System' },
    { code: 'HOSE', description: 'Manual Hose / Water Tanker' },
    { code: 'TIDE', description: 'Natural Tidal Inundation' },
  ];
  for (const irrigation of irrigations) {
    await shift.irrigationType.upsert({ where: { code: irrigation.code }, update: {}, create: irrigation });
  }

  const rowDistances = [2.0, 2.5, 3.0, 4.0, 5.0];
  const plantDistances = [1.5, 2.0, 2.5, 3.0, 4.0];
  for (const plantationTypeCode of ['Tree', 'Palm', 'Shrub']) {
    for (const distance of rowDistances) {
      await shift.distanceRowToRow.create({
        data: { plantationTypeId: typeMap[plantationTypeCode], distanceM: distance },
      });
    }
    for (const distance of plantDistances) {
      await shift.distancePlantToPlant.create({
        data: { plantationTypeId: typeMap[plantationTypeCode], distanceM: distance },
      });
    }
  }

  const expCategories = [
    { code: 'LABOR', description: 'Labor & On-Ground Workforce' },
    { code: 'SAPL', description: 'Saplings, Seeds & Nursery' },
    { code: 'FERT', description: 'Organic Compost & Fertilizer' },
    { code: 'IRRIG', description: 'Irrigation Piping & Maintenance' },
    { code: 'EQUIP', description: 'Machinery & Tractor Rental' },
  ];
  const expMap: Record<string, string> = {};
  for (const expenseCategory of expCategories) {
    const item = await shift.expenseCategory.upsert({
      where: { code: expenseCategory.code },
      update: {},
      create: expenseCategory,
    });
    expMap[expenseCategory.code] = item.id;
  }

  // 9. 100 Million Trees targets & opening balances ------------------------
  await shift.treeOpeningBalance.createMany({
    data: [
      {
        siteLocationId: slMundraNorth.id,
        plantationType: 'Tree',
        count: 45000,
        fiscalYear: '2025-26',
        createdById: userCasAdmin.id,
      },
      {
        siteLocationId: slMundraCoastal.id,
        plantationType: 'Mangrove',
        count: 120000,
        fiscalYear: '2025-26',
        createdById: userCasAdmin.id,
      },
      {
        siteLocationId: slKawaiSolar.id,
        plantationType: 'Tree',
        count: 30000,
        fiscalYear: '2025-26',
        createdById: userCasAdmin.id,
      },
    ],
    skipDuplicates: true,
  });

  await shift.treeTarget.createMany({
    data: [
      {
        businessId: bPorts.id,
        companyId: cPortsMundra.id,
        locationId: locMundra.id,
        siteLocationId: slMundraNorth.id,
        fiscalYear: '2025-26',
        plantationType: 'Tree',
        targetCount: 25000,
        remarks: 'Perimeter tree target for Mundra port expansion',
        createdById: userCasAdmin.id,
      },
      {
        businessId: bPorts.id,
        companyId: cPortsMundra.id,
        locationId: locMundra.id,
        siteLocationId: slMundraCoastal.id,
        fiscalYear: '2025-26',
        plantationType: 'Mangrove',
        targetCount: 50000,
        remarks: 'Coastal mangrove biodiversity target',
        createdById: userCasAdmin.id,
      },
      {
        businessId: bRenewable.id,
        companyId: cKhavda.id,
        locationId: locKawai.id,
        siteLocationId: slKawaiSolar.id,
        fiscalYear: '2025-26',
        plantationType: 'Tree',
        targetCount: 15000,
        remarks: 'Desert greening belt target',
        createdById: userCasAdmin.id,
      },
    ],
    skipDuplicates: true,
  });

  // 10. Sample requests across different statuses --------------------------
  console.log('Seeding sample requests and workflow instances...');

  await shift.workflowStepHistory.deleteMany({});
  await shift.workflowInstance.deleteMany({});
  await shift.greenZoneRequestPhoto.deleteMany({});
  await shift.greenZoneRequest.deleteMany({});
  await shift.misAttachment.deleteMany({});
  await shift.misMonthlyExpense.deleteMany({});
  await shift.misYearlyBudget.deleteMany({});

  const catReg = await shift.plantationCategory.findUnique({ where: { code: 'REG' } });
  const botNeem = await shift.botanical.findUnique({ where: { code: 'NEEM' } });
  const irrDrip = await shift.irrigationType.findUnique({ where: { code: 'DRIP' } });

  // Complete Green Zone request
  const gzReq1 = await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000101',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      plantationCategoryId: catReg!.id,
      plantationTypeId: typeMap['Tree'],
      botanicalId: botNeem!.id,
      irrigationTypeId: irrDrip!.id,
      distanceRowToRowM: 3.0,
      distancePlantToPlantM: 2.5,
      treeCount: 5000,
      calculatedAreaHa: 3.75,
      overlapWithCover: false,
      plantationMonthYear: 'May-2025',
      status: WorkflowStatus.COMPLETE,
      currentLevel: null,
      remarks: 'Completed dense neem belt on boundary wall',
      createdById: userSite.id,
      photos: {
        create: [
          {
            fileName: 'neem_plantation_proof_1.jpg',
            fileUrl: '/brand/favicon.svg',
            fileSize: 102400,
            mimeType: 'image/jpeg',
            uploadedById: userSite.id,
          },
        ],
      },
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'GREEN_ZONE_CREATION',
      entityId: gzReq1.id,
      status: WorkflowStatus.COMPLETE,
      createdById: userSite.id,
      steps: {
        create: [
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq1.id,
            level: 'CREATOR',
            actorId: userSite.id,
            action: 'SUBMIT',
            remarks: 'Submitted',
          },
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq1.id,
            level: 'L1',
            actorId: userSupervisor.id,
            action: 'APPROVE',
            remarks: 'Site verified',
          },
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq1.id,
            level: 'L2',
            actorId: userBuAdmin.id,
            action: 'APPROVE',
            remarks: 'Budget verified',
          },
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq1.id,
            level: 'L3',
            actorId: userCasAdmin.id,
            action: 'APPROVE',
            remarks: 'Final approval complete',
          },
        ],
      },
    },
  });

  // Approved mortality linked to GZReq1
  const gzMort1 = await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000102',
      type: RequestType.MORTALITY,
      parentRequestId: gzReq1.id,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      mortalityCount: 150,
      status: WorkflowStatus.COMPLETE,
      remarks: 'Summer heatwave mortality replacement inspection',
      createdById: userSite.id,
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'GREEN_ZONE_MORTALITY',
      entityId: gzMort1.id,
      status: WorkflowStatus.COMPLETE,
      createdById: userSite.id,
      steps: {
        create: [
          {
            entityType: 'GREEN_ZONE_MORTALITY',
            entityId: gzMort1.id,
            level: 'CREATOR',
            actorId: userSite.id,
            action: 'SUBMIT',
            remarks: 'Mortality reported',
          },
          {
            entityType: 'GREEN_ZONE_MORTALITY',
            entityId: gzMort1.id,
            level: 'L1',
            actorId: userSupervisor.id,
            action: 'APPROVE',
            remarks: 'Confirmed on site',
          },
          {
            entityType: 'GREEN_ZONE_MORTALITY',
            entityId: gzMort1.id,
            level: 'L2',
            actorId: userBuAdmin.id,
            action: 'APPROVE',
            remarks: 'Approved',
          },
          {
            entityType: 'GREEN_ZONE_MORTALITY',
            entityId: gzMort1.id,
            level: 'L3',
            actorId: userCasAdmin.id,
            action: 'APPROVE',
            remarks: 'Final approved',
          },
        ],
      },
    },
  });

  // Pending L1 Green Zone request
  const gzReq2 = await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000103',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraCoastal.id,
      greenZoneId: gz2.id,
      plantationCategoryId: catReg!.id,
      plantationTypeId: typeMap['Mangrove'],
      mangroveCount: 12000,
      calculatedAreaHa: 0,
      overlapWithCover: false,
      plantationMonthYear: 'Jun-2025',
      status: WorkflowStatus.PENDING_L1,
      currentLevel: 'L1',
      remarks: 'Tidal creek restoration',
      createdById: userSite.id,
      photos: {
        create: [
          {
            fileName: 'mangrove_planting_stage.jpg',
            fileUrl: '/brand/favicon.svg',
            fileSize: 85000,
            mimeType: 'image/jpeg',
            uploadedById: userSite.id,
          },
        ],
      },
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'GREEN_ZONE_CREATION',
      entityId: gzReq2.id,
      status: WorkflowStatus.PENDING_L1,
      currentLevel: 'L1',
      createdById: userSite.id,
      steps: {
        create: [
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq2.id,
            level: 'CREATOR',
            actorId: userSite.id,
            action: 'SUBMIT',
            remarks: 'Submitted for review',
          },
        ],
      },
    },
  });

  // Pending L2 Green Zone request (created by Supervisor - skips L1!)
  const gzReq3 = await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000104',
      type: RequestType.CREATION,
      businessId: bRenewable.id,
      companyId: cKhavda.id,
      locationId: locKawai.id,
      siteLocationId: slKawaiSolar.id,
      greenZoneId: gz3.id,
      plantationCategoryId: catReg!.id,
      plantationTypeId: typeMap['Tree'],
      treeCount: 3000,
      distanceRowToRowM: 4.0,
      distancePlantToPlantM: 3.0,
      calculatedAreaHa: 3.6,
      overlapWithCover: false,
      plantationMonthYear: 'Jul-2025',
      status: WorkflowStatus.PENDING_L2,
      currentLevel: 'L2',
      remarks: 'Kawai perimeter windbreak',
      createdById: userSupervisor.id, // Supervisor created -> skip L1!
      photos: {
        create: [
          {
            fileName: 'kawai_greenbelt.jpg',
            fileUrl: '/brand/favicon.svg',
            fileSize: 92000,
            mimeType: 'image/jpeg',
            uploadedById: userSupervisor.id,
          },
        ],
      },
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'GREEN_ZONE_CREATION',
      entityId: gzReq3.id,
      status: WorkflowStatus.PENDING_L2,
      currentLevel: 'L2',
      createdById: userSupervisor.id,
      steps: {
        create: [
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq3.id,
            level: 'CREATOR',
            actorId: userSupervisor.id,
            action: 'SUBMIT',
            remarks: 'Supervisor created, routed to L2',
          },
        ],
      },
    },
  });

  // Pending L3 Green Zone request
  const gzReq4 = await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000105',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      plantationTypeId: typeMap['Palm'],
      palmCount: 800,
      distanceRowToRowM: 4.0,
      distancePlantToPlantM: 4.0,
      calculatedAreaHa: 1.28,
      plantationMonthYear: 'Aug-2025',
      status: WorkflowStatus.PENDING_L3,
      currentLevel: 'L3',
      remarks: 'Avenue Royal Palm corridor',
      createdById: userSite.id,
      photos: {
        create: [
          {
            fileName: 'royal_palm.jpg',
            fileUrl: '/brand/favicon.svg',
            fileSize: 70000,
            mimeType: 'image/jpeg',
            uploadedById: userSite.id,
          },
        ],
      },
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'GREEN_ZONE_CREATION',
      entityId: gzReq4.id,
      status: WorkflowStatus.PENDING_L3,
      currentLevel: 'L3',
      createdById: userSite.id,
      steps: {
        create: [
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq4.id,
            level: 'CREATOR',
            actorId: userSite.id,
            action: 'SUBMIT',
            remarks: 'Submitted',
          },
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq4.id,
            level: 'L1',
            actorId: userSupervisor.id,
            action: 'APPROVE',
            remarks: 'L1 Approved',
          },
          {
            entityType: 'GREEN_ZONE_CREATION',
            entityId: gzReq4.id,
            level: 'L2',
            actorId: userBuAdmin.id,
            action: 'APPROVE',
            remarks: 'L2 Approved',
          },
        ],
      },
    },
  });

  // Additional Green Zone requests in other statuses
  await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000106',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      plantationTypeId: typeMap['Shrub'],
      shrubCount: 1500,
      calculatedAreaHa: 0.45,
      status: WorkflowStatus.DRAFT,
      remarks: 'Work in progress draft',
      createdById: userSite.id,
    },
  });

  await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000107',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      status: WorkflowStatus.REJECTED,
      remarks: 'Rejected due to soil salinity mismatch',
      createdById: userSite.id,
    },
  });

  await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000108',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      status: WorkflowStatus.RETURNED,
      remarks: 'Returned for geotagged proof attachment',
      createdById: userSite.id,
    },
  });

  await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000109',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      status: WorkflowStatus.CALLBACK,
      remarks: 'Called back by creator to correct plant count',
      createdById: userSite.id,
    },
  });

  await shift.greenZoneRequest.create({
    data: {
      requestNo: 'GZ-2025-000110',
      type: RequestType.CREATION,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      greenZoneId: gz1.id,
      status: WorkflowStatus.CANCELLED,
      remarks: 'Cancelled by creator due to site boundary shift',
      createdById: userSite.id,
    },
  });

  // Sample MIS Yearly Budgets ----------------------------------------------
  const misy1 = await shift.misYearlyBudget.create({
    data: {
      requestNo: 'MISY-2025-000001',
      type: BudgetType.CAPEX,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      fiscalYear: '2025-26',
      budgetAmount: 5000000,
      remarks: 'Mundra annual Capex for drip automation and earth moving',
      status: WorkflowStatus.COMPLETE,
      createdById: userSupervisor.id,
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'MIS_YEARLY',
      entityId: misy1.id,
      status: WorkflowStatus.COMPLETE,
      createdById: userSupervisor.id,
      steps: {
        create: [
          {
            entityType: 'MIS_YEARLY',
            entityId: misy1.id,
            level: 'CREATOR',
            actorId: userSupervisor.id,
            action: 'SUBMIT',
            remarks: 'Yearly budget submitted',
          },
          {
            entityType: 'MIS_YEARLY',
            entityId: misy1.id,
            level: 'L2',
            actorId: userBuAdmin.id,
            action: 'APPROVE',
            remarks: 'Budget approved',
          },
          {
            entityType: 'MIS_YEARLY',
            entityId: misy1.id,
            level: 'L3',
            actorId: userCasAdmin.id,
            action: 'APPROVE',
            remarks: 'Final approval granted',
          },
        ],
      },
    },
  });

  const misy2 = await shift.misYearlyBudget.create({
    data: {
      requestNo: 'MISY-2025-000002',
      type: BudgetType.OPEX,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      fiscalYear: '2025-26',
      budgetAmount: 2400000,
      remarks: 'Mundra annual Opex for labor, irrigation, fertilizer',
      status: WorkflowStatus.COMPLETE,
      createdById: userSupervisor.id,
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'MIS_YEARLY',
      entityId: misy2.id,
      status: WorkflowStatus.COMPLETE,
      createdById: userSupervisor.id,
      steps: {
        create: [
          {
            entityType: 'MIS_YEARLY',
            entityId: misy2.id,
            level: 'CREATOR',
            actorId: userSupervisor.id,
            action: 'SUBMIT',
            remarks: 'Opex budget submitted',
          },
          {
            entityType: 'MIS_YEARLY',
            entityId: misy2.id,
            level: 'L2',
            actorId: userBuAdmin.id,
            action: 'APPROVE',
            remarks: 'Approved',
          },
          {
            entityType: 'MIS_YEARLY',
            entityId: misy2.id,
            level: 'L3',
            actorId: userCasAdmin.id,
            action: 'APPROVE',
            remarks: 'Approved',
          },
        ],
      },
    },
  });

  // Sample MIS Monthly Expenses --------------------------------------------
  const expMonths = ['2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];
  for (let i = 0; i < expMonths.length; i++) {
    const month = expMonths[i];
    const cost = 250000 + i * 20000;
    const male = 15 + (i % 4);
    const female = 10 + (i % 3);
    const area = 12.5;

    const mism = await shift.misMonthlyExpense.create({
      data: {
        requestNo: `MISM-2025-00000${i + 1}`,
        type: BudgetType.OPEX,
        businessId: bPorts.id,
        companyId: cPortsMundra.id,
        locationId: locMundra.id,
        siteLocationId: slMundraNorth.id,
        expenseCategoryId: expMap['LABOR'],
        month,
        fiscalYear: '2025-26',
        consumedCost: cost,
        maleWorkforceCount: male,
        femaleWorkforceCount: female,
        areaHa: area,
        remarks: `Maintenance and weeding expense for ${month}`,
        status: WorkflowStatus.COMPLETE,
        createdById: userSupervisor.id,
      },
    });

    await shift.workflowInstance.create({
      data: {
        entityType: 'MIS_MONTHLY',
        entityId: mism.id,
        status: WorkflowStatus.COMPLETE,
        createdById: userSupervisor.id,
        steps: {
          create: [
            {
              entityType: 'MIS_MONTHLY',
              entityId: mism.id,
              level: 'CREATOR',
              actorId: userSupervisor.id,
              action: 'SUBMIT',
              remarks: 'Submitted',
            },
            {
              entityType: 'MIS_MONTHLY',
              entityId: mism.id,
              level: 'L2',
              actorId: userBuAdmin.id,
              action: 'APPROVE',
              remarks: 'Approved',
            },
            {
              entityType: 'MIS_MONTHLY',
              entityId: mism.id,
              level: 'L3',
              actorId: userCasAdmin.id,
              action: 'APPROVE',
              remarks: 'Approved',
            },
          ],
        },
      },
    });
  }

  // Pending MIS monthly expense
  const pendingMism = await shift.misMonthlyExpense.create({
    data: {
      requestNo: 'MISM-2025-000010',
      type: BudgetType.CAPEX,
      businessId: bPorts.id,
      companyId: cPortsMundra.id,
      locationId: locMundra.id,
      siteLocationId: slMundraNorth.id,
      expenseCategoryId: expMap['IRRIG'],
      month: '2025-10',
      fiscalYear: '2025-26',
      consumedCost: 450000,
      maleWorkforceCount: 8,
      femaleWorkforceCount: 4,
      areaHa: 6.0,
      status: WorkflowStatus.PENDING_L2,
      currentLevel: 'L2',
      remarks: 'Pipeline fitting replacement for north green belt',
      createdById: userSupervisor.id,
    },
  });

  await shift.workflowInstance.create({
    data: {
      entityType: 'MIS_MONTHLY',
      entityId: pendingMism.id,
      status: WorkflowStatus.PENDING_L2,
      currentLevel: 'L2',
      createdById: userSupervisor.id,
      steps: {
        create: [
          {
            entityType: 'MIS_MONTHLY',
            entityId: pendingMism.id,
            level: 'CREATOR',
            actorId: userSupervisor.id,
            action: 'SUBMIT',
            remarks: 'Submitted',
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}
