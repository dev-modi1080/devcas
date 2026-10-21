import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { WorkflowTimeline } from '../../components/common/WorkflowTimeline';
import { formatDate } from '@cas/shared';

export const GreenZoneRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/green-zone/requests/${id}`),
        api.get(`/workflow/GREEN_ZONE_CREATION/${id}/history`).catch(() => ({ data: [] })),
      ])
        .then(([reqRes, histRes]) => {
          setRequest(reqRes.data);
          setHistory(histRes.data || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Request not found</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} color="inherit">
          Back
        </Button>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {request.requestNo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {request.type} • Created on {formatDate(request.createdAt)}
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <StatusBadge status={request.status} />
        </Box>
      </Box>

      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          Plantation Details
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Business</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.business?.code}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Company</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.company?.shortName}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.location?.description}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Site Location</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.siteLocation?.description}</Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Green Zone No</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.greenZone?.greenZoneNo}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Plantation Category</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.plantationCategory?.description || '-'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Plantation Type</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.plantationType?.description || '-'}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Botanical / Species</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.botanical?.description || '-'}</Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Quantity (Nos.)</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2670DC' }}>
              {request.treeCount || request.palmCount || request.mangroveCount || request.shrubCount || request.mortalityCount || 0}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Calculated Area (Ha.)</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {Number(request.calculatedAreaHa || 0)} Ha
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Overlaps Green Cover?</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {request.overlapWithCover ? 'Yes (Excluded from total)' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Plantation Mon-Yr</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{request.plantationMonthYear || '-'}</Typography>
          </Grid>

          {request.remarks && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Remarks</Typography>
              <Paper sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{request.remarks}"
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Proof Photos */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
              Photographs as Proof of Plantation
            </Typography>
            {request.photos?.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {request.photos.map((p: any) => (
                  <Paper
                    key={p.id}
                    sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2, bgcolor: 'background.default' }}
                  >
                    {p.mimeType?.includes('pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                    <Typography variant="caption">{p.fileName}</Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">No photos attached</Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Workflow Step History Timeline */}
      <Paper sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
          Approval History Timeline
        </Typography>
        <WorkflowTimeline steps={history} />
      </Paper>
    </Box>
  );
};
