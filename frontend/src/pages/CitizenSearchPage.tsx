import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useCitizensSearch, useCounties, useDistricts, useDivisions, useLocations } from '@hooks/useCitizens';
import type { CitizenSearchParams } from '@types';

export const CitizenSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useState<CitizenSearchParams>({
    page: 1,
    page_size: 25,
  });

  const [filters, setFilters] = useState({
    nationalId: '',
    fullName: '',
    county: '',
    district: '',
    division: '',
    location: '',
    registrationStatus: '',
  });

  // Location hierarchy queries
  const counties = useCounties(true);
  const districts = useDistricts(filters.county || null);
  const divisions = useDivisions(filters.county || null, filters.district || null);
  const locations = useLocations(
    filters.county || null,
    filters.district || null,
    filters.division || null
  );

  // Search query
  const search = useCitizensSearch(
    {
      national_id: filters.nationalId,
      full_name: filters.fullName,
      county: filters.county,
      district: filters.district,
      division: filters.division,
      location: filters.location,
      registration_status: (filters.registrationStatus as 'REGISTERED' | 'UNREGISTERED' | undefined) || undefined,
      ...searchParams,
    },
    // Enable search when user has entered at least one filter
    !!(filters.nationalId || filters.fullName || filters.county)
  );

  const handleFilterChange = useCallback(
    (field: string, value: string) => {
      setFilters((prev) => ({
        ...prev,
        [field]: value,
        // Clear dependent fields when parent changes
        ...(field === 'county' && { district: '', division: '', location: '' }),
        ...(field === 'district' && { division: '', location: '' }),
        ...(field === 'division' && { location: '' }),
      }));
      // Reset pagination
      setSearchParams((prev) => ({ ...prev, page: 1 }));
    },
    []
  );

  const handlePageChange = (_event: unknown, newPage: number) => {
    setSearchParams((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams((prev) => ({ ...prev, page_size: parseInt(event.target.value, 10), page: 1 }));
  };

  const handleSearch = () => {
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = !!(filters.nationalId || filters.fullName || filters.county);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Search Citizens
      </Typography>

      {/* Filter Card */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="National ID"
              type="text"
              value={filters.nationalId}
              onChange={(e) => handleFilterChange('nationalId', e.target.value)}
              placeholder="e.g., 12345678"
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Full Name"
              type="text"
              value={filters.fullName}
              onChange={(e) => handleFilterChange('fullName', e.target.value)}
              placeholder="e.g., John Doe"
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="County"
              value={filters.county}
              onChange={(e) => handleFilterChange('county', e.target.value)}
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">-- Select County --</option>
              {counties.data?.map((county) => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="District"
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              disabled={!filters.county}
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">-- Select District --</option>
              {districts.data?.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Division"
              value={filters.division}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              disabled={!filters.district}
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">-- Select Division --</option>
              {divisions.data?.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              disabled={!filters.division}
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">-- Select Location --</option>
              {locations.data?.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Registration Status"
              value={filters.registrationStatus}
              onChange={(e) => handleFilterChange('registrationStatus', e.target.value)}
              variant="outlined"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="">-- All Status --</option>
              <option value="UNREGISTERED">Unregistered</option>
              <option value="REGISTERED">Registered</option>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={!hasActiveFilters}
              fullWidth
              sx={{ py: 1 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Results */}
      {!hasActiveFilters ? (
        <Alert severity="info">Enter at least one filter and click Search to find citizens</Alert>
      ) : search.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : search.error ? (
        <Alert severity="error">Failed to load citizens. Please try again.</Alert>
      ) : search.data && search.data.results.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                <TableCell sx={{ fontWeight: 600 }}>National ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>County</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>District</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {search.data.results.map((citizen) => (
                <TableRow key={citizen.id} hover>
                  <TableCell>{citizen.national_id}</TableCell>
                  <TableCell>{citizen.full_name}</TableCell>
                  <TableCell>{citizen.county}</TableCell>
                  <TableCell>{citizen.district}</TableCell>
                  <TableCell>
                    <Chip
                      label={citizen.registration_status}
                      color={citizen.registration_status === 'REGISTERED' ? 'success' : 'warning'}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[25, 50, 100]}
            component="div"
            count={search.data.count}
            rowsPerPage={searchParams.page_size || 25}
            page={(searchParams.page || 1) - 1}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      ) : (
        <Alert severity="info">No citizens found matching your search criteria</Alert>
      )}
    </Box>
  );
};
