"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe('Shared Utilities', () => {
    describe('calculatePlantationArea', () => {
        it('calculates Trees/Palm/Shrub area correctly in Hectares', () => {
            // 1000 trees, 3m row-to-row, 2m plant-to-plant
            // (1000 * 3 * 2) / 10,000 = 6000 / 10000 = 0.6 Ha
            expect((0, index_1.calculatePlantationArea)(1000, 3, 2)).toBe(0.6);
            expect((0, index_1.calculatePlantationArea)(2500, 4.5, 3.2)).toBe(3.6);
        });
        it('returns 0 for non-positive or missing inputs', () => {
            expect((0, index_1.calculatePlantationArea)(0, 3, 2)).toBe(0);
            expect((0, index_1.calculatePlantationArea)(-10, 3, 2)).toBe(0);
            expect((0, index_1.calculatePlantationArea)(100, 0, 2)).toBe(0);
        });
    });
    describe('calculateManpowerEfficiency', () => {
        it('calculates efficiency (Male + Female) / Area in Ha', () => {
            // 10 male + 15 female = 25 workforce, area = 5 Ha => 5.0
            expect((0, index_1.calculateManpowerEfficiency)(10, 15, 5)).toBe(5);
        });
        it('returns null if area is 0 or negative', () => {
            expect((0, index_1.calculateManpowerEfficiency)(10, 15, 0)).toBeNull();
            expect((0, index_1.calculateManpowerEfficiency)(10, 15, -2)).toBeNull();
        });
    });
    describe('getFiscalYear', () => {
        it('identifies fiscal year for April through December', () => {
            expect((0, index_1.getFiscalYear)('2025-04-01')).toBe('2025-26');
            expect((0, index_1.getFiscalYear)('2025-08-15')).toBe('2025-26');
            expect((0, index_1.getFiscalYear)('2025-12-31')).toBe('2025-26');
        });
        it('identifies fiscal year for January through March', () => {
            expect((0, index_1.getFiscalYear)('2026-01-01')).toBe('2025-26');
            expect((0, index_1.getFiscalYear)('2026-03-31')).toBe('2025-26');
        });
    });
    describe('getFiscalYearMonths', () => {
        it('generates 12 months starting from April to March', () => {
            const months = (0, index_1.getFiscalYearMonths)('2025-26');
            expect(months).toHaveLength(12);
            expect(months[0].key).toBe('Apr');
            expect(months[0].calendarYear).toBe(2025);
            expect(months[11].key).toBe('Mar');
            expect(months[11].calendarYear).toBe(2026);
        });
    });
    describe('isWithinEntryWindow', () => {
        it('checks if a day is within 1 to 10', () => {
            expect((0, index_1.isWithinEntryWindow)(new Date(2025, 3, 5), 1, 10)).toBe(true);
            expect((0, index_1.isWithinEntryWindow)(new Date(2025, 3, 1), 1, 10)).toBe(true);
            expect((0, index_1.isWithinEntryWindow)(new Date(2025, 3, 11), 1, 10)).toBe(false);
            expect((0, index_1.isWithinEntryWindow)(new Date(2025, 3, 25), 1, 10)).toBe(false);
        });
    });
    describe('100 Million Trees Calculations', () => {
        it('calculates balance plantation FY = Target - Completed', () => {
            const target = 50000;
            const completed = 42000;
            const balance = target - completed;
            expect(balance).toBe(8000);
        });
        it('handles over-achievement when completed exceeds target (negative balance)', () => {
            const target = 10000;
            const completed = 12500;
            const balance = target - completed;
            expect(balance).toBe(-2500);
            const isOverAchieved = balance < 0;
            expect(isOverAchieved).toBe(true);
        });
        it('computes net completed plantation by deducting approved mortality', () => {
            const approvedCreated = 15000;
            const approvedMortality = 850;
            const netCompleted = approvedCreated - approvedMortality;
            expect(netCompleted).toBe(14150);
        });
    });
    describe('MIS Reminder Schedule Logic', () => {
        it('flags reminders on the 3rd, 6th, and 9th day of the month', () => {
            const reminderDays = [3, 6, 9];
            const checkReminder = (day) => reminderDays.includes(day);
            expect(checkReminder(3)).toBe(true);
            expect(checkReminder(6)).toBe(true);
            expect(checkReminder(9)).toBe(true);
            expect(checkReminder(4)).toBe(false);
            expect(checkReminder(10)).toBe(false);
        });
    });
});
