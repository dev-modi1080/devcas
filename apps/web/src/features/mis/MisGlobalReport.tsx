import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Search, Download, RefreshCw } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate, formatINR, BudgetType } from '@cas/shared';

export const MisGlobalReport: React.FC = () => {
  const [budgetType, setBudgetType] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [status, setStatus] = useState('');

  // Dropdown options
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  // Results & pagination
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.get('/masters/cascading').then((res) => {
      setBusinesses(res.data.businesses || []);
      setLocations(res.data.locations || []);
      setSiteLocations(res.data.siteLocations || []);
      setExpenseCategories(res.data.expenseCategories || []);
    });
  }, []);

  useEffect(() => {
    if (businessId) {
      api.get(`/masters/companies?businessId=${businessId}`).then((res) => setCompanies(res.data));
    } else {
      setCompanies([]);
      setCompanyId('');
    }
  }, [businessId]);

  const handleSearch = async (targetPage = 0, targetPageSize = pageSize) => {
    setLoading(true);
    setSearched(true);
    try {
      const params: any = {
        page: targetPage + 1,
        pageSize: targetPageSize,
      };
      if (budgetType) params.type = budgetType;
      if (businessId) params.businessId = businessId;
      if (companyId) params.companyId = companyId;
      if (locationId) params.locationId = locationId;
      if (siteLocationId) params.siteLocationId = siteLocationId;
      if (fiscalYear) params.fiscalYear = fiscalYear;
      if (expenseCategoryId) params.expenseCategoryId = expenseCategoryId;
      if (status) params.status = status;

      const res = await api.get('/mis/reports/global-search', { params });
      setResults(res.data.data || []);
      setTotal(res.data.total || 0);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (budgetType) params.append('type', budgetType);
    if (businessId) params.append('businessId', businessId);
    if (companyId) params.append('companyId', companyId);
    if (locationId) params.append('locationId', locationId);
    if (siteLocationId) params.append('siteLocationId', siteLocationId);
    if (fiscalYear) params.append('fiscalYear', fiscalYear);
    if (expenseCategoryId) params.append('expenseCategoryId', expenseCategoryId);
    if (status) params.append('status', status);

    window.open(`/api/v1/mis/reports/global-search/export?${params.toString()}`, '_blank');
  };

  const handleReset = () => {
    setBudgetType('');
    setBusinessId('');
    setCompanyId('');
    setLocationId('');
    setSiteLocationId('');
    setFiscalYear('');
    setExpenseCategoryId('');
    setStatus('');
    setResults([]);
    setTotal(0);
    setSearched(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          MIS Global Search Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Analyze expenditure across locations with automated manpower efficiency calculation.
        </Typography>
      </Box>

      {/* Filter Panel */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Filter Options
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Budget Type" value={budgetType} onChange={(e) => setBudgetType(e.target.value)} size="small">
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value={BudgetType.CAPEX}>Capex</MenuItem>
              <MenuItem value={BudgetType.OPEX}>Opex</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Business" value={businessId} onChange={(e) => setBusinessId(e.target.value)} size="small">
              <MenuItem value="">All Businesses</MenuItem>
              {businesses.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.code}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} size="small" disabled={!businessId}>
              <MenuItem value="">All Companies</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)} size="small">
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.description}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Site Location" value={siteLocationId} onChange={(e) => setSiteLocationId(e.target.value)} size="small" disabled={!locationId}>
              <MenuItem value="">All Site Locations</MenuItem>
              {siteLocations.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Expense Category" value={expenseCategoryId} onChange={(e) => setExpenseCategoryId(e.target.value)} size="small">
              <MenuItem value="">All Categories</MenuItem>
              {expenseCategories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Workflow Status" value={status} onChange={(e) => setStatus(e.target.value)} size="small">
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="COMPLETE">Complete</MenuItem>
              <MenuItem value="PENDING_L1">Pending L1</MenuItem>
              <MenuItem value="PENDING_L2">Pending L2</MenuItem>
              <MenuItem value="PENDING_L3">Pending L3</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField fullWidth label="Fiscal Year" placeholder="2025-26" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} size="small" />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          <Button variant="outlined" color="inherit" onClick={handleReset} startIcon={<RefreshCw size={16} />}>
            Reset
          </Button>
          <Button variant="outlined" color="primary" onClick={handleExportExcel} startIcon={<Download size={16} />}>
            Export to Excel
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleSearch(0)} startIcon={<Search size={16} />}>
            Search
          </Button>
        </Box>
      </Paper>

      {/* Results Table */}
      {searched && (
        <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No expense entries found matching your filter criteria.
              </Typography>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Consumed Cost</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Workforce (M/F)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Area (Ha.)</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Manpower Efficiency
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {r.requestNo}
                        </TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.location?.description}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.siteLocation?.description}</Typography>
                        </TableCell>
                        <TableCell>{r.expenseCategory?.description || '-'}</TableCell>
                        <TableCell>{r.month}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatINR(r.consumedCost)}</TableCell>
                        <TableCell>{r.maleWorkforceCount} M / {r.femaleWorkforceCount} F</TableCell>
                        <TableCell>{Number(r.areaHa || 0)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#2670DC' }}>
                          {r.manpowerEfficiency !== null ? `${r.manpowerEfficiency} workers/Ha` : '-'}
                        </TableCell>
                        <TableCell>{formatDate(r.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 20, 50]}
                component="div"
                count={total}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(e, newPage) => handleSearch(newPage, pageSize)}
                onRowsPerPageChange={(e) => {
                  const newSize = parseInt(e.target.value, 10);
                  setPageSize(newSize);
                  handleSearch(0, newSize);
                }}
              />
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};
