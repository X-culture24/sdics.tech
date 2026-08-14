import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemText,
  Chip,
  GlobalStyles,
} from '@mui/material';
import { Settings as SettingsIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

// Dashboard pages
import { DashboardMainPage } from './dashboard/DashboardMainPage';
import { OfficersPage } from './dashboard/OfficersPage';
import { LocationsPage } from './dashboard/LocationsPage';
import { ReportsPage } from './dashboard/ReportsPage';
import { GapsPage } from './dashboard/GapsPage';
import { VerifyPage } from './dashboard/VerifyPage';
import { ExportsPage } from './dashboard/ExportsPage';

function formatTime(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

export const AdminDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { officer, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    'Dashboard',
    'Officers',
    'Locations',
    'Reports',
    'Gaps',
    'Verify',
    'Exports',
  ];

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return <DashboardMainPage />;
      case 1:
        return <OfficersPage />;
      case 2:
        return <LocationsPage />;
      case 3:
        return <ReportsPage />;
      case 4:
        return <GapsPage />;
      case 5:
        return <VerifyPage />;
      case 6:
        return <ExportsPage />;
      default:
        return <DashboardMainPage />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <GlobalStyles
        styles={{
          '@keyframes pulse': {
            '0%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.55, transform: 'scale(1.25)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
        }}
      />
      {/* AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: '#17120c', boxShadow: 'none', borderBottom: '1px solid #2a2317' }}>
        <Toolbar sx={{ minHeight: 48, py: 0.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#e8e3dc' }}>
            SDICS Dashboard
          </Typography>

          {/* Live status + user profile on the right */}
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Live · Updated indicator */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  backgroundColor: 'rgba(0, 208, 132, 0.1)',
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#00D084',
                    boxShadow: '0 0 6px #00D084',
                    animation: 'pulse 2s infinite',
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: '#00D084',
                    letterSpacing: 0.3,
                  }}
                >
                  live
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#8b95a5' }}>
                · updated {formatTime(lastUpdated)}
              </Typography>
            </Box>

            {/* Officer name */}
            <Typography variant="body2" sx={{ color: '#c8c3bc', fontSize: '0.82rem', fontWeight: 500 }}>
              {officer?.full_name}
            </Typography>

            {/* HQ Badge */}
            <Chip
              label="HQ"
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 208, 132, 0.12)',
                color: '#00D084',
                fontWeight: 700,
                fontSize: '0.72rem',
                height: 26,
                borderRadius: 1.2,
                border: '1px solid rgba(0, 208, 132, 0.3)',
              }}
            />

            <Avatar
              onClick={handleMenuOpen}
              sx={{
                cursor: 'pointer',
                backgroundColor: '#FF6B4A',
                width: 34,
                height: 34,
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {officer?.full_name.charAt(0).toUpperCase()}
            </Avatar>
          </Box>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemText
                primary={officer?.full_name}
                secondary={officer?.role}
                sx={{ fontSize: '0.8rem' }}
              />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <SettingsIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2">Settings</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>

        {/* Navigation Tabs */}
        <Box sx={{ backgroundColor: '#17120c', borderBottom: '1px solid #2a2317', overflowX: 'auto' }}>
          <Tabs
            value={tabValue}
            onChange={(_e, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons={false}
            TabIndicatorProps={{ sx: { display: 'none' } }}
            sx={{
              minHeight: 36,
              '& .MuiTabs-flexContainer': {
                gap: 0.25,
                px: 0.5,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: '#8b95a5',
                py: 0.75,
                px: 1.5,
                minWidth: 'auto',
                minHeight: 36,
                borderRadius: 0.75,
                mx: 0.25,
                my: 0.5,
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  color: '#00D084',
                  backgroundColor: 'rgba(0, 208, 132, 0.14)',
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  color: '#c8c3bc',
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab} />
            ))}
          </Tabs>
        </Box>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#0f1419',
          p: 2,
        }}
      >
        {renderTabContent()}
      </Box>
    </Box>
  );
};
