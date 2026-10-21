import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  TreePine,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  AlertCircle,
  Ban,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';

export const GreenZoneDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/green-zone/dashboard/stats')
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const { overall, myStats, monthlyChart } = data || {};

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Green Zone Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Centralized inventory, plantation monitoring, and asset approval status.
        </Typography>
      </Box>

      {/* Section 1: Overall Statistics (no drilldown) */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        Overall Statistics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
                <TreePine size={20} color="#2670DC" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#2670DC' }}>
                {overall?.created || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Open / Pending
                </Typography>
                <Clock size={20} color="#F59E0B" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#F59E0B' }}>
                {overall?.open || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Complete
                </Typography>
                <CheckCircle2 size={20} color="#10B981" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#10B981' }}>
                {overall?.complete || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Rejected
                </Typography>
                <XCircle size={20} color="#EF4444" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#EF4444' }}>
                {overall?.reject || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section 2: My Statistics (with click-through to filtered list) */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
        My Statistics
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Created by Me
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {myStats?.created || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Open / In Progress
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#F59E0B' }}>
                {myStats?.open || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Completed
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#10B981' }}>
                {myStats?.completed || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Cancelled
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#6B7280' }}>
                {myStats?.cancelled || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect" sx={{ border: '2px solid #2670DC', bgcolor: '#F0F7FF' }}>
            <CardActionArea onClick={() => navigate('/green-zone/approvals')} sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2670DC' }}>
                Pending Action
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#2670DC' }}>
                {myStats?.pendingAction || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.7}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Action Taken
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {myStats?.actionTaken || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3} md={1.8}>
          <Card className="card-hover-effect">
            <CardActionArea onClick={() => navigate('/green-zone/my-requests')} sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Drafts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: '#64748B' }}>
                {myStats?.draft || 0}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Section 3: Month-wise Request Bar Chart */}
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Month-wise Requests Overview ({new Date().getFullYear()})
        </Typography>
        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChart || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="total" name="Total Requests" fill="#2670DC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Approved / Complete" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};
