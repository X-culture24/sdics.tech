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
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { apiClient } from '@services/api/client';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@sdics.tech');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      // Call admin login endpoint
      console.log('[AdminLogin] Attempting login with email:', email);
      const response = await apiClient.adminLogin(email, password);
      console.log('[AdminLogin] Login successful, response:', response);
      
      // Verify token was stored
      const storedOfficer = apiClient.getStoredOfficer();
      const accessToken = localStorage.getItem('sdics_access_token');
      console.log('[AdminLogin] Stored officer:', storedOfficer);
      console.log('[AdminLogin] Access token exists:', !!accessToken);
      
      if (response && storedOfficer) {
        console.log('[AdminLogin] Navigating to root /');
        navigate('/', { replace: true });
      } else {
        setError('Login succeeded but tokens not stored properly');
      }
    } catch (err) {
      console.error('[AdminLogin] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
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
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/login')}
          sx={{
            color: 'white',
            mb: 3,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back
        </Button>

        <Card
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', mb: 1 }}>
              SDICS
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Administrator Login
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              margin="normal"
              variant="outlined"
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              margin="normal"
              variant="outlined"
              autoComplete="current-password"
            />

            <Button
              fullWidth
              variant="contained"
              color="secondary"
              type="submit"
              disabled={loading}
              sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Demo Credentials */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#F5F5F5', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 1 }}>
              Demo Credentials:
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Email: admin@sdics.tech
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
              Password: Admin@123456
            </Typography>
          </Box>
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
