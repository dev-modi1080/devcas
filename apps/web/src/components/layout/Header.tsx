import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Badge,
  Chip,
  Popover,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Sun,
  Moon,
  Bell,
  User as UserIcon,
  LogOut,
  Users,
  CheckCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth, AppModule } from '../../context/AuthContext';
import { UserRole } from '@cas/shared';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export const Header: React.FC = () => {
  const {
    user,
    activeModule,
    setActiveModule,
    setDevModalOpen,
    logout,
    themeMode,
    toggleTheme,
    fontScale,
    setFontScale,
    language,
    toggleLanguage,
  } = useAuth();

  const navigate = useNavigate();

  // User menu anchor
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  // Notifications popover
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      if (user) {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // ignore in header
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // refresh notifications every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleModuleClick = (mod: AppModule, path: string) => {
    setActiveModule(mod);
    navigate(path);
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    fetchNotifications();
  };

  return (
    <>
      {/* Adani Top Gradient Accent Line */}
      <div className="brand-accent-line" />

      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 1.5, sm: 3 }, minHeight: 64 }}>
          {/* Left: Logo & Module Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
            <BrandLogo height={34} />

            {/* Desktop Module Switcher Tabs */}
            <Box sx={{ display: { xs: 'none', lg: 'flex' }, gap: 1, ml: 2 }}>
              <Button
                variant={activeModule === 'GREEN_ZONE' ? 'contained' : 'text'}
                color="primary"
                onClick={() => handleModuleClick('GREEN_ZONE', '/green-zone/dashboard')}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  fontSize: '0.85rem',
                  fontWeight: activeModule === 'GREEN_ZONE' ? 700 : 500,
                  bgcolor: activeModule === 'GREEN_ZONE' ? '#2670DC' : 'transparent',
                }}
              >
                Green Zone
              </Button>
              <Button
                variant={activeModule === 'MIS' ? 'contained' : 'text'}
                color="primary"
                onClick={() => handleModuleClick('MIS', '/mis/dashboard')}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  fontSize: '0.85rem',
                  fontWeight: activeModule === 'MIS' ? 700 : 500,
                  bgcolor: activeModule === 'MIS' ? '#2670DC' : 'transparent',
                }}
              >
                MIS Data
              </Button>
              <Button
                variant={activeModule === 'TREES' ? 'contained' : 'text'}
                color="primary"
                onClick={() => handleModuleClick('TREES', '/trees/report')}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  fontSize: '0.85rem',
                  fontWeight: activeModule === 'TREES' ? 700 : 500,
                  bgcolor: activeModule === 'TREES' ? '#2670DC' : 'transparent',
                }}
              >
                100M Trees
              </Button>
              {user?.role === UserRole.CAS_ADMIN && (
                <Button
                  variant={activeModule === 'MASTERS' ? 'contained' : 'text'}
                  color="primary"
                  onClick={() => handleModuleClick('MASTERS', '/masters/businesses')}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    fontSize: '0.85rem',
                    fontWeight: activeModule === 'MASTERS' ? 700 : 500,
                    bgcolor: activeModule === 'MASTERS' ? '#2670DC' : 'transparent',
                  }}
                >
                  Master Data
                </Button>
              )}
            </Box>
          </Box>

          {/* Right: Accessibility controls, Notifications, User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            {/* Font Size A- / A / A+ accessibility toggle */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                bgcolor: 'background.default',
                borderRadius: 2,
                p: 0.25,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Button
                size="small"
                onClick={() => setFontScale('small')}
                sx={{
                  minWidth: 30,
                  px: 1,
                  height: 28,
                  fontSize: '0.75rem',
                  fontWeight: fontScale === 'small' ? 700 : 400,
                  bgcolor: fontScale === 'small' ? 'background.paper' : 'transparent',
                  boxShadow: fontScale === 'small' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                A-
              </Button>
              <Button
                size="small"
                onClick={() => setFontScale('medium')}
                sx={{
                  minWidth: 30,
                  px: 1,
                  height: 28,
                  fontSize: '0.85rem',
                  fontWeight: fontScale === 'medium' ? 700 : 400,
                  bgcolor: fontScale === 'medium' ? 'background.paper' : 'transparent',
                  boxShadow: fontScale === 'medium' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                A
              </Button>
              <Button
                size="small"
                onClick={() => setFontScale('large')}
                sx={{
                  minWidth: 30,
                  px: 1,
                  height: 28,
                  fontSize: '0.95rem',
                  fontWeight: fontScale === 'large' ? 700 : 400,
                  bgcolor: fontScale === 'large' ? 'background.paper' : 'transparent',
                  boxShadow: fontScale === 'large' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                A+
              </Button>
            </Box>

            {/* EN / HI language toggle */}
            <Tooltip title="Language Toggle (English / Hindi)">
              <Button
                variant="outlined"
                size="small"
                onClick={toggleLanguage}
                sx={{
                  minWidth: 42,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                {language === 'en' ? 'EN' : 'HI'}
              </Button>
            </Tooltip>

            {/* Theme Toggle (Light / Dark) */}
            <Tooltip title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <IconButton onClick={toggleTheme} size="small" sx={{ p: 1 }}>
                {themeMode === 'light' ? <Moon size={19} /> : <Sun size={19} />}
              </IconButton>
            </Tooltip>

            {/* Notifications Bell */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                sx={{ p: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                  <Bell size={20} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications Popover */}
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 340, maxHeight: 420, borderRadius: 2, p: 1 } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Notifications ({unreadCount})
                </Typography>
                {unreadCount > 0 && (
                  <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem' }}>
                    Mark all read
                  </Button>
                )}
              </Box>
              <Divider />
              <List sx={{ p: 0, overflowY: 'auto', maxHeight: 320 }}>
                {notifications.length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="No notifications yet." />
                  </ListItem>
                ) : (
                  notifications.map((n) => (
                    <ListItem
                      key={n.id}
                      button
                      onClick={async () => {
                        await api.patch(`/notifications/${n.id}/read`);
                        fetchNotifications();
                        if (n.link) navigate(n.link);
                        setNotifAnchor(null);
                      }}
                      sx={{
                        bgcolor: n.read ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        my: 0.5,
                      }}
                    >
                      <ListItemText
                        primary={n.title}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: n.read ? 500 : 700 }}
                        secondary={n.message}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: false }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </Popover>

            {/* User Profile & Switcher */}
            {user ? (
              <>
                <Button
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5,
                    px: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#2670DC', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                    {user.name.charAt(0)}
                  </Box>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      {user.role.replace('_', ' ')}
                    </Typography>
                  </Box>
                  <ChevronDown size={14} />
                </Button>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  PaperProps={{ sx: { minWidth: 220, borderRadius: 2, mt: 1 } }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {user.email}
                    </Typography>
                    <Chip
                      label={user.role.replace('_', ' ')}
                      size="small"
                      color="primary"
                      sx={{ mt: 1, fontSize: '0.7rem', fontWeight: 600, height: 20 }}
                    />
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      setDevModalOpen(true);
                    }}
                  >
                    <Users size={16} style={{ marginRight: 8 }} />
                    Switch User (DEV_LOGIN)
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setUserMenuAnchor(null);
                      logout();
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <LogOut size={16} style={{ marginRight: 8 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => setDevModalOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 700 }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};
