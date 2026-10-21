import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { getDesignTokens } from './theme/theme';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Green Zone Pages
import { GreenZoneDashboard } from './features/green-zone/GreenZoneDashboard';
import { GreenZoneCreateRequest } from './features/green-zone/GreenZoneCreateRequest';
import { GreenZoneMyRequests } from './features/green-zone/GreenZoneMyRequests';
import { GreenZoneApprovals } from './features/green-zone/GreenZoneApprovals';
import { GreenZoneMortalityRequest } from './features/green-zone/GreenZoneMortalityRequest';
import { GreenZoneGlobalReport } from './features/green-zone/GreenZoneGlobalReport';
import { GreenZoneRequestDetail } from './features/green-zone/GreenZoneRequestDetail';

// MIS Pages
import { MisDashboard } from './features/mis/MisDashboard';
import { MisYearlyBudgetEntry } from './features/mis/MisYearlyBudgetEntry';
import { MisMonthlyExpenseEntry } from './features/mis/MisMonthlyExpenseEntry';
import { MisMyEntries } from './features/mis/MisMyEntries';
import { MisApprovals } from './features/mis/MisApprovals';
import { MisGlobalReport } from './features/mis/MisGlobalReport';

// 100 Million Trees Pages
import { TreesReport } from './features/trees/TreesReport';
import { TreesTargetEntry } from './features/trees/TreesTargetEntry';
import { TreesOpeningBalance } from './features/trees/TreesOpeningBalance';

// Masters & Admin Pages
import { MasterManagement } from './features/masters/MasterManagement';
import { UserMaster } from './features/masters/UserMaster';
import { SystemSettingsPage } from './features/masters/SystemSettingsPage';

export const AppContent: React.FC = () => {
  const { themeMode, fontScale } = useAuth();

  const theme = useMemo(() => {
    return createTheme(getDesignTokens(themeMode, fontScale));
  }, [themeMode, fontScale]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/green-zone/dashboard" replace />} />

            {/* Green Zone Module */}
            <Route path="/green-zone" element={<Navigate to="/green-zone/dashboard" replace />} />
            <Route path="/green-zone/dashboard" element={<GreenZoneDashboard />} />
            <Route path="/green-zone/create" element={<GreenZoneCreateRequest />} />
            <Route path="/green-zone/my-requests" element={<GreenZoneMyRequests />} />
            <Route path="/green-zone/approvals" element={<GreenZoneApprovals />} />
            <Route path="/green-zone/mortality" element={<GreenZoneMortalityRequest />} />
            <Route path="/green-zone/report" element={<GreenZoneGlobalReport />} />
            <Route path="/green-zone/requests/:id" element={<GreenZoneRequestDetail />} />

            {/* MIS Module */}
            <Route path="/mis" element={<Navigate to="/mis/dashboard" replace />} />
            <Route path="/mis/dashboard" element={<MisDashboard />} />
            <Route path="/mis/yearly-budget" element={<MisYearlyBudgetEntry />} />
            <Route path="/mis/yearly" element={<Navigate to="/mis/yearly-budget" replace />} />
            <Route path="/mis/monthly-expense" element={<MisMonthlyExpenseEntry />} />
            <Route path="/mis/monthly" element={<Navigate to="/mis/monthly-expense" replace />} />
            <Route path="/mis/my-entries" element={<MisMyEntries />} />
            <Route path="/mis/approvals" element={<MisApprovals />} />
            <Route path="/mis/report" element={<MisGlobalReport />} />

            {/* 100 Million Trees Module */}
            <Route path="/trees" element={<Navigate to="/trees/report" replace />} />
            <Route path="/trees/report" element={<TreesReport />} />
            <Route path="/trees/targets" element={<TreesTargetEntry />} />
            <Route path="/trees/opening-balances" element={<TreesOpeningBalance />} />

            {/* Masters & System Configuration */}
            <Route path="/masters" element={<MasterManagement />} />
            <Route path="/masters/businesses" element={<MasterManagement />} />
            <Route path="/masters/companies" element={<MasterManagement />} />
            <Route path="/masters/locations" element={<MasterManagement />} />
            <Route path="/masters/site-locations" element={<MasterManagement />} />
            <Route path="/masters/green-zones" element={<MasterManagement />} />
            <Route path="/masters/users" element={<UserMaster />} />
            <Route path="/masters/settings" element={<SystemSettingsPage />} />
            <Route path="/users" element={<UserMaster />} />
            <Route path="/settings" element={<SystemSettingsPage />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/green-zone/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default AppContent;
