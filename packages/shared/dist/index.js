"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_MAP = exports.ModuleType = exports.BudgetType = exports.PlantationTypeEnum = exports.RequestType = exports.WorkflowAction = exports.WorkflowStatus = exports.UserRole = void 0;
exports.calculatePlantationArea = calculatePlantationArea;
exports.calculateManpowerEfficiency = calculateManpowerEfficiency;
exports.getFiscalYear = getFiscalYear;
exports.getFiscalYearDateRange = getFiscalYearDateRange;
exports.getFiscalYearMonths = getFiscalYearMonths;
exports.isWithinEntryWindow = isWithinEntryWindow;
exports.formatINR = formatINR;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
var UserRole;
(function (UserRole) {
    UserRole["SITE_USER"] = "SITE_USER";
    UserRole["SITE_SUPERVISOR"] = "SITE_SUPERVISOR";
    UserRole["BU_ADMINISTRATOR"] = "BU_ADMINISTRATOR";
    UserRole["BU_ADMIN"] = "BU_ADMINISTRATOR";
    UserRole["CAS_ADMIN"] = "CAS_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["DRAFT"] = "DRAFT";
    WorkflowStatus["PENDING_L1"] = "PENDING_L1";
    WorkflowStatus["PENDING_L2"] = "PENDING_L2";
    WorkflowStatus["PENDING_L3"] = "PENDING_L3";
    WorkflowStatus["COMPLETE"] = "COMPLETE";
    WorkflowStatus["REJECTED"] = "REJECTED";
    WorkflowStatus["CANCELLED"] = "CANCELLED";
    WorkflowStatus["CALLBACK"] = "CALLBACK";
    WorkflowStatus["RETURNED"] = "RETURNED";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
var WorkflowAction;
(function (WorkflowAction) {
    WorkflowAction["SAVE_DRAFT"] = "SAVE_DRAFT";
    WorkflowAction["SUBMIT"] = "SUBMIT";
    WorkflowAction["APPROVE"] = "APPROVE";
    WorkflowAction["REJECT"] = "REJECT";
    WorkflowAction["RETURN"] = "RETURN";
    WorkflowAction["CALLBACK"] = "CALLBACK";
    WorkflowAction["CANCEL"] = "CANCEL";
})(WorkflowAction || (exports.WorkflowAction = WorkflowAction = {}));
var RequestType;
(function (RequestType) {
    RequestType["CREATION"] = "CREATION";
    RequestType["MORTALITY"] = "MORTALITY";
})(RequestType || (exports.RequestType = RequestType = {}));
var PlantationTypeEnum;
(function (PlantationTypeEnum) {
    PlantationTypeEnum["TREE"] = "Tree";
    PlantationTypeEnum["PALM"] = "Palm";
    PlantationTypeEnum["SHRUB"] = "Shrub";
    PlantationTypeEnum["MANGROVE"] = "Mangrove";
    PlantationTypeEnum["GROUND_COVER_LAWN"] = "Ground Cover & Lawn";
})(PlantationTypeEnum || (exports.PlantationTypeEnum = PlantationTypeEnum = {}));
var BudgetType;
(function (BudgetType) {
    BudgetType["CAPEX"] = "Capex";
    BudgetType["OPEX"] = "Opex";
})(BudgetType || (exports.BudgetType = BudgetType = {}));
var ModuleType;
(function (ModuleType) {
    ModuleType["GREEN_ZONE"] = "GREEN_ZONE";
    ModuleType["MIS"] = "MIS";
    ModuleType["TREES_100M"] = "TREES_100M";
})(ModuleType || (exports.ModuleType = ModuleType = {}));
/**
 * Area Calculation Formula
 * Trees/Palm Area (Ha.) = (count * row-to-row m * plant-to-plant m) / 10,000
 * Shrubs Area (Ha.) = (count * row-to-row m * plant-to-plant m) / 10,000
 */
function calculatePlantationArea(count, rowToRowM, plantToPlantM) {
    if (!count || !rowToRowM || !plantToPlantM || count <= 0 || rowToRowM <= 0 || plantToPlantM <= 0) {
        return 0;
    }
    const area = (count * rowToRowM * plantToPlantM) / 10000;
    return Number(area.toFixed(4));
}
/**
 * Manpower efficiency = (Male + Female workforce count) / Area in hectares
 * Blank/null if area is 0 or not provided
 */
function calculateManpowerEfficiency(maleCount, femaleCount, areaHa) {
    if (!areaHa || areaHa <= 0) {
        return null;
    }
    const totalWorkforce = (Number(maleCount) || 0) + (Number(femaleCount) || 0);
    const efficiency = totalWorkforce / Number(areaHa);
    return Number(efficiency.toFixed(2));
}
/**
 * Fiscal Year Utilities (Indian FY: April 1 to March 31)
 * Example: Date in 2026-05 => "2026-27"
 * Example: Date in 2026-02 => "2025-26"
 */
function getFiscalYear(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    const month = d.getMonth(); // 0 is Jan, 3 is Apr, 11 is Dec
    const year = d.getFullYear();
    if (month >= 3) {
        // April (3) to Dec (11)
        const nextYearShort = String((year + 1) % 100).padStart(2, '0');
        return `${year}-${nextYearShort}`;
    }
    else {
        // Jan (0) to March (2)
        const currentYearShort = String(year % 100).padStart(2, '0');
        return `${year - 1}-${currentYearShort}`;
    }
}
/**
 * Get start and end date for a fiscal year string like "2025-26"
 */
function getFiscalYearDateRange(fiscalYear) {
    const startYear = parseInt(fiscalYear.split('-')[0], 10);
    const startDate = new Date(Date.UTC(startYear, 3, 1, 0, 0, 0, 0)); // April 1
    const endDate = new Date(Date.UTC(startYear + 1, 2, 31, 23, 59, 59, 999)); // March 31
    return { startDate, endDate };
}
/**
 * List 12 months for a fiscal year (Apr to Mar)
 */
function getFiscalYearMonths(fiscalYear) {
    const startYear = parseInt(fiscalYear.split('-')[0], 10);
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return monthNames.map((name, index) => {
        const calendarMonth = (index + 3) % 12;
        const calendarYear = index < 9 ? startYear : startYear + 1;
        return {
            key: name,
            label: `${name} ${calendarYear}`,
            monthNumber: index + 1,
            calendarMonth,
            calendarYear,
        };
    });
}
/**
 * Check if a date falls within an entry window (e.g. 1st to 10th)
 */
function isWithinEntryWindow(dateInput = new Date(), startDay = 1, endDay = 10) {
    const d = new Date(dateInput);
    const day = d.getDate();
    return day >= startDay && day <= endDay;
}
/**
 * Indian currency format helper (₹ 10,00,000)
 */
function formatINR(val) {
    if (val === null || val === undefined || isNaN(Number(val)))
        return '₹ 0';
    const num = Number(val);
    return '₹ ' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
/**
 * Format date in Indian Standard Time / readable format
 */
function formatDate(dateInput) {
    if (!dateInput)
        return '-';
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function formatDateTime(dateInput) {
    if (!dateInput)
        return '-';
    const d = new Date(dateInput);
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}
exports.STATUS_MAP = {
    [WorkflowStatus.DRAFT]: {
        label: 'Draft',
        color: 'default',
        bgHex: '#ECEFF1',
        textHex: '#455A64',
    },
    [WorkflowStatus.PENDING_L1]: {
        label: 'Pending L1 (Site Supervisor)',
        color: 'warning',
        bgHex: '#FFF8E1',
        textHex: '#F57F17',
    },
    [WorkflowStatus.PENDING_L2]: {
        label: 'Pending L2 (BU Administrator)',
        color: 'warning',
        bgHex: '#FFF3E0',
        textHex: '#E65100',
    },
    [WorkflowStatus.PENDING_L3]: {
        label: 'Pending L3 (CAS Admin)',
        color: 'info',
        bgHex: '#E1F5FE',
        textHex: '#0277BD',
    },
    [WorkflowStatus.COMPLETE]: {
        label: 'Complete',
        color: 'success',
        bgHex: '#E8F5E9',
        textHex: '#2E7D32',
    },
    [WorkflowStatus.REJECTED]: {
        label: 'Rejected',
        color: 'error',
        bgHex: '#FFEBEE',
        textHex: '#C62828',
    },
    [WorkflowStatus.CANCELLED]: {
        label: 'Cancelled',
        color: 'default',
        bgHex: '#EEEEEE',
        textHex: '#616161',
    },
    [WorkflowStatus.CALLBACK]: {
        label: 'Callback',
        color: 'secondary',
        bgHex: '#EDE7F6',
        textHex: '#512DA8',
    },
    [WorkflowStatus.RETURNED]: {
        label: 'Returned',
        color: 'warning',
        bgHex: '#FBE9E7',
        textHex: '#D84315',
    },
};
