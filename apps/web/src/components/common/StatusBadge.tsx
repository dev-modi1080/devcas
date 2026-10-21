import React from 'react';
import { Chip } from '@mui/material';
import { WorkflowStatus, STATUS_MAP } from '@cas/shared';

export const StatusBadge: React.FC<{ status: WorkflowStatus | string }> = ({ status }) => {
  const config = STATUS_MAP[status as WorkflowStatus] || {
    label: status,
    bgHex: '#ECEFF1',
    textHex: '#455A64',
  };

  return (
    <Chip
      size="small"
      label={config.label}
      sx={{
        backgroundColor: config.bgHex,
        color: config.textHex,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '16px',
        border: `1px solid ${config.textHex}22`,
        height: 24,
        px: 0.5,
      }}
    />
  );
};
