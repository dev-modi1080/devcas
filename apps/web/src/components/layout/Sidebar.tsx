import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  LayoutDashboard,
  PlusCircle,
  FolderOpen,
  CheckSquare,
  Skull,
  Search,
  DollarSign,
  TrendingUp,
  TreePine,
  Target,
  Database,
  Building,
  MapPin,
  Users,
  Settings,
  Scale,
} from 'lucide-react';
import { useAuth, AppModule } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '@cas/shared';

const DRAWER_WIDTH = 260;

export const Sidebar: React.FC = () => {
  const { user, activeModule, setActiveModule } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getNavItems = () => {
    switch (activeModule) {
      case 'GREEN_ZONE':
        return [
          { label: 'Dashboard', path: '/green-zone/dashboard', icon: <LayoutDashboard size={20} /> },
          { label: 'Create Request', path: '/green-zone/create', icon: <PlusCircle size={20} /> },
          { label: 'My Requests', path: '/green-zone/my-requests', icon: <FolderOpen size={20} /> },
          { label: 'Pending Approvals', path: '/green-zone/approvals', icon: <CheckSquare size={20} /> },
          { label: 'Mortality Request', path: '/green-zone/mortality', icon: <Skull size={20} /> },
          { label: 'Global Search Report', path: '/green-zone/report', icon: <Search size={20} /> },
        ];
      case 'MIS':
        return [
          { label: 'Dashboard', path: '/mis/dashboard', icon: <LayoutDashboard size={20} /> },
          { label: 'Yearly Budget Entry', path: '/mis/yearly-budget', icon: <DollarSign size={20} /> },
          { label: 'Monthly Expense Entry', path: '/mis/monthly-expense', icon: <TrendingUp size={20} /> },
          { label: 'My Entries', path: '/mis/my-entries', icon: <FolderOpen size={20} /> },
          { label: 'Pending Approvals', path: '/mis/approvals', icon: <CheckSquare size={20} /> },
          { label: 'Global Search Report', path: '/mis/report', icon: <Search size={20} /> },
        ];
      case 'TREES':
        const treeItems = [
          { label: '100M Trees Report', path: '/trees/report', icon: <TreePine size={20} /> },
        ];
        if (user?.role === UserRole.CAS_ADMIN) {
          treeItems.push(
            { label: 'Yearly Target Entry', path: '/trees/targets', icon: <Target size={20} /> },
            { label: 'Opening Balances', path: '/trees/opening-balances', icon: <Scale size={20} /> },
          );
        }
        return treeItems;
      case 'MASTERS':
        return [
          { label: 'Businesses', path: '/masters/businesses', icon: <Building size={20} /> },
          { label: 'Companies', path: '/masters/companies', icon: <Building size={20} /> },
          { label: 'Locations', path: '/masters/locations', icon: <MapPin size={20} /> },
          { label: 'Site Locations', path: '/masters/site-locations', icon: <MapPin size={20} /> },
          { label: 'Green Zones', path: '/masters/green-zones', icon: <TreePine size={20} /> },
          { label: 'User Master & Mapping', path: '/masters/users', icon: <Users size={20} /> },
          { label: 'System Settings', path: '/masters/settings', icon: <Settings size={20} /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  if (isMobile) {
    return (
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
        elevation={4}
      >
        <BottomNavigation
          showLabels
          value={activeModule}
          onChange={(event, newValue) => {
            setActiveModule(newValue);
            if (newValue === 'GREEN_ZONE') navigate('/green-zone/dashboard');
            if (newValue === 'MIS') navigate('/mis/dashboard');
            if (newValue === 'TREES') navigate('/trees/report');
            if (newValue === 'MASTERS') navigate('/masters/businesses');
          }}
        >
          <BottomNavigationAction label="Green Zone" value="GREEN_ZONE" icon={<TreePine size={20} />} />
          <BottomNavigationAction label="MIS" value="MIS" icon={<DollarSign size={20} />} />
          <BottomNavigationAction label="100M Trees" value="TREES" icon={<Target size={20} />} />
          {user?.role === UserRole.CAS_ADMIN && (
            <BottomNavigationAction label="Masters" value="MASTERS" icon={<Database size={20} />} />
          )}
        </BottomNavigation>
      </Paper>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 68, // below top header
          height: 'calc(100vh - 68px)',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '1px' }}>
          {activeModule.replace('_', ' ')}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 1.5 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  minHeight: 44, // 44px touch target
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: '#fff',
                    '& .MuiListItemIcon-root': { color: '#fff' },
                    '&:hover': { bgcolor: 'primary.main' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};
