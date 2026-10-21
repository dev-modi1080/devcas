import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Chip,
  InputAdornment,
  Switch,
  FormControlLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add, Search, Refresh, PersonOutline } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@cas/shared';

export const UserMaster: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Dropdowns for mapping
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeCode: '',
    role: UserRole.SITE_USER,
    businessIds: [] as string[],
    locationIds: [] as string[],
    siteLocationIds: [] as string[],
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchOptions();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [busRes, locRes, siteRes] = await Promise.all([
        api.get('/masters/businesses'),
        api.get('/masters/locations'),
        api.get('/masters/site-locations'),
      ]);
      setBusinesses(busRes.data);
      setLocations(locRes.data);
      setSiteLocations(siteRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      employeeCode: '',
      role: UserRole.SITE_USER,
      businessIds: [],
      locationIds: [],
      siteLocationIds: [],
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (userItem: any) => {
    setEditingUser(userItem);
    setFormData({
      name: userItem.name,
      email: userItem.email,
      employeeCode: userItem.employeeCode,
      role: userItem.role,
      businessIds: userItem.userBusinesses?.map((b: any) => b.businessId) || [],
      locationIds: userItem.userLocations?.map((l: any) => l.locationId) || [],
      siteLocationIds: userItem.userSiteLocations?.map((s: any) => s.siteLocationId) || [],
      isActive: userItem.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        setSuccess('User updated successfully.');
      } else {
        await api.post('/users', formData);
        setSuccess('User created successfully.');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userItem: any) => {
    try {
      await api.patch(`/users/${userItem.id}/toggle-status`, {
        isActive: !userItem.isActive,
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            User Management & Access Rights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure SSO users, roles (Site User, Supervisor, BU Admin, CAS Admin), and mapped organizational hierarchy
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUsers}>
            Refresh
          </Button>
          {currentUser?.role === UserRole.CAS_ADMIN && (
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
              Add User
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
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, email, employee code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 320 }}
          />

          <TextField
            select
            size="small"
            label="Filter Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value={UserRole.SITE_USER}>Site User</MenuItem>
            <MenuItem value={UserRole.SITE_SUPERVISOR}>Site Supervisor</MenuItem>
            <MenuItem value={UserRole.BU_ADMIN}>BU Administrator</MenuItem>
            <MenuItem value={UserRole.CAS_ADMIN}>CAS Admin</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Employee Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email (SSO ID)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mapped Entities</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    No users matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{u.employeeCode}</TableCell>
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOutline fontSize="small" color="action" />
                      {u.name}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.role.replace('_', ' ')}
                        color={
                          u.role === UserRole.CAS_ADMIN
                            ? 'primary'
                            : u.role === UserRole.BU_ADMIN
                            ? 'secondary'
                            : u.role === UserRole.SITE_SUPERVISOR
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        Businesses: {u.userBusinesses?.length || 0} | Locations: {u.userLocations?.length || 0} | Sites:{' '}
                        {u.userSiteLocations?.length || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.isActive ? 'Active' : 'Inactive'}
                        color={u.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="text" onClick={() => handleOpenEdit(u)}>
                        Edit
                      </Button>
                      {currentUser?.role === UserRole.CAS_ADMIN && (
                        <Button
                          size="small"
                          color={u.isActive ? 'error' : 'success'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}</DialogTitle>
        <form onSubmit={handleSave}>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Employee Code"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email (SSO Login ID)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="System Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  required
                >
                  <MenuItem value={UserRole.SITE_USER}>Site User / Site Horticulturist</MenuItem>
                  <MenuItem value={UserRole.SITE_SUPERVISOR}>Site Supervisor (L1 Approver)</MenuItem>
                  <MenuItem value={UserRole.BU_ADMIN}>BU Administrator / BU Head (L2 Approver)</MenuItem>
                  <MenuItem value={UserRole.CAS_ADMIN}>CAS Admin (L3 Approver & System Admin)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active Account"
                  sx={{ mt: 1 }}
                />
              </Grid>

              {/* Hierarchy mappings */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1, mb: 1 }}>
                  Access Rights Mapping (User will only see and act on data for mapped units)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="bus-select-label">Mapped Businesses</InputLabel>
                  <Select
                    labelId="bus-select-label"
                    multiple
                    value={formData.businessIds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        businessIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Mapped Businesses" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const b = businesses.find((x) => x.id === val);
                          return <Chip key={val} size="small" label={b?.code || val} />;
                        })}
                      </Box>
                    )}
                  >
                    {businesses.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        <Checkbox checked={formData.businessIds.indexOf(b.id) > -1} />
                        <ListItemText primary={`${b.code} - ${b.description}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="loc-select-label">Mapped Locations</InputLabel>
                  <Select
                    labelId="loc-select-label"
                    multiple
                    value={formData.locationIds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        locationIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Mapped Locations" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const l = locations.find((x) => x.id === val);
                          return <Chip key={val} size="small" label={l?.code || val} />;
                        })}
                      </Box>
                    )}
                  >
                    {locations.map((l) => (
                      <MenuItem key={l.id} value={l.id}>
                        <Checkbox checked={formData.locationIds.indexOf(l.id) > -1} />
                        <ListItemText primary={`${l.code} - ${l.description}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel id="site-select-label">Mapped Site Locations</InputLabel>
                  <Select
                    labelId="site-select-label"
                    multiple
                    value={formData.siteLocationIds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        siteLocationIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Mapped Site Locations" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((val) => {
                          const s = siteLocations.find((x) => x.id === val);
                          return <Chip key={val} size="small" label={s?.code || val} />;
                        })}
                      </Box>
                    )}
                  >
                    {siteLocations.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        <Checkbox checked={formData.siteLocationIds.indexOf(s.id) > -1} />
                        <ListItemText primary={`${s.code} - ${s.description}`} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} /> : undefined}
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
