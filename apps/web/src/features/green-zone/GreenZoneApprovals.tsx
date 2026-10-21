import React, { useEffect, useState } from 'react';
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
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import { Check, X, RotateCcw, Eye, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RemarksDialog } from '../../components/common/RemarksDialog';
import { WorkflowTimeline } from '../../components/common/WorkflowTimeline';
import { formatDate, WorkflowAction } from '@cas/shared';

export const GreenZoneApprovals: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action dialog
  const [dialogAction, setDialogAction] = useState<WorkflowAction | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/green-zone/requests/pending-approvals');
      setPendingRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openReviewModal = async (req: any) => {
    setSelectedRequest(req);
    setLoadingDetails(true);
    try {
      const entityType = req.type === 'MORTALITY' ? 'GREEN_ZONE_MORTALITY' : 'GREEN_ZONE_CREATION';
      const historyRes = await api.get(`/workflow/${entityType}/${req.id}/history`);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAction = async (remarks: string) => {
    if (!selectedRequest || !dialogAction) return;
    const entityType = selectedRequest.type === 'MORTALITY' ? 'GREEN_ZONE_MORTALITY' : 'GREEN_ZONE_CREATION';
    await api.post(`/workflow/${entityType}/${selectedRequest.id}/action`, {
      action: dialogAction,
      remarks,
    });
    setSelectedRequest(null);
    fetchPending();
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Pending Green Zone Approvals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review, approve, reject, or return submitted plantation requests according to your authorization level.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : pendingRequests.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No requests are currently pending your approval.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location / Business</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Plantation Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pending Level</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Submitted Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {r.requestNo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.type}
                        size="small"
                        color={r.type === 'MORTALITY' ? 'error' : 'primary'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {r.location?.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.business?.code} - {r.company?.shortName}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.plantationType?.description || '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Eye size={16} />}
                        onClick={() => openReviewModal(r)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Review & Approvals Modal */}
      {selectedRequest && (
        <Dialog
          open={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Review Request: {selectedRequest.requestNo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedRequest.type} • Submitted on {formatDate(selectedRequest.createdAt)}
                </Typography>
              </Box>
              <StatusBadge status={selectedRequest.status} />
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Business</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.business?.code}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Company</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.company?.shortName}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.location?.description}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Site Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.siteLocation?.description}</Typography>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Plantation Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.plantationType?.description || '-'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Quantity Count</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#2670DC' }}>
                  {selectedRequest.treeCount || selectedRequest.palmCount || selectedRequest.mangroveCount || selectedRequest.shrubCount || selectedRequest.mortalityCount || 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Area (Ha.)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{Number(selectedRequest.calculatedAreaHa || 0)} Ha</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Overlaps Cover?</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedRequest.overlapWithCover ? 'Yes (Excluded from total)' : 'No'}</Typography>
              </Grid>

              {selectedRequest.remarks && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Creator Remarks</Typography>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{selectedRequest.remarks}"
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Photos Gallery */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Proof Photographs ({selectedRequest.photos?.length || 0})
                </Typography>
                {selectedRequest.photos?.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {selectedRequest.photos.map((p: any) => (
                      <Paper
                        key={p.id}
                        sx={{
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                        }}
                      >
                        {p.mimeType?.includes('pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                        <Typography variant="caption" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.fileName}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">No photos attached</Typography>
                )}
              </Grid>

              {/* Timeline */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
                  Approval Workflow History
                </Typography>
                {loadingDetails ? <CircularProgress size={20} /> : <WorkflowTimeline steps={history} />}
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
            <Button onClick={() => setSelectedRequest(null)} color="inherit">
              Close
            </Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<RotateCcw size={16} />}
                onClick={() => setDialogAction(WorkflowAction.RETURN)}
              >
                Return to Creator
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<X size={16} />}
                onClick={() => setDialogAction(WorkflowAction.REJECT)}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Check size={16} />}
                onClick={() => setDialogAction(WorkflowAction.APPROVE)}
              >
                Approve
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      {/* Remarks Dialog for Reject / Return / Approve */}
      <RemarksDialog
        open={Boolean(dialogAction)}
        action={dialogAction}
        onClose={() => setDialogAction(null)}
        onSubmit={handleAction}
      />
    </Box>
  );
};
