import React, { useState } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useCitizen } from '@hooks/useCitizens';
import { useRegisterCitizen, useTodaysRegistrationCount } from '@hooks/useRegistration';

export const CitizenRegisterPage: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [citizenId, setCitizenId] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const citizen = useCitizen(citizenId);
  const register = useRegisterCitizen();
  const todaysCount = useTodaysRegistrationCount(!!successMessage);

  const handleSearch = async () => {
    if (!nationalId.trim()) {
      alert('Please enter a national ID');
      return;
    }
    // This would typically search by national_id via an API call
    // For now, we'll assume the user provides a citizen ID
  };

  const handleRegister = async () => {
    if (!citizenId || !citizen.data) {
      alert('No citizen selected');
      return;
    }

    if (citizen.data.registration_status === 'REGISTERED') {
      alert('This citizen is already registered');
      return;
    }

    try {
      await register.mutateAsync(citizenId);
      setSuccessMessage(`Successfully registered ${citizen.data.full_name}`);
      setShowConfirm(false);
      setNationalId('');
      setCitizenId(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      alert(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Register Citizen
      </Typography>

      {successMessage && (
        <Alert
          severity="success"
          icon={<CheckIcon />}
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {/* Today's Progress Card */}
      <Card sx={{ p: 3, mb: 3, backgroundColor: '#E8F5E9', borderLeft: '4px solid #2D8659' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Today's Registrations
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {todaysCount.data?.count || 0}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Status
            </Typography>
            <Chip label="Officer Active" color="success" />
          </Grid>
        </Grid>
      </Card>

      {/* Search Card */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Search for Citizen
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="National ID"
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Enter citizen national ID"
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              fullWidth
              sx={{ py: 1 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Citizen Details */}
      {citizen.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : citizen.data ? (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Citizen Details
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  National ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {citizen.data.national_id}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {citizen.data.full_name}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Date of Birth
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {citizen.data.date_of_birth || 'N/A'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Registration Status
                </Typography>
                <Chip
                  label={citizen.data.registration_status}
                  color={citizen.data.registration_status === 'REGISTERED' ? 'success' : 'warning'}
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#F5F5F5' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {citizen.data.county} › {citizen.data.district} › {citizen.data.division} ›{' '}
                  {citizen.data.location}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color={citizen.data.registration_status === 'REGISTERED' ? 'success' : 'primary'}
                onClick={() => setShowConfirm(true)}
                fullWidth
                disabled={citizen.data.registration_status === 'REGISTERED' || register.isPending}
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                {register.isPending ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Registering...
                  </>
                ) : citizen.data.registration_status === 'REGISTERED' ? (
                  'Already Registered'
                ) : (
                  'Register Citizen'
                )}
              </Button>
            </Grid>
          </Grid>
        </Card>
      ) : null}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        <DialogTitle>Confirm Registration</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to register <strong>{citizen.data?.full_name}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleRegister} disabled={register.isPending}>
            {register.isPending ? 'Registering...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
