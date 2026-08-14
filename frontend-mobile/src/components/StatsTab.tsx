import React from 'react';
import { Box, Card, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';

export const StatsTab: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['officer-stats'],
    queryFn: () => registrationService.getOfficerStats(),
    refetchInterval: 60000,
  });

  const { data: trends } = useQuery({
    queryKey: ['registration-trends'],
    queryFn: () => registrationService.getRegistrationTrends(7),
  });

  if (isLoading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Alert severity="error">Failed to load statistics</Alert>;

  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ p: 3, mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          My Statistics
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                Total Registrations
              </Typography>
              <Typography variant="h2" sx={{ color: 'white', mt: 1 }}>
                {stats?.results?.[0]?.registrations_count || 0}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6}>
            <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                Today
              </Typography>
              <Typography variant="h2" sx={{ color: 'white', mt: 1 }}>
                {stats?.results?.[0]?.registrations_today || 0}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {trends && trends.results && trends.results.length > 0 && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Last 7 Days
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px' }}>
              {trends.results.map((point: any, index: number) => (
                <Box key={index} sx={{ textAlign: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      height: `${(point.count / Math.max(...trends.results.map((p: any) => p.count))) * 100}px`,
                      backgroundColor: '#1976d2',
                      borderRadius: '4px 4px 0 0',
                      mx: 0.5,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                    {point.count}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
};
