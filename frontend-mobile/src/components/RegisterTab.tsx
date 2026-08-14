import React, { useState } from 'react';
import { Box, Card, TextField, Button, Typography, CircularProgress, Alert, MenuItem } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const RegisterTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search-citizens', query],
    queryFn: () => (query ? registrationService.searchCitizens(query) : Promise.resolve({ results: [] })),
    enabled: query.length > 2,
  });

  const { mutate: register, isPending: isRegistering } = useMutation({
    mutationFn: (citizenId: number) => registrationService.registerCitizen(citizenId),
    onSuccess: () => {
      setSuccessMessage('Registration completed successfully!');
      setQuery('');
      setSelectedCitizen(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Registration failed');
    },
  });

  const citizens = searchResults?.results || [];

  return (
    <Box sx={{ mt: 2 }}>
      {successMessage && (
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      <Card sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Register Citizen
        </Typography>

        <TextField
          fullWidth
          label="Search by National ID or Name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedCitizen(null);
          }}
          placeholder="Enter at least 3 characters"
          margin="normal"
          disabled={isSearching}
        />

        {isSearching && <CircularProgress sx={{ mt: 2 }} size={24} />}

        {citizens.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Found {citizens.length} citizens
            </Typography>
            <MenuItem
              select
              fullWidth
              value={selectedCitizen?.id?.toString() || ''}
              onChange={(e) => setSelectedCitizen(citizens.find((c) => c.id === parseInt(e.target.value)))}
              sx={{ mb: 2 }}
              component={TextField}
            >
              <MenuItem value="">Select a citizen</MenuItem>
              {citizens.map((citizen) => (
                <MenuItem key={citizen.id} value={citizen.id}>
                  {citizen.full_name} ({citizen.national_id})
                </MenuItem>
              ))}
            </MenuItem>
          </Box>
        )}

        {selectedCitizen && (
          <Card sx={{ p: 2, mb: 2, backgroundColor: '#f0f4ff', border: '2px solid #1976d2' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Name:</strong> {selectedCitizen.full_name}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>National ID:</strong> {selectedCitizen.national_id}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Location:</strong> {selectedCitizen.county}, {selectedCitizen.district}
            </Typography>
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={isRegistering}
              onClick={() => register(selectedCitizen.id)}
            >
              {isRegistering ? <CircularProgress size={24} /> : 'Confirm Registration'}
            </Button>
          </Card>
        )}

        {query.length > 2 && citizens.length === 0 && !isSearching && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No unregistered citizens found
          </Alert>
        )}
      </Card>
    </Box>
  );
};
