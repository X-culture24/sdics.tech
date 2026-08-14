import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@services/api/reports';

const KPICard: React.FC<{
  title: string;
  value: string | number;
  color?: string;
}> = ({ title, value, color = '#FF6B4A' }) => (
  <Card sx={{ backgroundColor: '#1a2332', borderLeft: `4px solid ${color}` }}>
    <CardContent sx={{ p: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#8b95a5', fontWeight: 500, mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </CardContent>
  </Card>
);

export const ReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('daily_breakdown');

  const reportsQuery = useQuery({
    queryKey: ['reports', selectedReport],
    queryFn: () => reportsApi.getReports(selectedReport),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const data = reportsQuery.data as any;

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Registrations Today" value={data?.registrations_today || 0} color="#00D084" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Registered" value={data?.total_registered || 0} color="#00B8D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Unregistered" value={data?.total_unregistered || 0} color="#FFA500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Generated"
            value={data?.date ? new Date(data.date).toLocaleDateString() : 'N/A'}
            color="#FF6B4A"
          />
        </Grid>
      </Grid>

      <Card sx={{ backgroundColor: '#1a2332', mb: 2 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Select
            size="small"
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            sx={{
              backgroundColor: '#0f1419',
              color: '#8b95a5',
              minWidth: 200,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
            }}
          >
            <MenuItem value="daily_breakdown">Daily Breakdown</MenuItem>
            <MenuItem value="officer_performance">Officer Performance</MenuItem>
            <MenuItem value="location_conversion">Location Conversion</MenuItem>
          </Select>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            sx={{
              borderColor: '#2a3444',
              color: '#8b95a5',
              textTransform: 'none',
              '&:hover': { borderColor: '#00D084', color: '#00D084' },
            }}
          >
            Export
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent sx={{ p: 2 }}>
          {reportsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : reportsQuery.error ? (
            <Alert severity="error">Failed to load reports: {reportsQuery.error instanceof Error ? reportsQuery.error.message : 'Unknown error'}</Alert>
          ) : data ? (
            <Box>
              <Typography sx={{ mb: 2, color: '#8b95a5', fontWeight: 600 }}>
                {selectedReport === 'daily_breakdown' ? 'Daily Breakdown Report' : selectedReport === 'officer_performance' ? 'Officer Performance Report' : 'Location Conversion Report'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: '#252d3d', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8b95a5', mb: 1 }}>
                      Registrations Today
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#00D084' }}>
                      {data.registrations_today}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: '#252d3d', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8b95a5', mb: 1 }}>
                      Registered Citizens
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#00B8D4' }}>
                      {data.total_registered}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No report data available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
