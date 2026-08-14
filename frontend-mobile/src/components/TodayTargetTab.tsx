import React from 'react';
import { Box, Card, Typography, LinearProgress, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';

export const TodayTargetTab: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['today-target'],
    queryFn: () => registrationService.getTodayTarget(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return <CircularProgress sx={{ mt: 4 }} />;
  if (error) return <Alert severity="error">Failed to load target</Alert>;

  const target = data?.target || 50;
  const registered = data?.registered_today || 0;
  const percentage = Math.round((registered / target) * 100);

  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ p: 3, mb: 2 }}>
        <Typography variant="h3" sx={{ mb: 2, textAlign: 'center' }}>
          Today's Target
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {percentage}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentage, 100)}
            sx={{
              height: 12,
              borderRadius: 6,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
              Registered
            </Typography>
            <Typography variant="h2" sx={{ color: 'white' }}>
              {registered}
            </Typography>
          </Card>

          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.9, mb: 1 }}>
              Target
            </Typography>
            <Typography variant="h2" sx={{ color: 'white' }}>
              {target}
            </Typography>
          </Card>
        </Box>

        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center' }}>
            Remaining: {Math.max(0, target - registered)}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
