import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import { useAuth } from '@hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { officer, changePin, changePinLoading, changePinError } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePIN = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPin || !newPin || !confirmPin) {
      setError('All fields are required');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and confirmation PIN do not match');
      return;
    }

    if (newPin.length < 8 || newPin.length > 12) {
      setError('PIN must be between 8 and 12 characters');
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError('PIN must contain only digits');
      return;
    }

    try {
      await changePin({ currentPin, newPin });
      setSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Settings
      </Typography>

      {/* Profile Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Officer Profile
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Full Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {officer?.full_name}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                National ID
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {officer?.national_id}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Role
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {officer?.role}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                {officer?.status}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Phone
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {officer?.phone}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Last Login
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {officer?.last_login ? new Date(officer.last_login).toLocaleString() : 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Change PIN Section */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Change PIN
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
              PIN changed successfully
            </Alert>
          )}

          {(error || changePinError) && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error || (changePinError instanceof Error ? changePinError.message : 'Failed to change PIN')}
            </Alert>
          )}

          <form onSubmit={handleChangePIN}>
            <TextField
              fullWidth
              type="password"
              label="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              disabled={changePinLoading}
              margin="normal"
              variant="outlined"
            />

            <TextField
              fullWidth
              type="password"
              label="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              disabled={changePinLoading}
              margin="normal"
              variant="outlined"
              helperText="Must be 8-12 digits"
            />

            <TextField
              fullWidth
              type="password"
              label="Confirm New PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              disabled={changePinLoading}
              margin="normal"
              variant="outlined"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={changePinLoading}
              fullWidth
              sx={{ mt: 3, py: 1.5 }}
            >
              {changePinLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Changing PIN...
                </>
              ) : (
                'Change PIN'
              )}
            </Button>
          </form>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            For security reasons, you will be logged out and asked to login with your new PIN.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
