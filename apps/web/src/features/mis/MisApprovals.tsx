import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
import { Check, X, Eye, FileText } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RemarksDialog } from '../../components/common/RemarksDialog';
import { WorkflowTimeline } from '../../components/common/WorkflowTimeline';
import { formatDate, formatINR, WorkflowAction } from '@cas/shared';

export const MisApprovals: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [pendingYearly, setPendingYearly] = useState<any[]>([]);
  const [pendingMonthly, setPendingMonthly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'MIS_YEARLY' | 'MIS_MONTHLY'>('MIS_YEARLY');
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Action Dialog
  const [dialogAction, setDialogAction] = useState<WorkflowAction | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mis/entries/pending-approvals');
      setPendingYearly(res.data.yearly || []);
      setPendingMonthly(res.data.monthly || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openReview = async (item: any, type: 'MIS_YEARLY' | 'MIS_MONTHLY') => {
    setSelectedEntry(item);
    setSelectedType(type);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/workflow/${type}/${item.id}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAction = async (remarks: string) => {
    if (!selectedEntry || !dialogAction) return;
    await api.post(`/workflow/${selectedType}/${selectedEntry.id}/action`, {
      action: dialogAction,
      remarks,
    });
    setSelectedEntry(null);
    fetchPending();
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Pending MIS Approvals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Approve or reject yearly budgets and monthly expenditure entries for your authorization level.
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', px: 2 }}
        >
          <Tab label={`Yearly Budgets (${pendingYearly.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Monthly Expenses (${pendingMonthly.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          /* Pending Yearly Budgets */
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fiscal Year</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Budget Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingYearly.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No yearly budgets pending your approval.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingYearly.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {item.requestNo}
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.location?.description}</TableCell>
                      <TableCell>{item.fiscalYear}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatINR(item.budgetAmount)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Eye size={16} />}
                          onClick={() => openReview(item, 'MIS_YEARLY')}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Pending Monthly Expenses */
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Consumed Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingMonthly.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No monthly expenses pending your approval.
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingMonthly.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {item.requestNo}
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.location?.description}</TableCell>
                      <TableCell>{item.expenseCategory?.description || '-'}</TableCell>
                      <TableCell>{item.month}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{formatINR(item.consumedCost)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Eye size={16} />}
                          onClick={() => openReview(item, 'MIS_MONTHLY')}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Review Modal */}
      {selectedEntry && (
        <Dialog
          open={Boolean(selectedEntry)}
          onClose={() => setSelectedEntry(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Review {selectedType === 'MIS_YEARLY' ? 'Yearly Budget' : 'Monthly Expense'}: {selectedEntry.requestNo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted on {formatDate(selectedEntry.createdAt)} {selectedEntry.isLateEntry && '• (Late Entry)'}
                </Typography>
              </Box>
              <StatusBadge status={selectedEntry.status} />
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.type}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Business</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.business?.code}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.location?.description}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Site Location</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.siteLocation?.description}</Typography>
              </Grid>

              {selectedType === 'MIS_YEARLY' ? (
                <>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Fiscal Year</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.fiscalYear}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Budget Amount</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2670DC' }}>
                      {formatINR(selectedEntry.budgetAmount)}
                    </Typography>
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Expense Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.expenseCategory?.description}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Month</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedEntry.month}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Consumed Cost</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2670DC' }}>
                      {formatINR(selectedEntry.consumedCost)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Workforce</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {selectedEntry.maleWorkforceCount} M / {selectedEntry.femaleWorkforceCount} F
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Maintained Area</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Number(selectedEntry.areaHa || 0)} Ha
                    </Typography>
                  </Grid>
                </>
              )}

              {selectedEntry.remarks && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Remarks</Typography>
                  <Paper sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      "{selectedEntry.remarks}"
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Attachments */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Attached Documents (PDF Only)
                </Typography>
                {selectedEntry.attachments?.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {selectedEntry.attachments.map((att: any) => (
                      <Paper key={att.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2, bgcolor: 'background.default' }}>
                        <FileText size={18} color="#DC2626" />
                        <Typography variant="caption">{att.fileName}</Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">No attachments</Typography>
                )}
              </Grid>

              {/* Timeline */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1, mb: 1 }}>
                  Approval Workflow History
                </Typography>
                {loadingHistory ? <CircularProgress size={20} /> : <WorkflowTimeline steps={history} />}
              </Grid>
            </Grid>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
            <Button onClick={() => setSelectedEntry(null)} color="inherit">
              Close
            </Button>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
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

      <RemarksDialog
        open={Boolean(dialogAction)}
        action={dialogAction}
        onClose={() => setDialogAction(null)}
        onSubmit={handleAction}
      />
    </Box>
  );
};
