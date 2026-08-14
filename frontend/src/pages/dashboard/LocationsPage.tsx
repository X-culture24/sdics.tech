import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Grid,
  LinearProgress,
} from '@mui/material';
import { useDashboardByCounty, useDashboardByDistrict } from '@hooks/useDashboard';

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

export const LocationsPage: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  const countyMetrics = useDashboardByCounty();
  const districtMetrics = useDashboardByDistrict(selectedCounty);

  const counties = countyMetrics.data || [];
  const districts = districtMetrics.data || [];
  const uniqueCounties = [...new Set(counties.map((c: any) => c.county))];

  const stats = {
    total_locations: counties.length,
    total_registered: counties.reduce((sum: number, c: any) => sum + (c.registered_count || 0), 0),
    total_unregistered: counties.reduce((sum: number, c: any) => sum + (c.unregistered_count || 0), 0),
  };

  const getProgressPercentage = (registered: number, total: number) => {
    return total > 0 ? Math.round((registered / total) * 100) : 0;
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Locations" value={stats.total_locations} color="#00D084" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Registered" value={stats.total_registered.toLocaleString()} color="#00B8D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Unregistered"
            value={stats.total_unregistered.toLocaleString()}
            color="#FFA500"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Completion"
            value={`${(stats.total_registered / (stats.total_registered + stats.total_unregistered) * 100 || 0).toFixed(1)}%`}
            color="#9C27B0"
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ backgroundColor: '#1a2332', mb: 2 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Select
            size="small"
            value={selectedCounty || ''}
            onChange={(e) => setSelectedCounty(e.target.value || null)}
            sx={{
              backgroundColor: '#0f1419',
              color: '#8b95a5',
              minWidth: 200,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
            }}
          >
            <MenuItem value="">All Counties</MenuItem>
            {uniqueCounties.map((county: string) => (
              <MenuItem key={county} value={county}>
                {county}
              </MenuItem>
            ))}
          </Select>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" sx={{ color: '#8b95a5' }}>
            {selectedCounty ? `${selectedCounty}` : 'View by County'}
          </Typography>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent sx={{ p: 0 }}>
          {countyMetrics.isLoading || (selectedCounty && districtMetrics.isLoading) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : countyMetrics.error ? (
            <Alert severity="error">Failed to load location data</Alert>
          ) : !selectedCounty && counties.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2a3444' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>County</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Registered
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Unregistered
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Progress
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {counties.map((county: any, idx: number) => {
                    const progress = getProgressPercentage(county.registered_count, county.total_count);
                    return (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #2a3444', '&:hover': { backgroundColor: '#252d3d' } }}>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'white', fontWeight: 500, cursor: 'pointer' }} onClick={() => setSelectedCounty(county.county)}>
                          {county.county}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                          {county.total_count.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>
                          {county.registered_count.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#FFA500' }}>
                          {county.unregistered_count.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', pr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                  height: 6,
                                  backgroundColor: '#2a3444',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: progress > 50 ? '#00D084' : '#FFA500',
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>
                          {progress}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : selectedCounty && districts.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2a3444' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>District</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Registered
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Unregistered
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      Progress
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>
                      %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {districts.map((district: any, idx: number) => {
                    const progress = getProgressPercentage(district.registered_count, district.total_count);
                    return (
                      <TableRow key={idx} sx={{ borderBottom: '1px solid #2a3444', '&:hover': { backgroundColor: '#252d3d' } }}>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'white', fontWeight: 500 }}>
                          {district.district || 'Unknown'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                          {district.total_count.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>
                          {district.registered_count.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#FFA500' }}>
                          {district.unregistered_count.toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', pr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                  height: 6,
                                  backgroundColor: '#2a3444',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: progress > 50 ? '#00D084' : '#FFA500',
                                  },
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>
                          {progress}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No location data available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
