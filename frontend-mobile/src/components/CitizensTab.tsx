import React, { useState } from 'react';
import { Box, Card, TextField, Typography, CircularProgress, Alert, MenuItem, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';

export const CitizensTab: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState('');
  const [query, setQuery] = useState('');

  const { data: counties } = useQuery({
    queryKey: ['counties'],
    queryFn: () => registrationService.getCounties(),
  });

  const { data: citizens, isLoading, error } = useQuery({
    queryKey: ['citizens', selectedCounty, query],
    queryFn: () =>
      selectedCounty
        ? registrationService.getCitizensByCounty(selectedCounty)
        : Promise.resolve({ results: [] }),
    enabled: !!selectedCounty,
  });

  const countyList = counties?.results || [];
  let filteredCitizens = citizens?.results || [];

  if (query) {
    filteredCitizens = filteredCitizens.filter(
      (c) =>
        c.national_id.includes(query) ||
        c.full_name.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Citizens List
        </Typography>

        <TextField
          select
          fullWidth
          label="Select County"
          value={selectedCounty}
          onChange={(e) => {
            setSelectedCounty(e.target.value);
            setQuery('');
          }}
          margin="normal"
        >
          <MenuItem value="">-- Select a county --</MenuItem>
          {countyList.map((county) => (
            <MenuItem key={county} value={county}>
              {county}
            </MenuItem>
          ))}
        </TextField>

        {selectedCounty && (
          <TextField
            fullWidth
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID or name"
            margin="normal"
          />
        )}

        {isLoading && <CircularProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error">Failed to load citizens</Alert>}

        {selectedCounty && filteredCitizens.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Found {filteredCitizens.length} citizens
            </Typography>
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredCitizens.map((citizen) => (
                <ListItem key={citizen.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}>
                  <ListItemText
                    primary={citizen.full_name}
                    secondary={
                      <>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          ID: {citizen.national_id}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {citizen.division}, {citizen.location}
                        </Typography>
                        <Chip
                          label={citizen.registration_status}
                          size="small"
                          color={citizen.registration_status === 'REGISTERED' ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {selectedCounty && filteredCitizens.length === 0 && !isLoading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No citizens found
          </Alert>
        )}
      </Card>
    </Box>
  );
};
