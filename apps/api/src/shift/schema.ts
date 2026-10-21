/**
 * Shift Schema
 * ------------
 * Single source of truth for the local SQLite storage layer.
 * Plain TypeScript metadata that is used to (a) generate the DDL and
 * (b) power the runtime query builder.
 */

export type FieldType = 'string' | 'text' | 'int' | 'float' | 'bool' | 'datetime';

export interface FieldDef {
  type: FieldType;
  /** Static default value, or the literal string `'now'` for the current timestamp. */
  default?: any;
  /** Automatically refreshed on every update. */
  updatedAt?: boolean;
}

export interface RelationDef {
  /** Target model name. */
  model: string;
  /**
   * - `one`  : belongs-to relation. The foreign key column lives on the *current* model.
   * - `many` : has-many relation. The foreign key column lives on the *target* model.
   */
  kind: 'one' | 'many';
  /** Foreign key column name. */
  fk: string;
}

export interface ModelDef {
  table: string;
  fields: Record<string, FieldDef>;
  relations: Record<string, RelationDef>;
  /** Compound unique constraints expressed as column groups. */
  uniques?: string[][];
  /** Extra indexes (column groups). */
  indexes?: string[][];
}

const str = (): FieldDef => ({ type: 'string' });
const strOpt = (): FieldDef => ({ type: 'string' });
const int = (def?: number): FieldDef => ({ type: 'int', ...(def !== undefined ? { default: def } : {}) });
const float = (def?: number): FieldDef => ({ type: 'float', ...(def !== undefined ? { default: def } : {}) });
const bool = (def = false): FieldDef => ({ type: 'bool', default: def });
const now = (): FieldDef => ({ type: 'datetime', default: 'now' });
const updatedAt = (): FieldDef => ({ type: 'datetime', default: 'now', updatedAt: true });

/**
 * Model registry. Field order mirrors the original relational schema.
 */
export const MODELS: Record<string, ModelDef> = {
  User: {
    table: 'users',
    fields: {
      id: { type: 'string' },
      name: str(),
      email: str(),
      employeeCode: str(),
      role: { type: 'string', default: 'SITE_USER' },
      active: bool(true),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      userBusinesses: { model: 'UserBusiness', kind: 'many', fk: 'userId' },
      userLocations: { model: 'UserLocation', kind: 'many', fk: 'userId' },
      userSiteLocations: { model: 'UserSiteLocation', kind: 'many', fk: 'userId' },
      notifications: { model: 'Notification', kind: 'many', fk: 'userId' },
      workflowSteps: { model: 'WorkflowStepHistory', kind: 'many', fk: 'actorId' },
    },
  },

  Business: {
    table: 'businesses',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
      createdById: strOpt(),
      updatedById: strOpt(),
    },
    relations: {
      companies: { model: 'Company', kind: 'many', fk: 'businessId' },
      greenZones: { model: 'GreenZone', kind: 'many', fk: 'businessId' },
      userBusinesses: { model: 'UserBusiness', kind: 'many', fk: 'businessId' },
      greenZoneRequests: { model: 'GreenZoneRequest', kind: 'many', fk: 'businessId' },
      misYearlyBudgets: { model: 'MisYearlyBudget', kind: 'many', fk: 'businessId' },
      misMonthlyExpenses: { model: 'MisMonthlyExpense', kind: 'many', fk: 'businessId' },
      treeTargets: { model: 'TreeTarget', kind: 'many', fk: 'businessId' },
    },
  },

  Company: {
    table: 'companies',
    fields: {
      id: { type: 'string' },
      businessId: str(),
      code: str(),
      shortName: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
      createdById: strOpt(),
      updatedById: strOpt(),
    },
    relations: {
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      greenZones: { model: 'GreenZone', kind: 'many', fk: 'companyId' },
      greenZoneRequests: { model: 'GreenZoneRequest', kind: 'many', fk: 'companyId' },
      misYearlyBudgets: { model: 'MisYearlyBudget', kind: 'many', fk: 'companyId' },
      misMonthlyExpenses: { model: 'MisMonthlyExpense', kind: 'many', fk: 'companyId' },
      treeTargets: { model: 'TreeTarget', kind: 'many', fk: 'companyId' },
    },
    uniques: [['businessId', 'code']],
  },

  Location: {
    table: 'locations',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
      createdById: strOpt(),
      updatedById: strOpt(),
    },
    relations: {
      siteLocations: { model: 'SiteLocation', kind: 'many', fk: 'locationId' },
      greenZones: { model: 'GreenZone', kind: 'many', fk: 'locationId' },
      userLocations: { model: 'UserLocation', kind: 'many', fk: 'locationId' },
      greenZoneRequests: { model: 'GreenZoneRequest', kind: 'many', fk: 'locationId' },
      misYearlyBudgets: { model: 'MisYearlyBudget', kind: 'many', fk: 'locationId' },
      misMonthlyExpenses: { model: 'MisMonthlyExpense', kind: 'many', fk: 'locationId' },
      treeTargets: { model: 'TreeTarget', kind: 'many', fk: 'locationId' },
    },
  },

  SiteLocation: {
    table: 'site_locations',
    fields: {
      id: { type: 'string' },
      locationId: str(),
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
      createdById: strOpt(),
      updatedById: strOpt(),
    },
    relations: {
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      greenZones: { model: 'GreenZone', kind: 'many', fk: 'siteLocationId' },
      userSiteLocations: { model: 'UserSiteLocation', kind: 'many', fk: 'siteLocationId' },
      greenZoneRequests: { model: 'GreenZoneRequest', kind: 'many', fk: 'siteLocationId' },
      misYearlyBudgets: { model: 'MisYearlyBudget', kind: 'many', fk: 'siteLocationId' },
      misMonthlyExpenses: { model: 'MisMonthlyExpense', kind: 'many', fk: 'siteLocationId' },
      treeTargets: { model: 'TreeTarget', kind: 'many', fk: 'siteLocationId' },
      treeOpeningBalances: { model: 'TreeOpeningBalance', kind: 'many', fk: 'siteLocationId' },
    },
    uniques: [['locationId', 'code']],
  },

  GreenZone: {
    table: 'green_zones',
    fields: {
      id: { type: 'string' },
      businessId: str(),
      companyId: str(),
      locationId: str(),
      siteLocationId: str(),
      greenZoneNo: str(),
      description: strOpt(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
      createdById: strOpt(),
      updatedById: strOpt(),
    },
    relations: {
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      company: { model: 'Company', kind: 'one', fk: 'companyId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
      requests: { model: 'GreenZoneRequest', kind: 'many', fk: 'greenZoneId' },
    },
  },

  UserBusiness: {
    table: 'user_businesses',
    fields: {
      id: { type: 'string' },
      userId: str(),
      businessId: str(),
      createdAt: now(),
    },
    relations: {
      user: { model: 'User', kind: 'one', fk: 'userId' },
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
    },
    uniques: [['userId', 'businessId']],
  },

  UserLocation: {
    table: 'user_locations',
    fields: {
      id: { type: 'string' },
      userId: str(),
      locationId: str(),
      createdAt: now(),
    },
    relations: {
      user: { model: 'User', kind: 'one', fk: 'userId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
    },
    uniques: [['userId', 'locationId']],
  },

  UserSiteLocation: {
    table: 'user_site_locations',
    fields: {
      id: { type: 'string' },
      userId: str(),
      siteLocationId: str(),
      createdAt: now(),
    },
    relations: {
      user: { model: 'User', kind: 'one', fk: 'userId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
    },
    uniques: [['userId', 'siteLocationId']],
  },

  PlantationCategory: {
    table: 'plantation_categories',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      requests: { model: 'GreenZoneRequest', kind: 'many', fk: 'plantationCategoryId' },
    },
  },

  PlantationType: {
    table: 'plantation_types',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      botanicals: { model: 'Botanical', kind: 'many', fk: 'plantationTypeId' },
      distanceRowToRows: { model: 'DistanceRowToRow', kind: 'many', fk: 'plantationTypeId' },
      distancePlantToPlants: { model: 'DistancePlantToPlant', kind: 'many', fk: 'plantationTypeId' },
      requests: { model: 'GreenZoneRequest', kind: 'many', fk: 'plantationTypeId' },
    },
  },

  Botanical: {
    table: 'botanicals',
    fields: {
      id: { type: 'string' },
      plantationTypeId: str(),
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      plantationType: { model: 'PlantationType', kind: 'one', fk: 'plantationTypeId' },
      requests: { model: 'GreenZoneRequest', kind: 'many', fk: 'botanicalId' },
    },
  },

  IrrigationType: {
    table: 'irrigation_types',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      requests: { model: 'GreenZoneRequest', kind: 'many', fk: 'irrigationTypeId' },
    },
  },

  DistanceRowToRow: {
    table: 'distance_row_to_rows',
    fields: {
      id: { type: 'string' },
      plantationTypeId: str(),
      distanceM: float(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      plantationType: { model: 'PlantationType', kind: 'one', fk: 'plantationTypeId' },
    },
  },

  DistancePlantToPlant: {
    table: 'distance_plant_to_plants',
    fields: {
      id: { type: 'string' },
      plantationTypeId: str(),
      distanceM: float(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      plantationType: { model: 'PlantationType', kind: 'one', fk: 'plantationTypeId' },
    },
  },

  ExpenseCategory: {
    table: 'expense_categories',
    fields: {
      id: { type: 'string' },
      code: str(),
      description: str(),
      isDeleted: bool(false),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      misMonthlyExpenses: { model: 'MisMonthlyExpense', kind: 'many', fk: 'expenseCategoryId' },
    },
  },

  GreenZoneRequest: {
    table: 'green_zone_requests',
    fields: {
      id: { type: 'string' },
      requestNo: str(),
      type: { type: 'string', default: 'CREATION' },
      parentRequestId: strOpt(),
      businessId: str(),
      companyId: str(),
      locationId: str(),
      siteLocationId: str(),
      greenZoneId: str(),
      plantationCategoryId: strOpt(),
      plantationTypeId: strOpt(),
      botanicalId: strOpt(),
      irrigationTypeId: strOpt(),
      distanceRowToRowM: { type: 'float' },
      distancePlantToPlantM: { type: 'float' },
      treeCount: { type: 'int' },
      palmCount: { type: 'int' },
      mangroveCount: { type: 'int' },
      shrubCount: { type: 'int' },
      groundCoverArea: { type: 'float' },
      calculatedAreaHa: float(0),
      overlapWithCover: bool(false),
      plantationMonthYear: strOpt(),
      remarks: strOpt(),
      status: { type: 'string', default: 'DRAFT' },
      currentLevel: strOpt(),
      mortalityCount: { type: 'int' },
      createdById: str(),
      updatedById: strOpt(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      parentRequest: { model: 'GreenZoneRequest', kind: 'one', fk: 'parentRequestId' },
      childMortalities: { model: 'GreenZoneRequest', kind: 'many', fk: 'parentRequestId' },
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      company: { model: 'Company', kind: 'one', fk: 'companyId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
      greenZone: { model: 'GreenZone', kind: 'one', fk: 'greenZoneId' },
      plantationCategory: { model: 'PlantationCategory', kind: 'one', fk: 'plantationCategoryId' },
      plantationType: { model: 'PlantationType', kind: 'one', fk: 'plantationTypeId' },
      botanical: { model: 'Botanical', kind: 'one', fk: 'botanicalId' },
      irrigationType: { model: 'IrrigationType', kind: 'one', fk: 'irrigationTypeId' },
      photos: { model: 'GreenZoneRequestPhoto', kind: 'many', fk: 'requestId' },
    },
    indexes: [
      ['status', 'type'],
      ['businessId', 'locationId', 'siteLocationId'],
      ['createdAt'],
    ],
  },

  GreenZoneRequestPhoto: {
    table: 'green_zone_request_photos',
    fields: {
      id: { type: 'string' },
      requestId: str(),
      fileName: str(),
      fileUrl: str(),
      fileSize: int(),
      mimeType: str(),
      uploadedById: str(),
      createdAt: now(),
    },
    relations: {
      request: { model: 'GreenZoneRequest', kind: 'one', fk: 'requestId' },
    },
  },

  MisYearlyBudget: {
    table: 'mis_yearly_budgets',
    fields: {
      id: { type: 'string' },
      requestNo: str(),
      type: { type: 'string', default: 'Capex' },
      businessId: str(),
      companyId: str(),
      locationId: str(),
      siteLocationId: str(),
      fiscalYear: str(),
      budgetAmount: float(),
      remarks: strOpt(),
      isLateEntry: bool(false),
      status: strOpt(),
      currentLevel: strOpt(),
      createdById: str(),
      updatedById: strOpt(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      company: { model: 'Company', kind: 'one', fk: 'companyId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
      attachments: { model: 'MisAttachment', kind: 'many', fk: 'yearlyBudgetId' },
    },
    indexes: [['businessId', 'locationId', 'fiscalYear']],
  },

  MisMonthlyExpense: {
    table: 'mis_monthly_expenses',
    fields: {
      id: { type: 'string' },
      requestNo: str(),
      type: { type: 'string', default: 'Capex' },
      businessId: str(),
      companyId: str(),
      locationId: str(),
      siteLocationId: str(),
      expenseCategoryId: str(),
      month: str(),
      fiscalYear: str(),
      consumedCost: float(),
      maleWorkforceCount: int(0),
      femaleWorkforceCount: int(0),
      areaHa: float(0),
      remarks: strOpt(),
      isLateEntry: bool(false),
      status: strOpt(),
      currentLevel: strOpt(),
      createdById: str(),
      updatedById: strOpt(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      company: { model: 'Company', kind: 'one', fk: 'companyId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
      expenseCategory: { model: 'ExpenseCategory', kind: 'one', fk: 'expenseCategoryId' },
      attachments: { model: 'MisAttachment', kind: 'many', fk: 'monthlyExpenseId' },
    },
    indexes: [['businessId', 'locationId', 'fiscalYear', 'month']],
  },

  MisAttachment: {
    table: 'mis_attachments',
    fields: {
      id: { type: 'string' },
      yearlyBudgetId: strOpt(),
      monthlyExpenseId: strOpt(),
      fileName: str(),
      fileUrl: str(),
      fileSize: int(),
      mimeType: str(),
      uploadedById: str(),
      createdAt: now(),
    },
    relations: {
      yearlyBudget: { model: 'MisYearlyBudget', kind: 'one', fk: 'yearlyBudgetId' },
      monthlyExpense: { model: 'MisMonthlyExpense', kind: 'one', fk: 'monthlyExpenseId' },
    },
  },

  TreeTarget: {
    table: 'tree_targets',
    fields: {
      id: { type: 'string' },
      businessId: str(),
      companyId: str(),
      locationId: str(),
      siteLocationId: str(),
      fiscalYear: str(),
      plantationType: str(),
      targetCount: int(),
      remarks: strOpt(),
      createdById: str(),
      updatedById: strOpt(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      business: { model: 'Business', kind: 'one', fk: 'businessId' },
      company: { model: 'Company', kind: 'one', fk: 'companyId' },
      location: { model: 'Location', kind: 'one', fk: 'locationId' },
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
      histories: { model: 'TreeTargetHistory', kind: 'many', fk: 'treeTargetId' },
    },
    uniques: [['siteLocationId', 'fiscalYear', 'plantationType']],
  },

  TreeTargetHistory: {
    table: 'tree_target_histories',
    fields: {
      id: { type: 'string' },
      treeTargetId: str(),
      oldTargetCount: int(),
      newTargetCount: int(),
      remarks: str(),
      changedById: str(),
      createdAt: now(),
    },
    relations: {
      treeTarget: { model: 'TreeTarget', kind: 'one', fk: 'treeTargetId' },
    },
  },

  TreeOpeningBalance: {
    table: 'tree_opening_balances',
    fields: {
      id: { type: 'string' },
      siteLocationId: str(),
      plantationType: str(),
      count: int(0),
      fiscalYear: str(),
      createdById: str(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      siteLocation: { model: 'SiteLocation', kind: 'one', fk: 'siteLocationId' },
    },
    uniques: [['siteLocationId', 'fiscalYear', 'plantationType']],
  },

  WorkflowInstance: {
    table: 'workflow_instances',
    fields: {
      id: { type: 'string' },
      entityType: str(),
      entityId: str(),
      status: { type: 'string', default: 'DRAFT' },
      currentLevel: strOpt(),
      createdById: str(),
      createdAt: now(),
      updatedAt: updatedAt(),
    },
    relations: {
      steps: { model: 'WorkflowStepHistory', kind: 'many', fk: 'workflowInstanceId' },
    },
    uniques: [['entityType', 'entityId']],
  },

  WorkflowStepHistory: {
    table: 'workflow_step_histories',
    fields: {
      id: { type: 'string' },
      workflowInstanceId: str(),
      entityType: str(),
      entityId: str(),
      level: strOpt(),
      actorId: str(),
      action: str(),
      remarks: strOpt(),
      createdAt: now(),
    },
    relations: {
      workflowInstance: { model: 'WorkflowInstance', kind: 'one', fk: 'workflowInstanceId' },
      actor: { model: 'User', kind: 'one', fk: 'actorId' },
    },
  },

  Notification: {
    table: 'notifications',
    fields: {
      id: { type: 'string' },
      userId: str(),
      title: str(),
      message: str(),
      link: strOpt(),
      read: bool(false),
      createdAt: now(),
    },
    relations: {
      user: { model: 'User', kind: 'one', fk: 'userId' },
    },
  },

  EmailLog: {
    table: 'email_logs',
    fields: {
      id: { type: 'string' },
      to: str(),
      subject: str(),
      template: strOpt(),
      status: str(),
      error: strOpt(),
      createdAt: now(),
    },
    relations: {},
  },

  SystemSetting: {
    table: 'system_settings',
    fields: {
      id: { type: 'string' },
      key: str(),
      value: str(),
      description: strOpt(),
      updatedAt: updatedAt(),
    },
    relations: {},
  },

  FileAsset: {
    table: 'file_assets',
    fields: {
      id: { type: 'string' },
      originalName: str(),
      storedName: str(),
      mimeType: str(),
      size: int(),
      path: str(),
      uploadedById: str(),
      createdAt: now(),
    },
    relations: {},
  },
};

/**
 * Single-column UNIQUE declarations per model.
 */
export const UNIQUE_COLUMN_DECLARATIONS: Record<string, string[]> = {
  User: ['email', 'employeeCode'],
  Business: ['code'],
  Company: [],
  Location: ['code'],
  SiteLocation: [],
  GreenZone: ['greenZoneNo'],
  UserBusiness: [],
  UserLocation: [],
  UserSiteLocation: [],
  PlantationCategory: ['code'],
  PlantationType: ['code'],
  Botanical: ['code'],
  IrrigationType: ['code'],
  DistanceRowToRow: [],
  DistancePlantToPlant: [],
  ExpenseCategory: ['code'],
  GreenZoneRequest: ['requestNo'],
  GreenZoneRequestPhoto: [],
  MisYearlyBudget: ['requestNo'],
  MisMonthlyExpense: ['requestNo'],
  MisAttachment: [],
  TreeTarget: [],
  TreeTargetHistory: [],
  TreeOpeningBalance: [],
  WorkflowInstance: [],
  WorkflowStepHistory: [],
  Notification: [],
  EmailLog: [],
  SystemSetting: ['key'],
  FileAsset: [],
};

/** Models in an order that satisfies foreign-key dependencies when creating the schema. */
export const MODEL_ORDER: string[] = [
  'User',
  'Business',
  'Company',
  'Location',
  'SiteLocation',
  'GreenZone',
  'UserBusiness',
  'UserLocation',
  'UserSiteLocation',
  'PlantationCategory',
  'PlantationType',
  'Botanical',
  'IrrigationType',
  'DistanceRowToRow',
  'DistancePlantToPlant',
  'ExpenseCategory',
  'GreenZoneRequest',
  'GreenZoneRequestPhoto',
  'MisYearlyBudget',
  'MisMonthlyExpense',
  'MisAttachment',
  'TreeTarget',
  'TreeTargetHistory',
  'TreeOpeningBalance',
  'WorkflowInstance',
  'WorkflowStepHistory',
  'Notification',
  'EmailLog',
  'SystemSetting',
  'FileAsset',
];

function sqlType(type: FieldType): string {
  switch (type) {
    case 'int':
      return 'INTEGER';
    case 'float':
      return 'REAL';
    case 'bool':
      return 'INTEGER';
    case 'datetime':
      return 'TEXT';
    default:
      return 'TEXT';
  }
}

function sqlDefault(def: FieldDef): string | null {
  if (def.default === undefined) return null;
  if (def.default === 'now') return null; // handled in the application layer (ISO-8601 with ms)
  if (typeof def.default === 'boolean') return String(def.default ? 1 : 0);
  if (typeof def.default === 'number') return String(def.default);
  return `'${String(def.default).replace(/'/g, "''")}'`;
}

/**
 * Builds the `CREATE TABLE IF NOT EXISTS` statements for the whole schema.
 */
export function buildSchemaSql(): string[] {
  const statements: string[] = [];

  for (const modelName of MODEL_ORDER) {
    const def = MODELS[modelName];
    const columns: string[] = [];
    const tableConstraints: string[] = [];

    for (const [field, fieldDef] of Object.entries(def.fields)) {
      let col = `"${field}" ${sqlType(fieldDef.type)}`;
      if (field === 'id') {
        col += ' PRIMARY KEY NOT NULL';
      } else {
        const dflt = sqlDefault(fieldDef);
        if (dflt !== null) col += ` DEFAULT ${dflt}`;
      }
      columns.push(col);
    }

    for (const unique of UNIQUE_COLUMN_DECLARATIONS[modelName] || []) {
      tableConstraints.push(`UNIQUE ("${unique}")`);
    }

    for (const group of def.uniques || []) {
      tableConstraints.push(`UNIQUE (${group.map((c) => `"${c}"`).join(', ')})`);
    }

    // Foreign keys
    for (const [relName, rel] of Object.entries(def.relations)) {
      if (rel.kind !== 'one') continue;
      const target = MODELS[rel.model];
      if (!target) continue;
      const onDelete = ON_DELETE_CASCADE[`${modelName}.${relName}`] ? ' ON DELETE CASCADE' : '';
      tableConstraints.push(`FOREIGN KEY ("${rel.fk}") REFERENCES "${target.table}"("id")${onDelete}`);
    }

    statements.push(
      `CREATE TABLE IF NOT EXISTS "${def.table}" (\n  ${columns.join(',\n  ')}${
        tableConstraints.length ? `,\n  ${tableConstraints.join(',\n  ')}` : ''
      }\n)`,
    );

    for (const group of def.indexes || []) {
      const idxName = `idx_${def.table}_${group.join('_')}`;
      statements.push(
        `CREATE INDEX IF NOT EXISTS "${idxName}" ON "${def.table}" (${group.map((c) => `"${c}"`).join(', ')})`,
      );
    }
  }

  return statements;
}

/** Relations that cascade on delete (mirrors the original schema's `onDelete: Cascade`). */
const ON_DELETE_CASCADE: Record<string, boolean> = {
  'UserBusiness.user': true,
  'UserBusiness.business': true,
  'UserLocation.user': true,
  'UserLocation.location': true,
  'UserSiteLocation.user': true,
  'UserSiteLocation.siteLocation': true,
  'GreenZoneRequestPhoto.request': true,
  'MisAttachment.yearlyBudget': true,
  'MisAttachment.monthlyExpense': true,
  'TreeTargetHistory.treeTarget': true,
  'WorkflowStepHistory.workflowInstance': true,
  'Notification.user': true,
};

/**
 * Resolves a compound unique key (e.g. `siteLocationId_fiscalYear_plantationType`)
 * into the list of columns it covers.
 */
export function resolveCompoundKey(modelName: string, key: string): string[] | null {
  const def = MODELS[modelName];
  if (!def) return null;
  for (const group of def.uniques || []) {
    if (group.join('_') === key) return group;
  }
  return null;
}
