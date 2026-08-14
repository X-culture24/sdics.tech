import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Grid,
  Chip,
} from '@mui/material';
import { ContentCopy as CopyIcon, VpnKey as PinIcon } from '@mui/icons-material';
import { apiClient } from '@services/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Officer {
  id: number;
  full_name: string;
  national_id: string;
  role: string;
  status: string;
  phone: string;
  last_login: string | null;
}

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

export const OfficersPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [issuePinDialog, setIssuePinDialog] = useState(false);
  const [issuedPin, setIssuedPin] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch officers
  const officersQuery = useQuery({
    queryKey: ['officers', selectedRole, selectedStatus],
    queryFn: async () => {
      const response = await apiClient.client.get('/officers/', {
        params: {
          role: selectedRole !== 'all' ? selectedRole : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
        },
      });
      return response.data.results || response.data;
    },
  });

  // Issue PIN mutation
  const issuePinMutation = useMutation({
    mutationFn: async (officerId: number) => {
      const response = await apiClient.client.post(`/officers/${officerId}/issue_pin/`);
      return response.data;
    },
    onSuccess: (data) => {
      setIssuedPin(data.pin);
      queryClient.invalidateQueries({ queryKey: ['officers'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Failed to issue PIN');
    },
  });

  const handleIssuePIN = (officer: Officer) => {
    setSelectedOfficer(officer);
    setIssuePinDialog(true);
  };

  const handleConfirmIssuePIN = () => {
    if (selectedOfficer) {
      issuePinMutation.mutate(selectedOfficer.id);
    }
  };

  const handleCopyPin = () => {
    if (issuedPin) {
      navigator.clipboard.writeText(issuedPin);
      alert('PIN copied to clipboard');
    }
  };

  const handleClosePinDialog = () => {
    setIssuePinDialog(false);
    setIssuedPin(null);
    setSelectedOfficer(null);
  };

  const filteredOfficers = (officersQuery.data || []).filter((officer: Officer) =>
    officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    officer.national_id.includes(searchQuery)
  );

  const stats = {
    total: officersQuery.data?.length || 0,
    active: (officersQuery.data || []).filter((o: Officer) => o.status === 'ACTIVE').length,
    registration_officers: (officersQuery.data || []).filter((o: Officer) => o.role === 'REGISTRATION_OFFICER').length,
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Total Officers" value={stats.total} color="#00D084" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Active" value={stats.active} color="#00B8D4" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Registration Officers" value={stats.registration_officers} color="#FFA500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard title="Met Target" value="0" color="#9C27B0" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ backgroundColor: '#1a2332', mb: 2 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              backgroundColor: '#0f1419',
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: '#8b95a5',
                '& fieldset': { borderColor: '#2a3444' },
              },
            }}
          />
          <Select
            size="small"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            sx={{
              backgroundColor: '#0f1419',
              color: '#8b95a5',
              minWidth: 150,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
            }}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="REGISTRATION_OFFICER">Registration Officer</MenuItem>
            <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
            <MenuItem value="ADMINISTRATOR">Administrator</MenuItem>
          </Select>
          <Select
            size="small"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            sx={{
              backgroundColor: '#0f1419',
              color: '#8b95a5',
              minWidth: 120,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
            <MenuItem value="SUSPENDED">Suspended</MenuItem>
          </Select>
        </CardContent>
      </Card>

      {/* Officers Table */}
      <Card sx={{ backgroundColor: '#1a2332' }}>
        <CardContent sx={{ p: 0 }}>
          {officersQuery.isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : officersQuery.error ? (
            <Alert severity="error">Failed to load officers</Alert>
          ) : filteredOfficers.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#2a3444' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Officer</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Last Login</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOfficers.map((officer: Officer) => (
                    <TableRow key={officer.id} sx={{ borderBottom: '1px solid #2a3444', '&:hover': { backgroundColor: '#252d3d' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'white', fontWeight: 500 }}>
                        {officer.full_name}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {officer.national_id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {officer.role.replace('_', ' ')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        <Chip
                          label={officer.status}
                          size="small"
                          sx={{
                            backgroundColor: officer.status === 'ACTIVE' ? '#00D084' : '#FFA500',
                            color: '#0f1419',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {officer.phone}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                        {officer.last_login ? new Date(officer.last_login).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleIssuePIN(officer)}
                          sx={{ color: '#00D084' }}
                          title="Issue PIN"
                        >
                          <PinIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography sx={{ p: 3, color: '#8b95a5', textAlign: 'center' }}>
              No officers found
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Issue PIN Dialog */}
      <Dialog open={issuePinDialog} onClose={handleClosePinDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#1a2332', color: 'white' }}>
          {issuedPin ? 'PIN Generated' : 'Issue PIN'}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#0f1419', color: 'white', pt: 2 }}>
          {issuedPin ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#8b95a5' }}>
                New PIN for {selectedOfficer?.full_name}:
              </Typography>
              <TextField
                fullWidth
                value={issuedPin}
                variant="outlined"
                sx={{
                  mb: 2,
                  backgroundColor: '#1a2332',
                  '& .MuiOutlinedInput-root': { color: '#00D084', fontWeight: 700, fontSize: '1.2rem' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2a3444' },
                }}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCopyPin} size="small" sx={{ color: '#00D084' }}>
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                Share this PIN securely with the officer. It will not be displayed again.
              </Alert>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#8b95a5' }}>
              Are you sure you want to issue a new PIN to {selectedOfficer?.full_name}?
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#1a2332', p: 1.5 }}>
          <Button onClick={handleClosePinDialog} sx={{ color: '#8b95a5' }}>
            {issuedPin ? 'Done' : 'Cancel'}
          </Button>
          {!issuedPin && (
            <Button
              onClick={handleConfirmIssuePIN}
              variant="contained"
              sx={{
                backgroundColor: '#00D084',
                color: '#0f1419',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#00B870' },
              }}
              disabled={issuePinMutation.isPending}
            >
              {issuePinMutation.isPending ? 'Issuing...' : 'Issue PIN'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
