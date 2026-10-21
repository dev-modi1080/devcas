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
  Card,
  CardContent,
} from '@mui/material';
import { Upload, X, Send, Skull, Image as ImageIcon, FileText, AlertTriangle } from 'lucide-react';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { RequestType } from '@cas/shared';

export const GreenZoneMortalityRequest: React.FC = () => {
  const navigate = useNavigate();
  const [completeRequests, setCompleteRequests] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentDetails, setParentDetails] = useState<any>(null);

  const [mortalityCount, setMortalityCount] = useState<number | ''>('');
  const [remarks, setRemarks] = useState('');
  const [photos, setPhotos] = useState<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch completed creation requests for the user
    api
      .get('/green-zone/requests/my')
      .then((res) => {
        const completed = (res.data || []).filter(
          (r: any) => r.status === 'COMPLETE' && r.type === 'CREATION',
        );
        setCompleteRequests(completed);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedParentId) {
      api
        .get(`/green-zone/requests/${selectedParentId}`)
        .then((res) => {
          setParentDetails(res.data);
          setMortalityCount('');
        })
        .catch((err) => console.error(err));
    } else {
      setParentDetails(null);
    }
  }, [selectedParentId]);

  const remainingLive = parentDetails?.remainingLiveCount ?? 0;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) throw new Error(`File ${file.name} exceeds 5 MB limit`);

        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPhotos((prev) => [...prev, res.data]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (!selectedParentId) throw new Error('Please select an approved creation request');
      if (!mortalityCount || Number(mortalityCount) < 1) throw new Error('Mortality count must be at least 1');
      if (Number(mortalityCount) > remainingLive) {
        throw new Error(`Mortality count (${mortalityCount}) exceeds remaining live count (${remainingLive})`);
      }
      if (!remarks.trim()) throw new Error('Remarks explaining the mortality are required');

      const payload = {
        type: RequestType.MORTALITY,
        parentRequestId: selectedParentId,
        businessId: parentDetails.businessId,
        companyId: parentDetails.companyId,
        locationId: parentDetails.locationId,
        siteLocationId: parentDetails.siteLocationId,
        greenZoneId: parentDetails.greenZoneId,
        plantationTypeId: parentDetails.plantationTypeId,
        botanicalId: parentDetails.botanicalId,
        mortalityCount: Number(mortalityCount),
        remarks,
        photos,
        isSubmit: true,
      };

      const res = await api.post('/green-zone/requests', payload);
      setSuccess(`Mortality request ${res.data.requestNo} submitted for approval!`);

      setTimeout(() => {
        navigate('/green-zone/my-requests');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit mortality request');
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
    <Box sx={{ maxWidth: 840, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Raise Mortality Request
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Record tree mortality against an approved plantation request to adjust live inventory and targets.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          {/* Select Approved Request */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              required
              label="Select Approved Creation Request"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              helperText="Only requests in 'Complete' status are eligible"
            >
              {completeRequests.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.requestNo} - {r.business.code} / {r.location.description} ({r.plantationType?.description || 'Plantation'})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Details of Parent Request */}
          {parentDetails && (
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2670DC', mb: 1 }}>
                    Original Plantation Snapshot
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Location</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{parentDetails.location?.description}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Green Zone No</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{parentDetails.greenZone?.greenZoneNo}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Original Count</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{parentDetails.originalPlantCount}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Remaining Live Count</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#10B981' }}>{remainingLive}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Mortality Count */}
          <Grid item xs={12} sm={6}>
            <TextField
              type="number"
              fullWidth
              required
              label="Tree Nos. (Mortality Count)"
              value={mortalityCount}
              onChange={(e) => setMortalityCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              disabled={!parentDetails}
              helperText={parentDetails ? `Max allowed: ${remainingLive}` : 'Select a request first'}
              error={Number(mortalityCount) > remainingLive}
            />
          </Grid>

          {/* Remarks */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              required
              label="Remarks (Reason for mortality, inspection details)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
              helperText={`${remarks.length}/500 characters`}
              disabled={!parentDetails}
            />
          </Grid>

          {/* Photos */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Inspection Proof Photos
            </Typography>
            <Box
              sx={{
                border: '2px dashed #CBD5E1',
                borderRadius: 2,
                p: 2.5,
                textAlign: 'center',
                bgcolor: 'background.default',
                cursor: parentDetails ? 'pointer' : 'default',
              }}
              component="label"
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={!parentDetails || uploading}
              />
              <Upload size={28} color="#2670DC" style={{ margin: '0 auto 6px' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {uploading ? 'Uploading...' : 'Upload mortality proof pictures'}
              </Typography>
            </Box>

            {photos.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {photos.map((p, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 2 }}>
                    {p.mimeType.includes('pdf') ? <FileText size={14} /> : <ImageIcon size={14} />}
                    <Typography variant="caption">{p.fileName}</Typography>
                    <IconButton size="small" onClick={() => removePhoto(idx)}><X size={14} /></IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" onClick={() => navigate('/green-zone/my-requests')} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting || !parentDetails}
            startIcon={<Send size={18} />}
          >
            {submitting ? 'Submitting...' : 'Submit Mortality Request'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
