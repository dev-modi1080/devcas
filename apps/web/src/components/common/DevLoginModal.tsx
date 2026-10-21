import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { UserCheck, Shield, MapPin, Building, Briefcase } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '@cas/shared';

export const DevLoginModal: React.FC = () => {
  const { devModalOpen, setDevModalOpen, devLogin, user } = useAuth();
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (devModalOpen) {
      setLoading(true);
      api
        .get('/auth/dev-users')
        .then((res) => setDevUsers(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [devModalOpen]);

  const getRoleDescription = (role: UserRole) => {
    switch (role) {
      case UserRole.SITE_USER:
        return 'Site-level data entry for assigned locations';
      case UserRole.SITE_SUPERVISOR:
        return '1st-level approver (L1) & Site data entry';
      case UserRole.BU_ADMINISTRATOR:
        return '2nd-level approver (L2) for assigned businesses';
      case UserRole.CAS_ADMIN:
        return 'App Admin: 3rd-level approver (L3), all masters, 100M Trees';
      default:
        return '';
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.CAS_ADMIN:
        return { bg: '#EDE7F6', text: '#512DA8' };
      case UserRole.BU_ADMINISTRATOR:
        return { bg: '#E1F5FE', text: '#0277BD' };
      case UserRole.SITE_SUPERVISOR:
        return { bg: '#FFF3E0', text: '#E65100' };
      default:
        return { bg: '#E8F5E9', text: '#2E7D32' };
    }
  };

  return (
    <Dialog
      open={devModalOpen}
      onClose={() => user && setDevModalOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield color="#2670DC" size={24} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Select User (DEV_LOGIN Mode)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Switch between roles to test the full approval matrix and access scopes without credentials.
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {devUsers.map((u) => {
              const roleStyle = getRoleColor(u.role);
              const isSelected = user?.id === u.id;
              return (
                <Card
                  key={u.id}
                  sx={{
                    border: isSelected ? '2px solid #2670DC' : '1px solid #E6E8EF',
                    backgroundColor: isSelected ? '#F0F7FF' : 'background.paper',
                    borderRadius: 2,
                  }}
                >
                  <CardActionArea onClick={() => devLogin(u.id)} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {u.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {u.email} ({u.employeeCode})
                        </Typography>
                      </Box>
                      <Chip
                        label={u.role.replace('_', ' ')}
                        size="small"
                        sx={{
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.text,
                          fontWeight: 700,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                      {getRoleDescription(u.role)}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {u.userLocations?.map((loc: any) => (
                        <Chip
                          key={loc.locationId}
                          icon={<MapPin size={12} />}
                          label={loc.location.code}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {u.userBusinesses?.map((b: any) => (
                        <Chip
                          key={b.businessId}
                          icon={<Briefcase size={12} />}
                          label={b.business.code}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>
      {user && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDevModalOpen(false)} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};
