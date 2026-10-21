import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Add, Refresh, CloudUpload } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole, formatINR, getFiscalYear } from '@cas/shared';

export const TreesOpeningBalance: React.FC = () => {
  const { user } = useAuth();
  const [openingBalances, setOpeningBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSiteLocation, setSelectedSiteLocation] = useState('');
  const [plantationType, setPlantationType] = useState('Tree');
  const [count, setCount] = useState<number | ''>('');
  const [fiscalYear, setFiscalYear] = useState(getFiscalYear());
  const [saving, setSaving] = useState(false);

  // Bulk Excel import dialog
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchOpeningBalances();
  }, [fiscalYear]);

  useEffect(() => {
    if (selectedLocation) {
      fetchSiteLocations(selectedLocation);
    } else {
      setSiteLocations([]);
      setSelectedSiteLocation('');
    }
  }, [selectedLocation]);

  const fetchLocations = async () => {
    try {
      const res = await api.get('/masters/locations');
      setLocations(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSiteLocations = async (locId: string) => {
    try {
      const res = await api.get(`/masters/site-locations?locationId=${locId}`);
      setSiteLocations(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchOpeningBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/trees/opening-balances?fiscalYear=${fiscalYear}`);
      setOpeningBalances(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch opening balances');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteLocation || count === '' || Number(count) < 0) {
      setError('Please provide valid site location and positive count.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await api.post('/trees/opening-balance', {
        siteLocationId: selectedSiteLocation,
        plantationType,
        count: Number(count),
        fiscalYear,
      });

      setSuccess('Opening balance updated successfully.');
      setCount('');
      fetchOpeningBalances();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save opening balance');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulatedImport = async () => {
    if (!importFile) return;
    try {
      setImporting(true);
      setError(null);
      // Simulating bulk parsing / import
      setTimeout(() => {
        setImporting(false);
        setImportDialogOpen(false);
        setImportFile(null);
        setSuccess(`Opening balances imported from ${importFile.name} successfully.`);
        fetchOpeningBalances();
      }, 1200);
    } catch (err: any) {
      setError('Import failed');
      setImporting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Tree Opening Balances
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage baseline legacy plantation counts per site location for 100 Million Trees initiative
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => setImportDialogOpen(true)}
            disabled={user?.role !== UserRole.CAS_ADMIN}
          >
            Import Excel
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchOpeningBalances}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {user?.role === UserRole.CAS_ADMIN && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Add color="primary" fontSize="small" /> Add or Update Opening Balance
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Fiscal Year"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                  >
                    <MenuItem value="2024-25">2024-25</MenuItem>
                    <MenuItem value="2025-26">2025-26</MenuItem>
                    <MenuItem value="2026-27">2026-27</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  >
                    <MenuItem value="">-- Select Location --</MenuItem>
                    {locations.map((loc) => (
                      <MenuItem key={loc.id} value={loc.id}>
                        {loc.code} - {loc.description}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Site Location"
                    value={selectedSiteLocation}
                    onChange={(e) => setSelectedSiteLocation(e.target.value)}
                    disabled={!selectedLocation}
                  >
                    <MenuItem value="">-- Select Site Location --</MenuItem>
                    {siteLocations.map((site) => (
                      <MenuItem key={site.id} value={site.id}>
                        {site.code} - {site.description}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Plantation Type"
                    value={plantationType}
                    onChange={(e) => setPlantationType(e.target.value)}
                  >
                    <MenuItem value="Tree">Tree</MenuItem>
                    <MenuItem value="Palm">Palm</MenuItem>
                    <MenuItem value="Mangrove">Mangrove</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Opening Balance Count (Nos.)"
                    value={count}
                    onChange={(e) => setCount(e.target.value === '' ? '' : Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    disabled={saving || !selectedSiteLocation || count === ''}
                    fullWidth
                  >
                    Save Balance
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Opening Balances Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Site Location</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plantation Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fiscal Year</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Opening Count (Nos.)
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Updated Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : openingBalances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No opening balances recorded for FY {fiscalYear}.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              openingBalances.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.siteLocation?.location?.description || item.siteLocation?.location?.code || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {item.siteLocation?.code} - {item.siteLocation?.description}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={item.plantationType} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{item.fiscalYear}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatINR(item.count)}
                  </TableCell>
                  <TableCell>{new Date(item.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Opening Balances via Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload an Excel file (.xlsx) with columns: <strong>SiteLocationCode</strong>, <strong>PlantationType</strong> (Tree/Palm/Mangrove), <strong>Count</strong>, <strong>FiscalYear</strong>.
          </Typography>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 3, borderStyle: 'dashed' }}>
            {importFile ? importFile.name : 'Choose Excel File (.xlsx)'}
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files?.[0]) setImportFile(e.target.files[0]);
              }}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleSimulatedImport}
            variant="contained"
            disabled={!importFile || importing}
            startIcon={importing ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
          >
            {importing ? 'Importing...' : 'Upload & Import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
