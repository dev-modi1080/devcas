import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import { Add, FileDownload, Search, Refresh } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@cas/shared';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const MasterManagement: React.FC = () => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [greenZones, setGreenZones] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'business' | 'company' | 'location' | 'siteLocation' | 'greenZone' | 'expenseCategory'>('business');
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentTabData();
  }, [tabIndex]);

  const loadCurrentTabData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (tabIndex === 0) {
        const res = await api.get('/masters/businesses?includeInactive=true');
        setBusinesses(res.data);
      } else if (tabIndex === 1) {
        const [compRes, busRes] = await Promise.all([
          api.get('/masters/companies?includeInactive=true'),
          api.get('/masters/businesses'),
        ]);
        setCompanies(compRes.data);
        setBusinesses(busRes.data);
      } else if (tabIndex === 2) {
        const res = await api.get('/masters/locations?includeInactive=true');
        setLocations(res.data);
      } else if (tabIndex === 3) {
        const [siteRes, locRes] = await Promise.all([
          api.get('/masters/site-locations?includeInactive=true'),
          api.get('/masters/locations'),
        ]);
        setSiteLocations(siteRes.data);
        setLocations(locRes.data);
      } else if (tabIndex === 4) {
        const [gzRes, busRes, locRes] = await Promise.all([
          api.get('/masters/green-zones'),
          api.get('/masters/businesses'),
          api.get('/masters/locations'),
        ]);
        setGreenZones(gzRes.data);
        setBusinesses(busRes.data);
        setLocations(locRes.data);
      } else if (tabIndex === 5) {
        const res = await api.get('/masters/expense-categories');
        setExpenseCategories(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = (type: any) => {
    setDialogType(type);
    setFormData({});
    setOpenDialog(true);
  };

  const handleSaveMaster = async () => {
    try {
      setSubmitting(true);
      setError(null);

      if (dialogType === 'business') {
        await api.post('/masters/businesses', {
          code: formData.code,
          description: formData.description,
        });
      } else if (dialogType === 'company') {
        await api.post('/masters/companies', {
          businessId: formData.businessId,
          code: formData.code,
          shortName: formData.shortName,
          description: formData.description,
        });
      } else if (dialogType === 'location') {
        await api.post('/masters/locations', {
          code: formData.code,
          description: formData.description,
        });
      } else if (dialogType === 'siteLocation') {
        await api.post('/masters/site-locations', {
          locationId: formData.locationId,
          code: formData.code,
          description: formData.description,
        });
      } else if (dialogType === 'greenZone') {
        await api.post('/masters/green-zones', {
          businessId: formData.businessId,
          companyId: formData.companyId,
          locationId: formData.locationId,
          siteLocationId: formData.siteLocationId,
          uniqueNumber: formData.uniqueNumber,
        });
      }

      setSuccess('Master record added successfully.');
      setOpenDialog(false);
      loadCurrentTabData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save master record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (type: string) => {
    window.open(`${api.defaults.baseURL}/masters/export/${type}`, '_blank');
  };

  const isCASAdmin = user?.role === UserRole.CAS_ADMIN;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Master Data Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Centralized organizational & module hierarchy masters for Corporate Agri Sustainability
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={loadCurrentTabData}>
            Refresh
          </Button>
          {isCASAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                const types = ['business', 'company', 'location', 'siteLocation', 'greenZone', 'expenseCategory'];
                handleOpenAdd(types[tabIndex]);
              }}
            >
              Add Record
            </Button>
          )}
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

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setSearchTerm('');
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Businesses" />
          <Tab label="Companies" />
          <Tab label="Locations" />
          <Tab label="Site Locations" />
          <Tab label="Green Zones" />
          <Tab label="Expense Categories" />
        </Tabs>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownload />}
            onClick={() => {
              const exportTypes = ['business', 'company', 'location', 'site-location', 'green-zone', 'expense-category'];
              handleExport(exportTypes[tabIndex]);
            }}
          >
            Export Excel
          </Button>
        </Box>

        {/* Tab 0: Business Master */}
        <TabPanel value={tabIndex} index={0}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Business Short Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : businesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      No business records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  businesses
                    .filter(
                      (b) =>
                        !searchTerm ||
                        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.description.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.isDeleted ? 'Inactive' : 'Active'}
                            color={row.isDeleted ? 'default' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 1: Company Master */}
        <TabPanel value={tabIndex} index={1}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Company Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Short Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  companies
                    .filter(
                      (c) =>
                        !searchTerm ||
                        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.shortName?.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.business?.code || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                        <TableCell>{row.shortName}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.isDeleted ? 'Inactive' : 'Active'}
                            color={row.isDeleted ? 'default' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Location Master */}
        <TabPanel value={tabIndex} index={2}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Location Short Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  locations
                    .filter(
                      (l) =>
                        !searchTerm ||
                        l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        l.description.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.isDeleted ? 'Inactive' : 'Active'}
                            color={row.isDeleted ? 'default' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 3: Site Location Master */}
        <TabPanel value={tabIndex} index={3}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Parent Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Site Location Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  siteLocations
                    .filter(
                      (s) =>
                        !searchTerm ||
                        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.description.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{row.location?.code} - {row.location?.description}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.isDeleted ? 'Inactive' : 'Active'}
                            color={row.isDeleted ? 'default' : 'success'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 4: Green Zone Master */}
        <TabPanel value={tabIndex} index={4}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Green Zone Unique No</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Business</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Site Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  greenZones
                    .filter(
                      (g) =>
                        !searchTerm ||
                        g.uniqueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        g.location?.code.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{row.uniqueNumber}</TableCell>
                        <TableCell>{row.business?.code}</TableCell>
                        <TableCell>{row.company?.shortName || row.company?.code}</TableCell>
                        <TableCell>{row.location?.code}</TableCell>
                        <TableCell>{row.siteLocation?.code}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 5: Expense Categories */}
        <TabPanel value={tabIndex} index={5}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Expense Category Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseCategories
                    .filter(
                      (e) =>
                        !searchTerm ||
                        e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        e.description.toLowerCase().includes(searchTerm.toLowerCase()),
                    )
                    .map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell>
                          <Chip size="small" label="Active" color="success" />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New {dialogType.toUpperCase()} Record</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            {dialogType === 'business' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Short Code"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}

            {dialogType === 'company' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Business"
                    value={formData.businessId || ''}
                    onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                    required
                  >
                    {businesses.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.code} - {b.description}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Company Code"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Short Name"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}

            {dialogType === 'location' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location Short Code"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}

            {dialogType === 'siteLocation' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Parent Location"
                    value={formData.locationId || ''}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    required
                  >
                    {locations.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.code} - {l.description}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Site Location Code"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}

            {dialogType === 'greenZone' && (
              <>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Business"
                    value={formData.businessId || ''}
                    onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                    required
                  >
                    {businesses.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Company"
                    value={formData.companyId || ''}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    required
                  >
                    {companies.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.shortName || c.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Location"
                    value={formData.locationId || ''}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    required
                  >
                    {locations.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    select
                    fullWidth
                    label="Site Location"
                    value={formData.siteLocationId || ''}
                    onChange={(e) => setFormData({ ...formData, siteLocationId: e.target.value })}
                    required
                  >
                    {siteLocations.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.code}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Green Zone Unique Number"
                    value={formData.uniqueNumber || ''}
                    onChange={(e) => setFormData({ ...formData, uniqueNumber: e.target.value })}
                    placeholder="e.g. GZ-MUND-NORTH-01"
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveMaster}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
          >
            Save Record
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
