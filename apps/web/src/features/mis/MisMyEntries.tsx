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
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Ban, Plus } from 'lucide-react';
import api from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RemarksDialog } from '../../components/common/RemarksDialog';
import { formatDate, formatINR, WorkflowAction, WorkflowStatus } from '@cas/shared';
import { useNavigate } from 'react-router-dom';

export const MisMyEntries: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [yearlyEntries, setYearlyEntries] = useState<any[]>([]);
  const [monthlyEntries, setMonthlyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cancel dialog
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'MIS_YEARLY' | 'MIS_MONTHLY'>('MIS_YEARLY');
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mis/entries/my');
      setYearlyEntries(res.data.yearly || []);
      setMonthlyEntries(res.data.monthly || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleCancel = async (remarks: string) => {
    if (!selectedEntry) return;
    await api.post(`/workflow/${selectedType}/${selectedEntry.id}/action`, {
      action: WorkflowAction.CANCEL,
      remarks,
    });
    setCancelOpen(false);
    setSelectedEntry(null);
    fetchEntries();
  };

  const canCancel = (status: string) => {
    return [
      WorkflowStatus.PENDING_L1,
      WorkflowStatus.PENDING_L2,
      WorkflowStatus.PENDING_L3,
      WorkflowStatus.DRAFT,
    ].includes(status as WorkflowStatus);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            My MIS Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View status and manage submitted yearly budgets and monthly expenses.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/mis/yearly-budget')}
          >
            Yearly Budget
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => navigate('/mis/monthly-expense')}
          >
            Monthly Expense
          </Button>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default', px: 2 }}
        >
          <Tab label={`Yearly Budgets (${yearlyEntries.length})`} sx={{ fontWeight: 700 }} />
          <Tab label={`Monthly Expenses (${monthlyEntries.length})`} sx={{ fontWeight: 700 }} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : tab === 0 ? (
          /* Yearly Budgets Table */
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Request No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Location / Business</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fiscal Year</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Budget Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearlyEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No yearly budget entries submitted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  yearlyEntries.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {item.requestNo}
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.location?.description}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.business?.code}</Typography>
                      </TableCell>
                      <TableCell>{item.fiscalYear}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatINR(item.budgetAmount)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell align="right">
                        {canCancel(item.status) && (
                          <Tooltip title="Cancel Budget">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedEntry(item);
                                setSelectedType('MIS_YEARLY');
                                setCancelOpen(true);
                              }}
                            >
                              <Ban size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Monthly Expenses Table */
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
                {monthlyEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      No monthly expense entries submitted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyEntries.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {item.requestNo}
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.location?.description}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.siteLocation?.description}</Typography>
                      </TableCell>
                      <TableCell>{item.expenseCategory?.description || '-'}</TableCell>
                      <TableCell>{item.month}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{formatINR(item.consumedCost)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell align="right">
                        {canCancel(item.status) && (
                          <Tooltip title="Cancel Entry">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedEntry(item);
                                setSelectedType('MIS_MONTHLY');
                                setCancelOpen(true);
                              }}
                            >
                              <Ban size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <RemarksDialog
        open={cancelOpen}
        action={WorkflowAction.CANCEL}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
    </Box>
  );
};
