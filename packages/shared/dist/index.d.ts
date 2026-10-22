export declare enum UserRole {
    SITE_USER = "SITE_USER",
    SITE_SUPERVISOR = "SITE_SUPERVISOR",
    BU_ADMINISTRATOR = "BU_ADMINISTRATOR",
    BU_ADMIN = "BU_ADMINISTRATOR",
    CAS_ADMIN = "CAS_ADMIN"
}
export declare enum WorkflowStatus {
    DRAFT = "DRAFT",
    PENDING_L1 = "PENDING_L1",
    PENDING_L2 = "PENDING_L2",
    PENDING_L3 = "PENDING_L3",
    COMPLETE = "COMPLETE",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    CALLBACK = "CALLBACK",
    RETURNED = "RETURNED"
}
export declare enum WorkflowAction {
    SAVE_DRAFT = "SAVE_DRAFT",
    SUBMIT = "SUBMIT",
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    RETURN = "RETURN",
    CALLBACK = "CALLBACK",
    CANCEL = "CANCEL"
}
export declare enum RequestType {
    CREATION = "CREATION",
    MORTALITY = "MORTALITY"
}
export declare enum PlantationTypeEnum {
    TREE = "Tree",
    PALM = "Palm",
    SHRUB = "Shrub",
    MANGROVE = "Mangrove",
    GROUND_COVER_LAWN = "Ground Cover & Lawn"
}
export declare enum BudgetType {
    CAPEX = "Capex",
    OPEX = "Opex"
}
export declare enum ModuleType {
    GREEN_ZONE = "GREEN_ZONE",
    MIS = "MIS",
    TREES_100M = "TREES_100M"
}
/**
 * Area Calculation Formula
 * Trees/Palm Area (Ha.) = (count * row-to-row m * plant-to-plant m) / 10,000
 * Shrubs Area (Ha.) = (count * row-to-row m * plant-to-plant m) / 10,000
 */
export declare function calculatePlantationArea(count: number, rowToRowM: number, plantToPlantM: number): number;
/**
 * Manpower efficiency = (Male + Female workforce count) / Area in hectares
 * Blank/null if area is 0 or not provided
 */
export declare function calculateManpowerEfficiency(maleCount: number, femaleCount: number, areaHa: number): number | null;
/**
 * Fiscal Year Utilities (Indian FY: April 1 to March 31)
 * Example: Date in 2026-05 => "2026-27"
 * Example: Date in 2026-02 => "2025-26"
 */
export declare function getFiscalYear(dateInput?: Date | string | null): string;
/**
 * Get start and end date for a fiscal year string like "2025-26"
 */
export declare function getFiscalYearDateRange(fiscalYear: string): {
    startDate: Date;
    endDate: Date;
};
/**
 * List 12 months for a fiscal year (Apr to Mar)
 */
export declare function getFiscalYearMonths(fiscalYear: string): {
    key: string;
    label: string;
    monthNumber: number;
    calendarMonth: number;
    calendarYear: number;
}[];
/**
 * Check if a date falls within an entry window (e.g. 1st to 10th)
 */
export declare function isWithinEntryWindow(dateInput?: Date | string, startDay?: number, endDay?: number): boolean;
/**
 * Indian currency format helper (₹ 10,00,000)
 */
export declare function formatINR(val: number | string | null | undefined): string;
/**
 * Format date in Indian Standard Time / readable format
 */
export declare function formatDate(dateInput: Date | string | null | undefined): string;
export declare function formatDateTime(dateInput: Date | string | null | undefined): string;
/**
 * Status presentation details
 */
export interface StatusConfig {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    bgHex: string;
    textHex: string;
}
export declare const STATUS_MAP: Record<WorkflowStatus, StatusConfig>;
