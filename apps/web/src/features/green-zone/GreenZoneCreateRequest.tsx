import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Upload, X, Check, Save, Send, Image as ImageIcon, FileText } from 'lucide-react';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { calculatePlantationArea } from '@cas/shared';

export const GreenZoneCreateRequest: React.FC = () => {
  const navigate = useNavigate();

  // Master options
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [siteLocations, setSiteLocations] = useState<any[]>([]);
  const [greenZones, setGreenZones] = useState<any[]>([]);
  const [plantationCategories, setPlantationCategories] = useState<any[]>([]);
  const [plantationTypes, setPlantationTypes] = useState<any[]>([]);
  const [botanicals, setBotanicals] = useState<any[]>([]);
  const [irrigationTypes, setIrrigationTypes] = useState<any[]>([]);

  // Loading & submission state
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [businessId, setBusinessId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [siteLocationId, setSiteLocationId] = useState('');
  const [greenZoneId, setGreenZoneId] = useState('');
  const [plantationCategoryId, setPlantationCategoryId] = useState('');
  const [plantationTypeId, setPlantationTypeId] = useState('');
  const [botanicalId, setBotanicalId] = useState('');
  const [distanceRowToRowM, setDistanceRowToRowM] = useState<number | ''>('');
  const [distancePlantToPlantM, setDistancePlantToPlantM] = useState<number | ''>('');

  // Conditional quantities
  const [treeCount, setTreeCount] = useState<number | ''>('');
  const [palmCount, setPalmCount] = useState<number | ''>('');
  const [mangroveCount, setMangroveCount] = useState<number | ''>('');
  const [shrubCount, setShrubCount] = useState<number | ''>('');
  const [groundCoverArea, setGroundCoverArea] = useState<number | ''>('');

  const [overlapWithCover, setOverlapWithCover] = useState(false);
  const [irrigationTypeId, setIrrigationTypeId] = useState('');
  const [plantationMonthYear, setPlantationMonthYear] = useState(() => {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]}-${d.getFullYear()}`;
  });
  const [remarks, setRemarks] = useState('');

  // Photos
  const [photos, setPhotos] = useState<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load cascading master data on mount
  useEffect(() => {
    api
      .get('/masters/cascading')
      .then((res) => {
        setBusinesses(res.data.businesses || []);
        setLocations(res.data.locations || []);
        setSiteLocations(res.data.siteLocations || []);
        setPlantationTypes(res.data.plantationTypes || []);
        setPlantationCategories(res.data.plantationCategories || []);
        setIrrigationTypes(res.data.irrigationTypes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingMasters(false));
  }, []);

  // Filter Companies when Business changes
  useEffect(() => {
    if (businessId) {
      api
        .get(`/masters/companies?businessId=${businessId}`)
        .then((res) => setCompanies(res.data))
        .catch((err) => console.error(err));
    } else {
      setCompanies([]);
      setCompanyId('');
    }
  }, [businessId]);

  // Filter Green Zones when Business, Company, Location, SiteLocation change
  useEffect(() => {
    if (businessId && companyId && locationId && siteLocationId) {
      api
        .get('/masters/green-zones', {
          params: { businessId, companyId, locationId, siteLocationId },
        })
        .then((res) => setGreenZones(res.data))
        .catch((err) => console.error(err));
    } else {
      setGreenZones([]);
      setGreenZoneId('');
    }
  }, [businessId, companyId, locationId, siteLocationId]);

  // Filter Botanicals when PlantationType changes
  const selectedTypeObj = plantationTypes.find((pt) => pt.id === plantationTypeId);
  const selectedTypeName = selectedTypeObj?.code || '';

  useEffect(() => {
    if (plantationTypeId) {
      api
        .get(`/masters/botanicals?plantationTypeId=${plantationTypeId}`)
        .then((res) => setBotanicals(res.data))
        .catch((err) => console.error(err));
    } else {
      setBotanicals([]);
      setBotanicalId('');
    }
  }, [plantationTypeId]);

  // Calculate area automatically
  let calculatedAreaHa = 0;
  if (selectedTypeName === 'Tree' && treeCount && distanceRowToRowM && distancePlantToPlantM) {
    calculatedAreaHa = calculatePlantationArea(Number(treeCount), Number(distanceRowToRowM), Number(distancePlantToPlantM));
  } else if (selectedTypeName === 'Palm' && palmCount && distanceRowToRowM && distancePlantToPlantM) {
    calculatedAreaHa = calculatePlantationArea(Number(palmCount), Number(distanceRowToRowM), Number(distancePlantToPlantM));
  } else if (selectedTypeName === 'Shrub' && shrubCount && distanceRowToRowM && distancePlantToPlantM) {
    calculatedAreaHa = calculatePlantationArea(Number(shrubCount), Number(distanceRowToRowM), Number(distancePlantToPlantM));
  } else if (selectedTypeName === 'Ground Cover & Lawn' && groundCoverArea) {
    calculatedAreaHa = Number(groundCoverArea);
  }

  // Handle Photo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5 MB limit`);
        }

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

  // Submit Handler
  const handleSubmit = async (isSubmit: boolean) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      if (isSubmit && photos.length === 0) {
        throw new Error('At least one photograph is required as proof of plantation to submit');
      }

      const payload = {
        businessId,
        companyId,
        locationId,
        siteLocationId,
        greenZoneId,
        plantationCategoryId: plantationCategoryId || undefined,
        plantationTypeId: plantationTypeId || undefined,
        botanicalId: botanicalId || undefined,
        irrigationTypeId: irrigationTypeId || undefined,
        distanceRowToRowM: distanceRowToRowM !== '' ? Number(distanceRowToRowM) : undefined,
        distancePlantToPlantM: distancePlantToPlantM !== '' ? Number(distancePlantToPlantM) : undefined,
        treeCount: selectedTypeName === 'Tree' && treeCount !== '' ? Number(treeCount) : undefined,
        palmCount: selectedTypeName === 'Palm' && palmCount !== '' ? Number(palmCount) : undefined,
        mangroveCount: selectedTypeName === 'Mangrove' && mangroveCount !== '' ? Number(mangroveCount) : undefined,
        shrubCount: selectedTypeName === 'Shrub' && shrubCount !== '' ? Number(shrubCount) : undefined,
        groundCoverArea: selectedTypeName === 'Ground Cover & Lawn' && groundCoverArea !== '' ? Number(groundCoverArea) : undefined,
        overlapWithCover,
        plantationMonthYear,
        remarks,
        photos,
        isSubmit,
      };

      const res = await api.post('/green-zone/requests', payload);
      setSuccess(
        isSubmit
          ? `Request ${res.data.requestNo} submitted successfully for approval!`
          : `Draft ${res.data.requestNo} saved successfully.`,
      );

      setTimeout(() => {
        navigate('/green-zone/my-requests');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMasters) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Create Green Zone Request
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Digitize plantation details, species, spacing, and proof photographs for validation.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2.5}>
          {/* 1. Business */}
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

          {/* 2. Company */}
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

          {/* 3. Location */}
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

          {/* 4. Site Location */}
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

          {/* 5. Green Zone Number */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              required
              label="Green Zone Number"
              value={greenZoneId}
              onChange={(e) => setGreenZoneId(e.target.value)}
              disabled={!siteLocationId}
              helperText={
                greenZones.length === 0 && siteLocationId
                  ? 'No green zones registered for this selection in Green Zone Master'
                  : 'Select from Green Zone Master'
              }
            >
              {greenZones.map((gz) => (
                <MenuItem key={gz.id} value={gz.id}>
                  {gz.greenZoneNo} ({gz.description || 'No description'})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#2670DC' }}>
              Plantation & Botanical Information
            </Typography>
          </Grid>

          {/* 6. Plantation Category */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Plantation Category"
              value={plantationCategoryId}
              onChange={(e) => setPlantationCategoryId(e.target.value)}
            >
              {plantationCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 7. Type of Plantation */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Type of Plantation"
              value={plantationTypeId}
              onChange={(e) => setPlantationTypeId(e.target.value)}
            >
              {plantationTypes.map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>
                  {pt.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 8. Botanical Name */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              required
              label="Botanical Name / Species"
              value={botanicalId}
              onChange={(e) => setBotanicalId(e.target.value)}
              disabled={!plantationTypeId}
            >
              {botanicals.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.description} ({b.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 9 & 10 Spacing Row to Row & Plant to Plant */}
          {['Tree', 'Palm', 'Shrub'].includes(selectedTypeName) && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Plantation Distance Row-to-Row (m)"
                  value={distanceRowToRowM}
                  onChange={(e) => setDistanceRowToRowM(Number(e.target.value))}
                >
                  <MenuItem value={2.0}>2.0 metres</MenuItem>
                  <MenuItem value={2.5}>2.5 metres</MenuItem>
                  <MenuItem value={3.0}>3.0 metres</MenuItem>
                  <MenuItem value={4.0}>4.0 metres</MenuItem>
                  <MenuItem value={5.0}>5.0 metres</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Plantation Distance Plant-to-Plant (m)"
                  value={distancePlantToPlantM}
                  onChange={(e) => setDistancePlantToPlantM(Number(e.target.value))}
                >
                  <MenuItem value={1.5}>1.5 metres</MenuItem>
                  <MenuItem value={2.0}>2.0 metres</MenuItem>
                  <MenuItem value={2.5}>2.5 metres</MenuItem>
                  <MenuItem value={3.0}>3.0 metres</MenuItem>
                  <MenuItem value={4.0}>4.0 metres</MenuItem>
                </TextField>
              </Grid>
            </>
          )}

          {/* 11. Conditional Quantity Fields */}
          {selectedTypeName === 'Tree' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  fullWidth
                  required
                  label="Trees (Nos.)"
                  value={treeCount}
                  onChange={(e) => setTreeCount(e.target.value ? parseInt(e.target.value, 10) : '')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Trees/Palm Area (Ha.)"
                  value={calculatedAreaHa}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-calculated: (Count x Row-to-Row x Plant-to-Plant) / 10,000"
                />
              </Grid>
            </>
          )}

          {selectedTypeName === 'Palm' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  fullWidth
                  required
                  label="Palm (Nos.)"
                  value={palmCount}
                  onChange={(e) => setPalmCount(e.target.value ? parseInt(e.target.value, 10) : '')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Trees/Palm Area (Ha.)"
                  value={calculatedAreaHa}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-calculated: (Count x Row-to-Row x Plant-to-Plant) / 10,000"
                />
              </Grid>
            </>
          )}

          {selectedTypeName === 'Mangrove' && (
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                fullWidth
                required
                label="Mangroves (Nos.)"
                value={mangroveCount}
                onChange={(e) => setMangroveCount(e.target.value ? parseInt(e.target.value, 10) : '')}
              />
            </Grid>
          )}

          {selectedTypeName === 'Shrub' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  type="number"
                  fullWidth
                  required
                  label="Shrubs (Nos.)"
                  value={shrubCount}
                  onChange={(e) => setShrubCount(e.target.value ? parseInt(e.target.value, 10) : '')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shrubs Area (Ha.)"
                  value={calculatedAreaHa}
                  InputProps={{ readOnly: true }}
                  helperText="Auto-calculated: (Count x Row-to-Row x Plant-to-Plant) / 10,000"
                />
              </Grid>
            </>
          )}

          {selectedTypeName === 'Ground Cover & Lawn' && (
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                fullWidth
                required
                label="Lawn / Ground Cover Area (Ha.)"
                value={groundCoverArea}
                onChange={(e) => setGroundCoverArea(e.target.value ? parseFloat(e.target.value) : '')}
                helperText="Manual entry decimal in Hectares"
              />
            </Grid>
          )}

          {/* 12. Overlap Checkbox */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={overlapWithCover}
                    onChange={(e) => setOverlapWithCover(e.target.checked)}
                    color="primary"
                  />
                }
                label="Does this plantation overlap with existing green cover?"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, ml: 4 }}>
                If ticked, the area from this request is <strong>not counted</strong> in total green cover area, but the number of plants/species <strong>is counted</strong>.
              </Typography>
            </Box>
          </Grid>

          {/* 13. Irrigation Type */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Type of Irrigation"
              value={irrigationTypeId}
              onChange={(e) => setIrrigationTypeId(e.target.value)}
            >
              {irrigationTypes.map((irr) => (
                <MenuItem key={irr.id} value={irr.id}>
                  {irr.description}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* 14. Plantation Month-Year */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Plantation Month-Year"
              value={plantationMonthYear}
              onChange={(e) => setPlantationMonthYear(e.target.value)}
              helperText="Format: Mon-YYYY (e.g. May-2025)"
            />
          </Grid>

          {/* 15. Remarks (max 500 characters with live counter) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
              helperText={`${remarks.length}/500 characters`}
            />
          </Grid>

          {/* 16. Proof Photographs (multiple files, PDF, JPEG, JPG, PNG) */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#2670DC' }}>
              Photographs as Proof of Plantation (At least one required for submit)
            </Typography>

            <Box
              sx={{
                border: '2px dashed #CBD5E1',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: 'background.default',
                cursor: 'pointer',
                '&:hover': { borderColor: '#2670DC' },
              }}
              component="label"
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Upload size={32} color="#2670DC" style={{ margin: '0 auto 8px' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {uploading ? 'Uploading proof file...' : 'Click or drag photos here (JPEG, JPG, PNG, PDF up to 5 MB)'}
              </Typography>
            </Box>

            {/* List of uploaded photos */}
            {photos.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                {photos.map((p, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                    {p.mimeType.includes('pdf') ? <FileText size={16} /> : <ImageIcon size={16} />}
                    <Typography variant="caption" sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.fileName}
                    </Typography>
                    <IconButton size="small" onClick={() => removePhoto(idx)}>
                      <X size={14} />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>

        {/* Action Buttons / Sticky Bottom Submit Bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            startIcon={<Save size={18} />}
          >
            Save as Draft
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            startIcon={<Send size={18} />}
          >
            {submitting ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
