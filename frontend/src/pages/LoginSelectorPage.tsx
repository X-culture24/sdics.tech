import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { PersonAdd as PersonAddIcon, AdminPanelSettings as AdminIcon } from '@mui/icons-material';

export const LoginSelectorPage: React.FC = () => {
  const navigate = useNavigate();

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
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 2,
            }}
          >
            SDICS
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 400,
            }}
          >
            Citizen Registration and Monitoring System
          </Typography>
        </Box>

        {/* Login Options */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {/* Officer Login */}
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <PersonAddIcon
                sx={{
                  fontSize: 48,
                  color: 'primary.main',
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: 'primary.main',
                }}
              >
                Registration Officer
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                Login with your National ID and PIN
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('/login/officer')}
                sx={{ py: 1 }}
              >
                Officer Login
              </Button>
            </Box>
          </Card>

          {/* Admin Login */}
          <Card
            sx={{
              p: 3,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
              },
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <AdminIcon
                sx={{
                  fontSize: 48,
                  color: 'secondary.main',
                  mb: 2,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: 'secondary.main',
                }}
              >
                Administrator
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                Login with your email and password
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                onClick={() => navigate('/login/admin')}
                sx={{ py: 1 }}
              >
                Admin Login
              </Button>
            </Box>
          </Card>
        </Box>

        {/* Footer */}
        <Paper
          sx={{
            mt: 4,
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
