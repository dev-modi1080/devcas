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
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Download, RefreshCw, Eye } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatDate } from '@cas/shared';
import { useNavigate } from 'react-router-dom';

export const GreenZoneGlobalReport: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');
  const [plantationCategoryId, setPlantationCategoryId] = useState('');
  const [plantationTypeId, setPlantationTypeId] = useState('');
  const [botanicalId, setBotanicalId] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // Dropdown options
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [plantationCategories, setPlantationCategories] = useState<any[]>([]);
  const [plantationTypes, setPlantationTypes] = useState<any[]>([]);
  const [botanicals, setBotanicals] = useState<any[]>([]);

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
      setPlantationTypes(res.data.plantationTypes || []);
      setPlantationCategories(res.data.plantationCategories || []);
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

  useEffect(() => {
    if (plantationTypeId) {
      api.get(`/masters/botanicals?plantationTypeId=${plantationTypeId}`).then((res) => setBotanicals(res.data));
    } else {
      setBotanicals([]);
      setBotanicalId('');
    }
  }, [plantationTypeId]);

  const handleSearch = async (targetPage = 0, targetPageSize = pageSize) => {
    setLoading(true);
    setSearched(true);
    try {
      const params: any = {
        page: targetPage + 1,
        pageSize: targetPageSize,
      };
      if (businessId) params.businessId = businessId;
      if (companyId) params.companyId = companyId;
      if (locationId) params.locationId = locationId;
      if (siteLocationId) params.siteLocationId = siteLocationId;
      if (plantationCategoryId) params.plantationCategoryId = plantationCategoryId;
      if (plantationTypeId) params.plantationTypeId = plantationTypeId;
      if (botanicalId) params.botanicalId = botanicalId;
      if (type) params.type = type;
      if (status) params.status = status;
      if (createdFrom) params.createdFrom = createdFrom;
      if (createdTo) params.createdTo = createdTo;

      const res = await api.get('/green-zone/reports/global-search', { params });
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
    if (businessId) params.append('businessId', businessId);
    if (companyId) params.append('companyId', companyId);
    if (locationId) params.append('locationId', locationId);
    if (siteLocationId) params.append('siteLocationId', siteLocationId);
    if (plantationCategoryId) params.append('plantationCategoryId', plantationCategoryId);
    if (plantationTypeId) params.append('plantationTypeId', plantationTypeId);
    if (botanicalId) params.append('botanicalId', botanicalId);
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    window.open(`/api/v1/green-zone/reports/global-search/export?${params.toString()}`, '_blank');
  };

  const handleReset = () => {
    setBusinessId('');
    setCompanyId('');
    setLocationId('');
    setSiteLocationId('');
    setPlantationCategoryId('');
    setPlantationTypeId('');
    setBotanicalId('');
    setType('');
    setStatus('');
    setCreatedFrom('');
    setCreatedTo('');
    setResults([]);
    setTotal(0);
    setSearched(false);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Green Zone Global Search Report
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter through historical records across Business Units, species, and status.
        </Typography>
      </Box>

      {/* Filter Panel */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Search Criteria
        </Typography>
        <Grid container spacing={2}>
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
            <TextField select fullWidth label="Plantation Type" value={plantationTypeId} onChange={(e) => setPlantationTypeId(e.target.value)} size="small">
              <MenuItem value="">All Types</MenuItem>
              {plantationTypes.map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>{pt.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Botanical / Species" value={botanicalId} onChange={(e) => setBotanicalId(e.target.value)} size="small" disabled={!plantationTypeId}>
              <MenuItem value="">All Species</MenuItem>
              {botanicals.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Request Type" value={type} onChange={(e) => setType(e.target.value)} size="small">
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="CREATION">Creation</MenuItem>
              <MenuItem value="MORTALITY">Mortality</MenuItem>
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
              <MenuItem value="CALLBACK">Callback</MenuItem>
              <MenuItem value="RETURNED">Returned</MenuItem>
            </TextField>
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
                No requests found matching your filter criteria.
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
                      <TableCell sx={{ fontWeight: 700 }}>Plantation Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Count</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Area (Ha.)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mon-Yr</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {r.requestNo}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={r.type}
                            size="small"
                            variant="outlined"
                            color={r.type === 'MORTALITY' ? 'error' : 'primary'}
                            sx={{ fontSize: '0.68rem', fontWeight: 600, height: 20 }}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {r.location?.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {r.siteLocation?.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{r.plantationType?.description || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {r.treeCount || r.palmCount || r.mangroveCount || r.shrubCount || r.mortalityCount || 0}
                        </TableCell>
                        <TableCell>
                          {Number(r.calculatedAreaHa || 0)} {r.overlapWithCover ? '(overlap)' : ''}
                        </TableCell>
                        <TableCell>{r.plantationMonthYear || '-'}</TableCell>
                        <TableCell>{formatDate(r.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => navigate(`/green-zone/requests/${r.id}`)}>
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
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
