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
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Search, Download, FileText, TreePine, Target, CheckCircle2, TrendingUp } from 'lucide-react';
import api from '../../api/client';
import { getFiscalYear } from '@cas/shared';

export const TreesReport: React.FC = () => {
  const currentFY = getFiscalYear();
  const [fiscalYear, setFiscalYear] = useState(currentFY);
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');

  // Options
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);

  // Report data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/masters/cascading').then((res) => {
      setBusinesses(res.data.businesses || []);
      setLocations(res.data.locations || []);
      setSiteLocations(res.data.siteLocations || []);
    });
    fetchReport();
  }, []);

  useEffect(() => {
    if (businessId) {
      api.get(`/masters/companies?businessId=${businessId}`).then((res) => setCompanies(res.data));
    } else {
      setCompanies([]);
      setCompanyId('');
    }
  }, [businessId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = { fiscalYear };
      if (businessId) params.businessId = businessId;
      if (companyId) params.companyId = companyId;
      if (locationId) params.locationId = locationId;
      if (siteLocationId) params.siteLocationId = siteLocationId;

      const res = await api.get('/trees/report', { params });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams({ fiscalYear });
    if (businessId) params.append('businessId', businessId);
    if (companyId) params.append('companyId', companyId);
    if (locationId) params.append('locationId', locationId);
    if (siteLocationId) params.append('siteLocationId', siteLocationId);

    window.open(`/api/v1/trees/report/export/excel?${params.toString()}`, '_blank');
  };

  const handleExportPdf = () => {
    const params = new URLSearchParams({ fiscalYear });
    if (businessId) params.append('businessId', businessId);
    if (companyId) params.append('companyId', companyId);
    if (locationId) params.append('locationId', locationId);
    if (siteLocationId) params.append('siteLocationId', siteLocationId);

    window.open(`/api/v1/trees/report/export/pdf?${params.toString()}`, '_blank');
  };

  const { summary, months = [], rows = [] } = reportData || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            100 Million Trees Initiative Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tracking plantation targets and monthly net progress (Tree, Palm, Mangrove) across Adani Group.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" color="primary" onClick={handleExportPdf} startIcon={<FileText size={18} />}>
            Export PDF
          </Button>
          <Button variant="contained" color="primary" onClick={handleExportExcel} startIcon={<Download size={18} />}>
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Summary Strip */}
      {summary && (
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Target Plantation FY (Nos.)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                  {summary.totalTarget?.toLocaleString('en-IN') || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Completed Plantation FY (Nos.)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#10B981' }}>
                  {summary.totalCompleted?.toLocaleString('en-IN') || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Balance Plantation FY (Nos.)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mt: 0.5,
                    color: summary.totalBalance <= 0 ? '#10B981' : '#F59E0B',
                  }}
                >
                  {summary.totalBalance?.toLocaleString('en-IN') || 0}
                  {summary.totalBalance < 0 && (
                    <Typography component="span" variant="caption" sx={{ ml: 1, color: '#10B981', fontWeight: 700 }}>
                      (Over-achieved)
                    </Typography>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    Achievement
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#2670DC' }}>
                    {summary.achievementPercent || 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(summary.achievementPercent || 0, 100)}
                  sx={{ height: 10, borderRadius: 5, bgcolor: '#E2E8F0' }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filter Panel */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Fiscal Year" value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} size="small" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Business" value={businessId} onChange={(e) => setBusinessId(e.target.value)} size="small">
              <MenuItem value="">All Businesses</MenuItem>
              {businesses.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.code}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)} size="small">
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button variant="contained" fullWidth onClick={fetchReport} startIcon={<Search size={16} />} sx={{ height: 40 }}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 100 Million Trees Progress Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No target or plantation data found for Fiscal Year {fiscalYear}.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', zIndex: 3 }}>Sr</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', zIndex: 3 }}>Business</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', zIndex: 3 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', zIndex: 3 }}>Site Location</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', minWidth: 140 }}>
                    Plantation till year start (Nos.)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', minWidth: 120 }}>
                    Target FY (Nos.)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', minWidth: 130, color: '#10B981' }}>
                    Completed FY (Nos.)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default', minWidth: 120 }}>
                    Balance FY (Nos.)
                  </TableCell>
                  {months.map((m: string) => (
                    <TableCell key={m} align="center" sx={{ fontWeight: 700, bgcolor: 'background.default', minWidth: 60 }}>
                      {m}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={r.srNo} hover>
                    <TableCell>{r.srNo}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.business}</TableCell>
                    <TableCell>{r.location}</TableCell>
                    <TableCell>{r.siteLocation}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.plantationTillYearStart?.toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{r.targetPlantationFY?.toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#10B981' }}>{r.completedPlantationFY?.toLocaleString('en-IN')}</TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: r.balancePlantationFY <= 0 ? '#10B981' : '#F59E0B',
                      }}
                    >
                      {r.balancePlantationFY?.toLocaleString('en-IN')}
                    </TableCell>
                    {months.map((m: string) => (
                      <TableCell key={m} align="center" sx={{ color: (r.monthlyProgress[m] || 0) > 0 ? '#10B981' : 'text.disabled' }}>
                        {r.monthlyProgress[m] || 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};
