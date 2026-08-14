import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { verifyApi } from '@services/api/verify';

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

export const VerifyPage: React.FC = () => {
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const verifyQuery = useQuery({
    queryKey: ['verify'],
    queryFn: () => verifyApi.getVerifications(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const data = verifyQuery.data as any;

  return (
    <Box sx={{ pb: 4 }}>
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Citizens" value={data?.total_citizens || 0} color="#00D084" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Verified" value={data?.verified_count || 0} color="#00B8D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Unverified" value={data?.unverified_count || 0} color="#FFA500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Verification %" value={data?.verification_percentage?.toFixed(1) || 0} color="#FF6B4A" />
        </Grid>
      </Grid>

      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent>
          {verifyQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : verifyQuery.error ? (
            <Alert severity="error">Failed to load verification data: {verifyQuery.error instanceof Error ? verifyQuery.error.message : 'Unknown error'}</Alert>
          ) : data ? (
            <Box>
              <Typography sx={{ mb: 2, color: '#8b95a5', fontWeight: 600 }}>
                Verification Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: '#252d3d', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8b95a5', mb: 1 }}>
                      Verified Citizens
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#00D084' }}>
                      {data.verified_count}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, backgroundColor: '#252d3d', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#8b95a5', mb: 1 }}>
                      Unverified Citizens
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFA500' }}>
                      {data.unverified_count}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No verification data available
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a2332', color: 'white' }}>
          Reject Record
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#0f1419', pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              backgroundColor: '#1a2332',
              '& .MuiOutlinedInput-root': { color: '#8b95a5' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1a2332', p: 1.5 }}>
          <Button onClick={() => setRejectDialog(false)} sx={{ color: '#8b95a5' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#FF6B4A',
              '&:hover': { backgroundColor: '#E55A39' },
            }}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
