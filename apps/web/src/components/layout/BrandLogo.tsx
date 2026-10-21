import React from 'react';
import { Box, Typography } from '@mui/material';

export const BrandLogo: React.FC<{ height?: number }> = ({ height = 36 }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', cursor: 'pointer' }}>
      <img
        src="/brand/logo.svg"
        alt="adani | CAS"
        style={{ height, maxHeight: height, width: 'auto' }}
        onError={(e) => {
          // If svg image fails to load, fallback to styled text wordmark
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      <Box sx={{ display: 'none' }} className="logo-fallback">
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: 'text.primary' }}>
          adani <span style={{ color: '#2670DC', fontWeight: 600 }}>| CAS</span>
        </Typography>
      </Box>
    </Box>
  );
};
