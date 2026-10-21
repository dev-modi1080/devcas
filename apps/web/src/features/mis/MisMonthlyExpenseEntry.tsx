import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Button,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Upload, X, Save, Send, FileText, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { BudgetType, getFiscalYear, getFiscalYearMonths } from '@cas/shared';

export const MisMonthlyExpenseEntry: React.FC = () => {
  const navigate = useNavigate();

  const [type, setType] = useState<BudgetType>(BudgetType.CAPEX);
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');

  // Default to current month (YYYY-MM)
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });

  const [consumedCost, setConsumedCost] = useState<number | ''>('');
  const [maleWorkforceCount, setMaleWorkforceCount] = useState<number | ''>('');
  const [femaleWorkforceCount, setFemaleWorkforceCount] = useState<number | ''>('');
  const [areaHa, setAreaHa] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }[]>([]);

  // Master options
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentFY = getFiscalYear();
  const now = new Date();
  const isMonthlyWindow = now.getDate() >= 1 && now.getDate() <= 10;

  // Generate allowed months: previous months of current fiscal year up to current month (no future months)
  const fyMonths = getFiscalYearMonths(currentFY);
  const allowedMonthOptions = fyMonths
    .map((m) => {
      const val = `${m.calendarYear}-${String(m.calendarMonth + 1).padStart(2, '0')}`;
      const d = new Date(`${val}-01`);
      return {
        value: val,
        label: m.label,
        isFuture: d > now,
      };
    })
    .filter((m) => !m.isFuture);

  useEffect(() => {
    api
      .get('/masters/cascading')
      .then((res) => {
        setBusinesses(res.data.businesses || []);
        setLocations(res.data.locations || []);
        setSiteLocations(res.data.siteLocations || []);
        setExpenseCategories(res.data.expenseCategories || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (businessId) {
      api.get(`/masters/companies?businessId=${businessId}`).then((res) => setCompanies(res.data));
    } else {
      setCompanies([]);
      setCompanyId('');
    }
  }, [businessId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
          throw new Error(`File ${file.name} is invalid. Only PDF attachments are permitted.`);
        }
        if (file.size > 5 * 1024 * 1024) throw new Error(`File ${file.name} exceeds 5 MB limit`);

        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAttachments((prev) => [...prev, res.data]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (isSubmit: boolean) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (!businessId || !companyId || !locationId || !siteLocationId || !expenseCategoryId) {
        throw new Error('Please fill in all required master fields');
      }
      if (!consumedCost || Number(consumedCost) <= 0) {
        throw new Error('Please enter a valid consumed cost amount');
      }

      const payload = {
        type,
        businessId,
        companyId,
        locationId,
        siteLocationId,
        expenseCategoryId,
        month,
        consumedCost: Number(consumedCost),
        maleWorkforceCount: maleWorkforceCount !== '' ? Number(maleWorkforceCount) : 0,
        femaleWorkforceCount: femaleWorkforceCount !== '' ? Number(femaleWorkforceCount) : 0,
        areaHa: areaHa !== '' ? Number(areaHa) : 0,
        remarks,
        attachments,
        isSubmit,
      };

      const res = await api.post('/mis/monthly-expense', payload);
      setSuccess(
        isSubmit
          ? `Monthly expense ${res.data.requestNo} submitted successfully!`
          : `Draft ${res.data.requestNo} saved successfully.`,
      );

      setTimeout(() => {
        navigate('/mis/my-entries');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Monthly Expense Entry
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Log consumed operational or capital expenditure, workforce counts, and maintained area.
        </Typography>
      </Box>

      {!isMonthlyWindow && (
        <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Notice:</strong> The standard monthly entry window is 1st to 10th of each month. This submission will be marked as a <strong>Late Entry</strong>.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2.5}>
          {/* 1. Type: Capex / Opex */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as BudgetType)}
            >
              <MenuItem value={BudgetType.CAPEX}>Capex (Capital Expenditure)</MenuItem>
              <MenuItem value={BudgetType.OPEX}>Opex (Operational Expenditure)</MenuItem>
            </TextField>
          </Grid>

          {/* 7. Month (Previous months of current FY only; no future months) */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Expense Entry Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              helperText="Previous months of current fiscal year only"
            >
              {allowedMonthOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 2. Business */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Business"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            >
              {businesses.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.code} - {b.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 3. Company */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={!businessId}
            >
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code} - {c.shortName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 4. Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              {locations.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.code} - {l.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 5. Site Location */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Site Location"
              value={siteLocationId}
              onChange={(e) => setSiteLocationId(e.target.value)}
              disabled={!locationId}
            >
              {siteLocations
                .filter((s) => !locationId || s.locationId === locationId)
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.code} - {s.description}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          {/* 6. Expense Category */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Expense Category"
              value={expenseCategoryId}
              onChange={(e) => setExpenseCategoryId(e.target.value)}
            >
              {expenseCategories.map((ec) => (
                <MenuItem key={ec.id} value={ec.id}>
                  {ec.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 8. Consumed Cost Amount */}
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              fullWidth
              required
              label="Consumed Cost Amount (INR)"
              value={consumedCost}
              onChange={(e) => setConsumedCost(e.target.value ? parseFloat(e.target.value) : '')}
            />
          </Grid>

          {/* 10. Male Workforce Count */}
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Male Workforce Count"
              value={maleWorkforceCount}
              onChange={(e) => setMaleWorkforceCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              helperText="Up to 5 digits integer"
            />
          </Grid>

          {/* 11. Female Workforce Count */}
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Female Workforce Count"
              value={femaleWorkforceCount}
              onChange={(e) => setFemaleWorkforceCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              helperText="Up to 5 digits integer"
            />
          </Grid>

          {/* 12. Area in hectares */}
          <Grid item xs={12} sm={4}>
            <TextField
              type="number"
              fullWidth
              label="Area in Hectares"
              value={areaHa}
              onChange={(e) => setAreaHa(e.target.value ? parseFloat(e.target.value) : '')}
              helperText="Up to 2 decimals"
            />
          </Grid>

          {/* 9. Attachments: PDF ONLY */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Invoices & Proofs (PDF Only, up to 5 MB each)
            </Typography>
            <Box
              sx={{
                border: '2px dashed #CBD5E1',
                borderRadius: 2,
                p: 2.5,
                textAlign: 'center',
                bgcolor: 'background.default',
                cursor: 'pointer',
              }}
              component="label"
            >
              <input
                type="file"
                multiple
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Upload size={28} color="#2670DC" style={{ margin: '0 auto 6px' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {uploading ? 'Uploading PDF...' : 'Click or drop PDF expense bills here'}
              </Typography>
            </Box>

            {attachments.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {attachments.map((att, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2 }}>
                    <FileText size={16} color="#DC2626" />
                    <Typography variant="caption">{att.fileName}</Typography>
                    <IconButton size="small" onClick={() => removeAttachment(idx)}><X size={14} /></IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>

          {/* 13. Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              helperText="Specific cost breakdown or work progress remarks"
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" onClick={() => handleSubmit(false)} disabled={submitting} startIcon={<Save size={18} />}>
            Save as Draft
          </Button>
          <Button variant="contained" color="primary" onClick={() => handleSubmit(true)} disabled={submitting} startIcon={<Send size={18} />}>
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
