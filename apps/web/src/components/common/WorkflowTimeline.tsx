import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { CheckCircle2, XCircle, RotateCcw, Undo2, Ban, Send, Clock } from 'lucide-react';
import { formatDate, formatDateTime, WorkflowAction } from '@cas/shared';

interface Step {
  id: string;
  level: string;
  action: string;
  remarks?: string;
  createdAt: string;
  actor: {
    name: string;
    role: string;
    email: string;
  };
}

export const WorkflowTimeline: React.FC<{ steps: Step[] }> = ({ steps }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case WorkflowAction.APPROVE:
        return <CheckCircle2 size={18} color="#10B981" />;
      case WorkflowAction.REJECT:
        return <XCircle size={18} color="#EF4444" />;
      case WorkflowAction.RETURN:
        return <RotateCcw size={18} color="#F59E0B" />;
      case WorkflowAction.CALLBACK:
        return <Undo2 size={18} color="#6366F1" />;
      case WorkflowAction.CANCEL:
        return <Ban size={18} color="#6B7280" />;
      case WorkflowAction.SUBMIT:
        return <Send size={18} color="#2670DC" />;
      default:
        return <Clock size={18} color="#9CA3AF" />;
    }
  };

  const getActionBadge = (action: string) => {
    let color = '#2670DC';
    if (action === WorkflowAction.APPROVE) color = '#10B981';
    if (action === WorkflowAction.REJECT) color = '#EF4444';
    if (action === WorkflowAction.RETURN) color = '#F59E0B';
    if (action === WorkflowAction.CANCEL) color = '#6B7280';
    if (action === WorkflowAction.CALLBACK) color = '#6366F1';

    return (
      <span
        style={{
          color,
          fontWeight: 700,
          fontSize: '0.8rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {action}
      </span>
    );
  };

  if (!steps || steps.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
        No approval steps recorded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ position: 'relative', pl: 2, '&::before': { content: '""', position: 'absolute', top: 8, bottom: 8, left: 24, width: 2, bgcolor: 'divider' } }}>
      {steps.map((step, idx) => (
        <Box key={step.id || idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5, position: 'relative' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'background.paper',
              border: '2px solid #CBD5E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              mr: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            {getActionIcon(step.action)}
          </Box>
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getActionBadge(step.action)}
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  ({step.level})
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(step.createdAt)}
              </Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {step.actor?.name || 'System'}{' '}
              <span style={{ fontWeight: 400, color: '#64748B', fontSize: '0.8rem' }}>
                ({step.actor?.role?.replace('_', ' ') || 'Actor'})
              </span>
            </Typography>
            {step.remarks && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', fontSize: '0.85rem' }}>
                  "{step.remarks}"
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ))}
    </Box>
  );
};
