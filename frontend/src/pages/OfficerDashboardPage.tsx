import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PersonAdd as RegisterIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '@hooks/useAuth';
import { useDashboardSummary, useDashboardByOfficer } from '@hooks/useDashboard';
import { useNavigate } from 'react-router-dom';
import { CitizenRegisterPage } from './CitizenRegisterPage';
import { CitizenSearchPage } from './CitizenSearchPage';
import { SettingsPage } from './SettingsPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

export const OfficerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { officer, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const summary = useDashboardSummary(currentTab === 0);
  const officersMetrics = useDashboardByOfficer(undefined, currentTab === 0);
  const summaryData = summary.data as any;

  let officerStats: any = null;
  if (officer && officersMetrics.data && Array.isArray(officersMetrics.data)) {
    officerStats = officersMetrics.data.find((o: any) =>
      (o.officer_id === officer.id) ||
      (o.officer_name === officer.full_name)
    ) || null;
  }

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600 }}>
            {import.meta.env.VITE_APP_TITLE || 'SDICS Officer'}
          </Typography>

          {/* Officer Profile */}
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

          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">{officer?.full_name}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Tab Navigation */}
      <Paper sx={{ borderRadius: 0 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
            },
          }}
        >
          <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
          <Tab label="Register" icon={<RegisterIcon />} iconPosition="start" />
          <Tab label="Search" icon={<SearchIcon />} iconPosition="start" />
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Container maxWidth="sm" sx={{ flex: 1, py: 2, px: { xs: 1, sm: 2 } }}>
        {/* Dashboard Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Paper sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                Officer Info
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                {officer?.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {officer?.role}
              </Typography>
            </Paper>

            {summary.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : summary.error ? (
              <Alert severity="error">Failed to load stats</Alert>
            ) : (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Quick Stats
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Total Registrations
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {(officerStats?.registrations_count ?? summaryData?.registered_count ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Today
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {(officerStats?.registrations_today ?? summaryData?.registrations_today ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Completion
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0288d1' }}>
                      {(summaryData?.registration_percentage ?? 0).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Remaining
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                      {(summaryData?.unregistered_count ?? 0).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                National Overview
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <Box sx={{ p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Total Citizens
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1565c0' }}>
                    {(summaryData?.total_citizens ?? 0).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, backgroundColor: '#fce4ec', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Officers Active
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ad1457' }}>
                    {summaryData?.total_officers ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </TabPanel>

        {/* Register Tab */}
        <TabPanel value={currentTab} index={1}>
          <CitizenRegisterPage />
        </TabPanel>

        {/* Search Tab */}
        <TabPanel value={currentTab} index={2}>
          <CitizenSearchPage />
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={currentTab} index={3}>
          <SettingsPage />
        </TabPanel>
      </Container>
    </Box>
  );
};
