-- =================================================================
-- Supabase (PostgreSQL) Schema for CAS Digital Platform
-- Run this script directly in the Supabase SQL Editor
-- =================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "employeeCode" TEXT,
  "role" TEXT DEFAULT 'SITE_USER',
  "active" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("email"),
  UNIQUE ("employeeCode")
);


CREATE TABLE IF NOT EXISTS "businesses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdById" TEXT,
  "updatedById" TEXT,
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "companies" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "businessId" TEXT,
  "code" TEXT,
  "shortName" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdById" TEXT,
  "updatedById" TEXT,
  UNIQUE ("businessId", "code"),
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "locations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdById" TEXT,
  "updatedById" TEXT,
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "site_locations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "locationId" TEXT,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdById" TEXT,
  "updatedById" TEXT,
  UNIQUE ("locationId", "code"),
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "green_zones" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "businessId" TEXT,
  "companyId" TEXT,
  "locationId" TEXT,
  "siteLocationId" TEXT,
  "greenZoneNo" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "createdById" TEXT,
  "updatedById" TEXT,
  UNIQUE ("greenZoneNo"),
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "user_businesses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT,
  "businessId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("userId", "businessId"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "user_locations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT,
  "locationId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("userId", "locationId"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "user_site_locations" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT,
  "siteLocationId" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("userId", "siteLocationId"),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "plantation_categories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "plantation_types" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "botanicals" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "plantationTypeId" TEXT,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("code"),
  FOREIGN KEY ("plantationTypeId") REFERENCES "plantation_types"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "irrigation_types" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "distance_row_to_rows" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "plantationTypeId" TEXT,
  "distanceM" DOUBLE PRECISION,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("plantationTypeId") REFERENCES "plantation_types"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "distance_plant_to_plants" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "plantationTypeId" TEXT,
  "distanceM" DOUBLE PRECISION,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("plantationTypeId") REFERENCES "plantation_types"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "isDeleted" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("code")
);


CREATE TABLE IF NOT EXISTS "green_zone_requests" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "requestNo" TEXT,
  "type" TEXT DEFAULT 'CREATION',
  "parentRequestId" TEXT,
  "businessId" TEXT,
  "companyId" TEXT,
  "locationId" TEXT,
  "siteLocationId" TEXT,
  "greenZoneId" TEXT,
  "plantationCategoryId" TEXT,
  "plantationTypeId" TEXT,
  "botanicalId" TEXT,
  "irrigationTypeId" TEXT,
  "distanceRowToRowM" DOUBLE PRECISION,
  "distancePlantToPlantM" DOUBLE PRECISION,
  "treeCount" INTEGER,
  "palmCount" INTEGER,
  "mangroveCount" INTEGER,
  "shrubCount" INTEGER,
  "groundCoverArea" DOUBLE PRECISION,
  "calculatedAreaHa" DOUBLE PRECISION DEFAULT 0,
  "overlapWithCover" BOOLEAN DEFAULT FALSE,
  "plantationMonthYear" TEXT,
  "remarks" TEXT,
  "status" TEXT DEFAULT 'DRAFT',
  "currentLevel" TEXT,
  "mortalityCount" INTEGER,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("requestNo"),
  FOREIGN KEY ("parentRequestId") REFERENCES "green_zone_requests"("id") ON DELETE SET NULL,
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("greenZoneId") REFERENCES "green_zones"("id") ON DELETE SET NULL,
  FOREIGN KEY ("plantationCategoryId") REFERENCES "plantation_categories"("id") ON DELETE SET NULL,
  FOREIGN KEY ("plantationTypeId") REFERENCES "plantation_types"("id") ON DELETE SET NULL,
  FOREIGN KEY ("botanicalId") REFERENCES "botanicals"("id") ON DELETE SET NULL,
  FOREIGN KEY ("irrigationTypeId") REFERENCES "irrigation_types"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_green_zone_requests_status_type" ON "green_zone_requests" ("status", "type");
CREATE INDEX IF NOT EXISTS "idx_green_zone_requests_businessId_locationId_siteLocationId" ON "green_zone_requests" ("businessId", "locationId", "siteLocationId");
CREATE INDEX IF NOT EXISTS "idx_green_zone_requests_createdAt" ON "green_zone_requests" ("createdAt");

CREATE TABLE IF NOT EXISTS "green_zone_request_photos" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "requestId" TEXT,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("requestId") REFERENCES "green_zone_requests"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "mis_yearly_budgets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "requestNo" TEXT,
  "type" TEXT DEFAULT 'Capex',
  "businessId" TEXT,
  "companyId" TEXT,
  "locationId" TEXT,
  "siteLocationId" TEXT,
  "fiscalYear" TEXT,
  "budgetAmount" DOUBLE PRECISION,
  "remarks" TEXT,
  "isLateEntry" BOOLEAN DEFAULT FALSE,
  "status" TEXT,
  "currentLevel" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("requestNo"),
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_mis_yearly_budgets_businessId_locationId_fiscalYear" ON "mis_yearly_budgets" ("businessId", "locationId", "fiscalYear");

CREATE TABLE IF NOT EXISTS "mis_monthly_expenses" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "requestNo" TEXT,
  "type" TEXT DEFAULT 'Capex',
  "businessId" TEXT,
  "companyId" TEXT,
  "locationId" TEXT,
  "siteLocationId" TEXT,
  "expenseCategoryId" TEXT,
  "month" TEXT,
  "fiscalYear" TEXT,
  "consumedCost" DOUBLE PRECISION,
  "maleWorkforceCount" INTEGER DEFAULT 0,
  "femaleWorkforceCount" INTEGER DEFAULT 0,
  "areaHa" DOUBLE PRECISION DEFAULT 0,
  "remarks" TEXT,
  "isLateEntry" BOOLEAN DEFAULT FALSE,
  "status" TEXT,
  "currentLevel" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("requestNo"),
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "idx_mis_monthly_expenses_businessId_locationId_fiscalYear_month" ON "mis_monthly_expenses" ("businessId", "locationId", "fiscalYear", "month");

CREATE TABLE IF NOT EXISTS "mis_attachments" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "yearlyBudgetId" TEXT,
  "monthlyExpenseId" TEXT,
  "fileName" TEXT,
  "fileUrl" TEXT,
  "fileSize" INTEGER,
  "mimeType" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("yearlyBudgetId") REFERENCES "mis_yearly_budgets"("id") ON DELETE SET NULL,
  FOREIGN KEY ("monthlyExpenseId") REFERENCES "mis_monthly_expenses"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "tree_targets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "businessId" TEXT,
  "companyId" TEXT,
  "locationId" TEXT,
  "siteLocationId" TEXT,
  "fiscalYear" TEXT,
  "plantationType" TEXT,
  "targetCount" INTEGER,
  "remarks" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("siteLocationId", "fiscalYear", "plantationType"),
  FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE SET NULL,
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL,
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL,
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "tree_target_histories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "treeTargetId" TEXT,
  "oldTargetCount" INTEGER,
  "newTargetCount" INTEGER,
  "remarks" TEXT,
  "changedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("treeTargetId") REFERENCES "tree_targets"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "tree_opening_balances" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "siteLocationId" TEXT,
  "plantationType" TEXT,
  "count" INTEGER DEFAULT 0,
  "fiscalYear" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("siteLocationId", "fiscalYear", "plantationType"),
  FOREIGN KEY ("siteLocationId") REFERENCES "site_locations"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "workflow_instances" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "status" TEXT DEFAULT 'DRAFT',
  "currentLevel" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("entityType", "entityId")
);


CREATE TABLE IF NOT EXISTS "workflow_step_histories" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "workflowInstanceId" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "level" TEXT,
  "actorId" TEXT,
  "action" TEXT,
  "remarks" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("workflowInstanceId") REFERENCES "workflow_instances"("id") ON DELETE SET NULL,
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "userId" TEXT,
  "title" TEXT,
  "message" TEXT,
  "link" TEXT,
  "read" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
);


CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "to" TEXT,
  "subject" TEXT,
  "template" TEXT,
  "status" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "key" TEXT,
  "value" TEXT,
  "description" TEXT,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE ("key")
);


CREATE TABLE IF NOT EXISTS "file_assets" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "originalName" TEXT,
  "storedName" TEXT,
  "mimeType" TEXT,
  "size" INTEGER,
  "path" TEXT,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

