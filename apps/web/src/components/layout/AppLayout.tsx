import React from 'react';
import { Box, Container, Breadcrumbs, Link, Typography, useTheme, useMediaQuery, CircularProgress } from '@mui/material';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DevLoginModal } from '../common/DevLoginModal';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, loading } = useAuth();

  // Generate breadcrumbs from current path
  const pathnames = location.pathname.split('/').filter((x) => x);

  const formatBreadcrumb = (str: string) => {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Box sx={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3, md: 4 },
            pb: isMobile ? 8 : 4, // padding for mobile bottom bar
            width: { md: `calc(100% - 260px)` },
            maxWidth: '100%',
          }}
        >
          {user ? (
            <>
              {/* Breadcrumbs */}
              {pathnames.length > 0 && (
                <Breadcrumbs
                  separator={<ChevronRight size={14} />}
                  aria-label="breadcrumb"
                  sx={{ mb: 2.5, fontSize: '0.85rem' }}
                >
                  <Link component={RouterLink} to="/" underline="hover" color="inherit">
                    Home
                  </Link>
                  {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    return last ? (
                      <Typography color="text.primary" key={to} sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {formatBreadcrumb(value)}
                      </Typography>
                    ) : (
                      <Link component={RouterLink} to={to} underline="hover" color="inherit" key={to}>
                        {formatBreadcrumb(value)}
                      </Link>
                    );
                  })}
                </Breadcrumbs>
              )}
              {children}
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Please select a user to continue.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <DevLoginModal />
    </Box>
  );
};
