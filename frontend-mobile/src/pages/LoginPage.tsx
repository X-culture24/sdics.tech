import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, CircularProgress, Alert, Container } from '@mui/material';
import { useAuth } from '@hooks/useAuth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [nationalId, setNationalId] = useState('');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    
    if (!nationalId || !pin) {
      setLocalError('Please enter both National ID and PIN');
      return;
    }

    try {
      await login(nationalId, pin);
      navigate('/');
    } catch (err: any) {
      setLocalError(err.response?.data?.error?.message || 'Invalid credentials');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card sx={{ p: 3, width: '100%' }}>
          <Typography variant="h2" sx={{ mb: 3, textAlign: 'center' }}>
            SDICS
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}>
            Officer Login
          </Typography>

          {(error || localError) && <Alert severity="error" sx={{ mb: 2 }}>{error || localError}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="National ID"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              margin="normal"
              disabled={loading}
              inputProps={{ maxLength: 8 }}
            />

            <TextField
              fullWidth
              label="PIN"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              margin="normal"
              disabled={loading}
              inputProps={{ maxLength: 12 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              type="submit"
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', color: 'text.secondary' }}>
            Test: ID: 12345678 | PIN: 12345678
          </Typography>
        </Card>
      </Box>
    </Container>
  );
};
