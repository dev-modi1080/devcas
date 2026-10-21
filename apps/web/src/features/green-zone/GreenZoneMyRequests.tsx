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
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Eye, Undo2, Ban, Plus } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RemarksDialog } from '../../components/common/RemarksDialog';
import { formatDate, WorkflowAction, WorkflowStatus } from '@cas/shared';
import { useNavigate } from 'react-router-dom';

export const GreenZoneMyRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Action dialog state
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [dialogAction, setDialogAction] = useState<WorkflowAction | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/green-zone/requests/my');
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (remarks: string) => {
    if (!selectedReq || !dialogAction) return;
    const entityType = selectedReq.type === 'MORTALITY' ? 'GREEN_ZONE_MORTALITY' : 'GREEN_ZONE_CREATION';
    await api.post(`/workflow/${entityType}/${selectedReq.id}/action`, {
      action: dialogAction,
      remarks,
    });
    fetchRequests();
  };

  const canCancel = (status: string) => {
    return [
      WorkflowStatus.PENDING_L1,
      WorkflowStatus.PENDING_L2,
      WorkflowStatus.PENDING_L3,
      WorkflowStatus.DRAFT,
      WorkflowStatus.CALLBACK,
      WorkflowStatus.RETURNED,
    ].includes(status as WorkflowStatus);
  };

  const canCallback = (status: string) => {
    return [
      WorkflowStatus.PENDING_L1,
      WorkflowStatus.PENDING_L2,
      WorkflowStatus.PENDING_L3,
    ].includes(status as WorkflowStatus);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            My Green Zone Requests
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track submissions, approval stages, and manage callbacks or cancellations.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => navigate('/green-zone/create')}
        >
          Create Request
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              You haven't submitted any Green Zone requests yet.
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
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {r.requestNo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.type}
                        size="small"
                        variant="outlined"
                        color={r.type === 'MORTALITY' ? 'error' : 'primary'}
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
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/green-zone/requests/${r.id}`)}
                          >
                            <Eye size={18} />
                          </IconButton>
                        </Tooltip>

                        {canCallback(r.status) && (
                          <Tooltip title="Callback Request">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => {
                                setSelectedReq(r);
                                setDialogAction(WorkflowAction.CALLBACK);
                              }}
                            >
                              <Undo2 size={18} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canCancel(r.status) && (
                          <Tooltip title="Cancel Request">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedReq(r);
                                setDialogAction(WorkflowAction.CANCEL);
                              }}
                            >
                              <Ban size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <RemarksDialog
        open={Boolean(dialogAction)}
        action={dialogAction}
        onClose={() => {
          setDialogAction(null);
          setSelectedReq(null);
        }}
        onSubmit={handleAction}
      />
    </Box>
  );
};
