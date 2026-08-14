import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Tabs,
  Tab,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { officer, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  // Get current tab based on route
  const getCurrentTab = (): string => {
    if (location.pathname.includes('citizens/register')) return 'register';
    if (location.pathname.includes('citizens/search')) return 'search';
    if (location.pathname.includes('settings')) return 'settings';
    return 'dashboard';
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    switch (newValue) {
      case 'register':
        navigate('/citizens/register');
        break;
      case 'search':
        navigate('/citizens/search');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: 'primary.main',
          zIndex: 10,
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {import.meta.env.VITE_APP_TITLE || 'SDICS'}
          </Typography>

          {/* Officer Profile Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              onClick={handleMenuOpen}
              sx={{
                cursor: 'pointer',
                backgroundColor: 'secondary.main',
                width: 40,
                height: 40,
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
              <ListItemText primary={officer?.full_name} secondary={officer?.role} />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <SettingsIcon sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          backgroundColor: 'background.default',
          overflow: 'auto',
          pb: 8, // Leave space for bottom tabs
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom Tab Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 9,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab
            icon={<DashboardIcon />}
            label="Dashboard"
            value="dashboard"
            iconPosition="top"
          />
          <Tab
            icon={<PersonAddIcon />}
            label="Register"
            value="register"
            iconPosition="top"
          />
          <Tab
            icon={<PeopleIcon />}
            label="Search"
            value="search"
            iconPosition="top"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            value="settings"
            iconPosition="top"
          />
        </Tabs>
      </Paper>
    </Box>
  );
};
