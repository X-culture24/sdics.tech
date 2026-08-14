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
import { exportsApi } from '@services/api/exports';

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

export const ExportsPage: React.FC = () => {
  const exportsQuery = useQuery({
    queryKey: ['exports'],
    queryFn: () => exportsApi.getExports(100),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const exportsData = exportsQuery.data as any || {};
  const exports = exportsData.exports || [];

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Registrations Exported" value={exports.length} color="#00D084" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Export Count" value={exportsData.count || 0} color="#00B8D4" />
        </Grid>
      </Grid>

      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent sx={{ p: 0 }}>
          {exportsQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : exportsQuery.error ? (
            <Alert severity="error">Failed to load export data: {exportsQuery.error instanceof Error ? exportsQuery.error.message : 'Unknown error'}</Alert>
          ) : exports && exports.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2a3444' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Citizen Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Officer</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Registered At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exports.slice(0, 20).map((item: any, idx: number) => (
                    <TableRow key={idx} sx={{ borderBottom: '1px solid #2a3444', '&:hover': { backgroundColor: '#252d3d' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#00D084', fontWeight: 500 }}>
                        {item.citizen_name || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {item.officer_name || 'System'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {new Date(item.registered_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No export data available
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
