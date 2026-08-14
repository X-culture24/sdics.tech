import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { gapsApi } from '@services/api/gaps';

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

export const GapsPage: React.FC = () => {
  const gapsQuery = useQuery({
    queryKey: ['gaps'],
    queryFn: () => gapsApi.getGaps(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const gapsData = gapsQuery.data as any || {};
  const gaps = gapsData.gaps || [];
  const totalGaps = gapsData.total_gaps || 0;

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Data Gaps" value={totalGaps} color="#FF6B4A" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Divisions with Gaps" value={gaps.length} color="#FFA500" />
        </Grid>
      </Grid>

      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent sx={{ p: 0 }}>
          {gapsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : gapsQuery.error ? (
            <Alert severity="error">Failed to load gaps data: {gapsQuery.error instanceof Error ? gapsQuery.error.message : 'Unknown error'}</Alert>
          ) : gaps && gaps.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2a3444' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Division</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gaps.slice(0, 50).map((gap: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #2a3444', '&:hover': { backgroundColor: '#252d3d' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'white', fontWeight: 500 }}>
                        {gap.division || 'Unknown'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#FF6B4A', fontWeight: 600 }}>
                        {gap.status || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No gaps data available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
