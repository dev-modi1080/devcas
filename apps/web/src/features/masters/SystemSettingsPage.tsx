import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Save, Refresh, Tune } from '@mui/icons-material';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@cas/shared';

export const SystemSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    APPROVAL_REMINDER_DAYS: '3',
    MIS_ENTRY_WINDOW_DAYS: '10',
    MAX_FILE_SIZE_MB: '5',
    BLOCK_LATE_MIS_ENTRY: 'false',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/settings');
      setSettings(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== UserRole.CAS_ADMIN) {
      setError('Only CAS Admin can modify system settings');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Save each setting
      await Promise.all([
        api.post('/settings', {
          key: 'APPROVAL_REMINDER_DAYS',
          value: settings.APPROVAL_REMINDER_DAYS,
          description: 'Days before approval reminder is sent',
        }),
        api.post('/settings', {
          key: 'MIS_ENTRY_WINDOW_DAYS',
          value: settings.MIS_ENTRY_WINDOW_DAYS,
          description: 'End day of monthly entry window (1 to N)',
        }),
        api.post('/settings', {
          key: 'MAX_FILE_SIZE_MB',
          value: settings.MAX_FILE_SIZE_MB,
          description: 'Maximum file upload size in MB',
        }),
        api.post('/settings', {
          key: 'BLOCK_LATE_MIS_ENTRY',
          value: settings.BLOCK_LATE_MIS_ENTRY,
          description: 'Block late MIS submissions outside window',
        }),
      ]);

      setSuccess('System configuration parameters saved successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const isCASAdmin = user?.role === UserRole.CAS_ADMIN;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            System Settings & Parameters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Global operational policies, approval cadence thresholds, file upload limits, and MIS submission windows
          </Typography>
        </div>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchSettings} disabled={loading}>
          Refresh
        </Button>
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

      <Card>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <form onSubmit={handleSave}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Tune color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Workflow & MIS Policies
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Approval Reminder Interval (Days)"
                    helperText="Days of inactivity before auto-reminders are emailed to pending approvers"
                    value={settings.APPROVAL_REMINDER_DAYS}
                    onChange={(e) => setSettings({ ...settings, APPROVAL_REMINDER_DAYS: e.target.value })}
                    disabled={!isCASAdmin}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="MIS Entry Window Closing Day"
                    helperText="Monthly budget/expense submission window closes on day N (e.g., 10th of each month)"
                    value={settings.MIS_ENTRY_WINDOW_DAYS}
                    onChange={(e) => setSettings({ ...settings, MIS_ENTRY_WINDOW_DAYS: e.target.value })}
                    disabled={!isCASAdmin}
                    inputProps={{ min: 1, max: 28 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum File Attachment Size (MB)"
                    helperText="Hard threshold for photograph proofs and PDF budget attachments"
                    value={settings.MAX_FILE_SIZE_MB}
                    onChange={(e) => setSettings({ ...settings, MAX_FILE_SIZE_MB: e.target.value })}
                    disabled={!isCASAdmin}
                    inputProps={{ min: 1, max: 25 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ pt: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.BLOCK_LATE_MIS_ENTRY === 'true'}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              BLOCK_LATE_MIS_ENTRY: e.target.checked ? 'true' : 'false',
                            })
                          }
                          disabled={!isCASAdmin}
                        />
                      }
                      label="Strictly Block Late MIS Submissions"
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      When turned ON, users cannot submit monthly expenses or yearly budgets after the 10th. When OFF, late
                      submissions are accepted with a late warning banner.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {isCASAdmin && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    disabled={saving}
                  >
                    Save Configuration
                  </Button>
                </Box>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
