import React, { useState } from 'react';
import { Box, Card, Typography, Tab, Tabs, Container, CircularProgress } from '@mui/material';
import { useAuth } from '@hooks/useAuth';
import { TodayTargetTab } from '@components/TodayTargetTab';
import { RegisterTab } from '@components/RegisterTab';
import { CitizensTab } from '@components/CitizensTab';
import { StatsTab } from '@components/StatsTab';

export const DashboardPage: React.FC = () => {
  const { officer, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  if (!officer) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5', pb: 10 }}>
      {/* Header */}
      <Card sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Container maxWidth="sm">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                SDICS
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {officer.full_name}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              onClick={handleLogout}
              sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
            >
              Logout
            </Typography>
          </Box>
        </Container>
      </Card>

      {/* Content */}
      <Container maxWidth="sm" sx={{ flex: 1, pb: 2 }}>
        {currentTab === 0 && <TodayTargetTab />}
        {currentTab === 1 && <RegisterTab />}
        {currentTab === 2 && <CitizensTab />}
        {currentTab === 3 && <StatsTab />}
      </Container>

      {/* Bottom Tab Navigation */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }}>
        <Container maxWidth="sm" disableGutters>
          <Tabs
            value={currentTab}
            onChange={(_, value) => setCurrentTab(value)}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: '60px',
                fontSize: '0.75rem',
                py: 1,
              },
            }}
          >
            <Tab label="Today's Target" />
            <Tab label="Register" />
            <Tab label="Citizens" />
            <Tab label="Stats" />
          </Tabs>
        </Container>
      </Box>
    </Box>
  );
};
