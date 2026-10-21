import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { WorkflowAction } from '@cas/shared';

interface RemarksDialogProps {
  open: boolean;
  action: WorkflowAction | null;
  title?: string;
  onClose: () => void;
  onSubmit: (remarks: string) => Promise<void>;
}

export const RemarksDialog: React.FC<RemarksDialogProps> = ({
  open,
  action,
  title,
  onClose,
  onSubmit,
}) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getActionLabel = () => {
    switch (action) {
      case WorkflowAction.REJECT:
        return { verb: 'Reject', color: 'error' };
      case WorkflowAction.RETURN:
        return { verb: 'Return to Creator', color: 'warning' };
      case WorkflowAction.CALLBACK:
        return { verb: 'Callback', color: 'secondary' };
      case WorkflowAction.CANCEL:
        return { verb: 'Cancel Request', color: 'error' };
      case WorkflowAction.APPROVE:
        return { verb: 'Approve', color: 'primary' };
      default:
        return { verb: 'Submit', color: 'primary' };
    }
  };

  const handleConfirm = async () => {
    const isRemarksMandatory = action !== WorkflowAction.APPROVE;
    if (isRemarksMandatory && !remarks.trim()) {
      setError('Remarks are mandatory for this action');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSubmit(remarks.trim());
      setRemarks('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const { verb, color } = getActionLabel();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title || `Confirm ${verb}`}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {action !== WorkflowAction.APPROVE
            ? 'Please enter detailed remarks explaining the rationale for this action.'
            : 'You may optionally provide approval remarks.'}
        </Typography>
        <TextField
          autoFocus
          multiline
          rows={3}
          fullWidth
          label={action !== WorkflowAction.APPROVE ? 'Remarks (Required)' : 'Remarks (Optional)'}
          value={remarks}
          onChange={(e) => {
            setRemarks(e.target.value.slice(0, 500));
            if (error) setError('');
          }}
          error={!!error}
          helperText={error || `${remarks.length}/500 characters`}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Dismiss
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={color as any}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
