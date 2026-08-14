import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { useAuth } from '@hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginLoading, loginError } = useAuth();
  const [nationalId, setNationalId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nationalId.trim() || !pin.trim()) {
      setError('National ID and PIN are required');
      return;
    }

    try {
      await login({ national_id: nationalId, pin });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1B3A6B 0%, #2D8659 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              SDICS
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Citizen Registration and Monitoring System
            </Typography>
          </Box>

          {/* Error Alert */}
          {(error || loginError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || (loginError instanceof Error ? loginError.message : 'Login failed')}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="National ID"
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Enter your 8-digit national ID"
              disabled={loginLoading}
              margin="normal"
              variant="outlined"
              autoComplete="off"
            />

            <TextField
              fullWidth
              label="PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your system-assigned PIN"
              disabled={loginLoading}
              margin="normal"
              variant="outlined"
              autoComplete="off"
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loginLoading}
              sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
            >
              {loginLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Info Text */}
          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary', textAlign: 'center' }}>
            If you forgot your PIN or have account issues, contact your administrator.
          </Typography>
        </Card>

        {/* Footer */}
        <Paper
          sx={{
            mt: 3,
            p: 2,
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
          }}
        >
          <Typography variant="caption">
            © 2024 SDICS. All rights reserved.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};
