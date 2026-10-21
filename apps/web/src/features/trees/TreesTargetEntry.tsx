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
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { Target, History, Edit2, Plus, Save } from 'lucide-react';
import api from '../../api/client';
import { getFiscalYear, formatDate, formatDateTime } from '@cas/shared';

export const TreesTargetEntry: React.FC = () => {
  const currentFY = getFiscalYear();

  // Target Form
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');
  const [plantationType, setPlantationType] = useState('Tree');
  const [targetCount, setTargetCount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');

  // Masters
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);

  // Existing Targets
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Dialog
  const [editingTarget, setEditingTarget] = useState<any>(null);
  const [newCount, setNewCount] = useState<number | ''>('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editError, setEditError] = useState('');

  // History Dialog
  const [historyTarget, setHistoryTarget] = useState<any>(null);

  const fetchTargets = () => {
    api.get('/trees/targets').then((res) => setTargets(res.data || []));
  };

  useEffect(() => {
    api.get('/masters/cascading').then((res) => {
      setBusinesses(res.data.businesses || []);
      setLocations(res.data.locations || []);
      setSiteLocations(res.data.siteLocations || []);
    });
    fetchTargets();
  }, []);

  useEffect(() => {
    if (businessId) {
      api.get(`/masters/companies?businessId=${businessId}`).then((res) => setCompanies(res.data));
    } else {
      setCompanies([]);
      setCompanyId('');
    }
  }, [businessId]);

  const handleCreate = async () => {
    try {
      setError('');
      setSuccess('');
      if (!businessId || !companyId || !locationId || !siteLocationId || !targetCount) {
        throw new Error('Please fill in all required fields');
      }

      await api.post('/trees/targets', {
        businessId,
        companyId,
        locationId,
        siteLocationId,
        fiscalYear: currentFY,
        plantationType,
        targetCount: Number(targetCount),
        remarks,
      });

      setSuccess('Target saved successfully!');
      setTargetCount('');
      setRemarks('');
      fetchTargets();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save target');
    }
  };

  const handleSaveEdit = async () => {
    try {
      setEditError('');
      if (!newCount || Number(newCount) <= 0) throw new Error('Please enter a valid target count');
      if (!editRemarks.trim()) throw new Error('Remarks are mandatory when editing an existing target');

      await api.post('/trees/targets', {
        businessId: editingTarget.businessId,
        companyId: editingTarget.companyId,
        locationId: editingTarget.locationId,
        siteLocationId: editingTarget.siteLocationId,
        fiscalYear: editingTarget.fiscalYear,
        plantationType: editingTarget.plantationType,
        targetCount: Number(newCount),
        remarks: editRemarks.trim(),
      });

      setEditingTarget(null);
      fetchTargets();
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || 'Edit failed');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          100 Million Trees Target Entry
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set annual plantation targets per site location and track target change audit trails.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      {/* Target Entry Form */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          New Target for Current Fiscal Year ({currentFY})
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Business" value={businessId} onChange={(e) => setBusinessId(e.target.value)} size="small">
              {businesses.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.code}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)} size="small" disabled={!businessId}>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.shortName}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)} size="small">
              {locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>{l.description}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Site Location" value={siteLocationId} onChange={(e) => setSiteLocationId(e.target.value)} size="small" disabled={!locationId}>
              {siteLocations.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.description}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <TextField select fullWidth label="Plantation Type" value={plantationType} onChange={(e) => setPlantationType(e.target.value)} size="small">
              <MenuItem value="Tree">Tree</MenuItem>
              <MenuItem value="Palm">Palm</MenuItem>
              <MenuItem value="Mangrove">Mangrove</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              type="number"
              fullWidth
              label="Target Count (Nos.)"
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
            <TextField fullWidth label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} size="small" />
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Button variant="contained" fullWidth onClick={handleCreate} startIcon={<Save size={16} />} sx={{ height: 40 }}>
              Set Target
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Target List Table */}
      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Configured Yearly Targets
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Fiscal Year</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location / Business</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Site Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Plantation Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target Count (Nos.)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{t.fiscalYear}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.location?.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{t.business?.code}</Typography>
                  </TableCell>
                  <TableCell>{t.siteLocation?.description}</TableCell>
                  <TableCell>{t.plantationType}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {t.targetCount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>{t.remarks || '-'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {/* Edit target count allowed for current FY only */}
                      {t.fiscalYear === currentFY && (
                        <Tooltip title="Edit Target Count">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setEditingTarget(t);
                              setNewCount(t.targetCount);
                              setEditRemarks('');
                              setEditError('');
                            }}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Edit History">
                        <IconButton size="small" onClick={() => setHistoryTarget(t)}>
                          <History size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Target Count Dialog */}
      {editingTarget && (
        <Dialog open={Boolean(editingTarget)} onClose={() => setEditingTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Edit Target Count ({editingTarget.siteLocation?.description} - {editingTarget.plantationType})
          </DialogTitle>
          <DialogContent>
            {editError && <Alert severity="error" sx={{ mb: 2 }}>{editError}</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Current target: <strong>{editingTarget.targetCount.toLocaleString('en-IN')}</strong>. Remarks explaining this target revision are mandatory.
            </Typography>
            <TextField
              type="number"
              fullWidth
              required
              label="New Target Count (Nos.)"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              label="Mandatory Remarks / Justification"
              value={editRemarks}
              onChange={(e) => setEditRemarks(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setEditingTarget(null)} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Save Revision</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* View Edit History Dialog */}
      {historyTarget && (
        <Dialog open={Boolean(historyTarget)} onClose={() => setHistoryTarget(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Target Revision Audit Trail: {historyTarget.siteLocation?.description} ({historyTarget.plantationType})
          </DialogTitle>
          <Divider />
          <DialogContent>
            {historyTarget.histories?.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No revisions recorded. Initial target value has not been altered.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Old Target</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>New Target</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Mandatory Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyTarget.histories.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell>{formatDateTime(h.createdAt)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{h.oldTargetCount.toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{h.newTargetCount.toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontStyle: 'italic' }}>"{h.remarks}"</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setHistoryTarget(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};
