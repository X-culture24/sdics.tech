import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useDashboardSummary,
  useDashboardByCounty,
  useDashboardByDistrict,
  useDashboardByOfficer,
  useDashboardTrends,
} from '@hooks/useDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtext?: string;
  color?: string;
}> = ({ title, value, subtext, color = '#FF6B4A' }) => (
  <Card 
    sx={{ 
      height: '100%', 
      backgroundColor: '#1a2332',
      borderLeft: `4px solid ${color}`,
      '&:hover': { backgroundColor: '#212b3d' }
    }}
  >
    <CardContent sx={{ p: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#8b95a5', fontWeight: 500, mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', mb: 0.5 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      {subtext && (
        <Typography sx={{ fontSize: '0.7rem', color: '#8b95a5' }}>
          {subtext}
        </Typography>
      )}
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  // Data queries
  const summary = useDashboardSummary();
  const countyMetrics = useDashboardByCounty();
  const districtMetrics = useDashboardByDistrict(selectedCounty);
  const officerMetrics = useDashboardByOfficer();
  const trends = useDashboardTrends(7);

  if (summary.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (summary.error) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  const data = summary.data;
  const counties = countyMetrics.data || [];
  const districts = districtMetrics.data || [];
  const officers = officerMetrics.data || [];
  const trendData = trends.data || [];

  const uniqueCounties = [...new Set(counties.map((c: any) => c.county))];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            SDICS Dashboard
          </Typography>
          <Typography variant="caption" sx={{ color: '#8b95a5' }}>
            Updated 14:32 | HQ
          </Typography>
        </Box>
      </Box>

      {/* KPI Summary Cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="UNREGISTERED REMAINING"
            value={data?.unregistered_count || 0}
            subtext={`of ${data?.total_citizens || 0} total`}
            color="#FF6B4A"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="REGISTERED TODAY"
            value={data?.registrations_today || 0}
            subtext="target: 5.5k"
            color="#00D084"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="COMPLETION RATE"
            value={`${(data?.registration_percentage || 0).toFixed(1)}%`}
            subtext="of target"
            color="#00B8D4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="TARGET ACHIEVED"
            value={`${Math.min(100, (data?.registration_percentage || 0)).toFixed(1)}%`}
            subtext="of target"
            color="#FFA500"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="OFFICERS REPORTING"
            value={data?.total_officers || 0}
            subtext="of 9 ready"
            color="#9C27B0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="BELOW TARGET"
            value="0"
            subtext="0 officers pending"
            color="#FF6B4A"
          />
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 2, backgroundColor: '#1a2332', borderRadius: 0 }}>
        <Tabs
          value={tabValue}
          onChange={(_e, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid #2a3444',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#8b95a5',
              py: 1.5,
              minWidth: 'auto',
              '&.Mui-selected': {
                color: '#00D084',
                borderBottom: '2px solid #00D084',
              },
            },
          }}
        >
          <Tab label="Dashboard" />
          <Tab label="Officers" />
          <Tab label="Locations" />
          <Tab label="Reports" />
          <Tab label="Data" />
          <Tab label="Verify" />
          <Tab label="Exports" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {/* Performance by District */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    Performance by district
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['Today', 'This week', 'Last 7 days', 'Last 30 days'].map(period => (
                      <Typography key={period} variant="caption" sx={{ px: 1, py: 0.5, color: '#8b95a5', cursor: 'pointer', '&:hover': { color: 'white' } }}>
                        {period}
                      </Typography>
                    ))}
                  </Box>
                </Box>
                {counties.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={counties.slice(0, 12)}>
                      <CartesianGrid strokeDasharray="0" stroke="#2a3444" vertical={false} />
                      <XAxis dataKey="county" stroke="#8b95a5" style={{ fontSize: '0.75rem' }} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#8b95a5" style={{ fontSize: '0.75rem' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f1419', border: '1px solid #2a3444' }} />
                      <Bar dataKey="registered_count" fill="#00D084" name="Registered" />
                      <Bar dataKey="unregistered_count" fill="#FFA500" name="Unregistered" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" sx={{ color: '#8b95a5' }}>
                    No data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Conversion by County Map Placeholder */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1, height: '100%' }}>
              <CardContent>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
                  Conversion by county
                </Typography>
                <Box sx={{ height: 350, backgroundColor: '#0f1419', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2a3444' }}>
                  <Typography variant="caption" sx={{ color: '#8b95a5' }}>
                    Kenya map visualization
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Trends Chart */}
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1 }}>
              <CardContent>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
                  Registrations by hour - today
                </Typography>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="0" stroke="#2a3444" vertical={false} />
                      <XAxis dataKey="date" stroke="#8b95a5" style={{ fontSize: '0.75rem' }} />
                      <YAxis stroke="#8b95a5" style={{ fontSize: '0.75rem' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f1419', border: '1px solid #2a3444' }} />
                      <Line type="monotone" dataKey="count" stroke="#FF6B4A" strokeWidth={2} dot={{ fill: '#FF6B4A', r: 3 }} name="Registrations" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" sx={{ color: '#8b95a5' }}>
                    No data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Officers Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1 }}>
          <CardContent>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2 }}>
              Officers Performance
            </Typography>
            {officerMetrics.isLoading ? (
              <CircularProgress />
            ) : officers.length > 0 ? (
              <TableContainer sx={{ backgroundColor: '#0f1419', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#2a3444' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Officer</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Registrations</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Today</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Last Registered</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {officers.map((officer: any) => (
                      <TableRow key={officer.officer_id} sx={{ '&:hover': { backgroundColor: '#252d3d' }, borderBottom: '1px solid #2a3444' }}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          <Typography sx={{ fontWeight: 500 }}>{officer.officer_name}</Typography>
                          <Typography variant="caption" sx={{ color: '#8b95a5' }}>{officer.role}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{officer.registrations_count}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#00D084', fontWeight: 600 }}>{officer.registrations_today}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#8b95a5' }}>
                          {officer.last_registration_at ? new Date(officer.last_registration_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" sx={{ px: 1, py: 0.5, backgroundColor: '#00D084', color: '#0f1419', borderRadius: 0.5, fontWeight: 600 }}>
                            Active
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ color: '#8b95a5' }}>
                No officer data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Locations Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1, mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                By Location
              </Typography>
              <Select
                size="small"
                value={selectedCounty || ''}
                onChange={(e) => setSelectedCounty(e.target.value || null)}
                sx={{ width: 150, backgroundColor: '#0f1419' }}
              >
                <MenuItem value="">All districts</MenuItem>
                {uniqueCounties.map((county) => (
                  <MenuItem key={county} value={county}>
                    {county}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            {districtMetrics.isLoading ? (
              <CircularProgress />
            ) : districts.length > 0 ? (
              <TableContainer sx={{ backgroundColor: '#0f1419', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#2a3444' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Location</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Registered</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Unregistered</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#8b95a5' }}>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {districts.map((district: any, idx) => (
                      <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#252d3d' }, borderBottom: '1px solid #2a3444' }}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {district.district}, {district.county}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{district.total_count}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>{district.registered_count}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', color: '#FFA500' }}>{district.unregistered_count}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#00D084' }}>
                          {district.registration_percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" sx={{ color: '#8b95a5' }}>
                No location data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Reports, Data, Verify, Exports Tabs */}
      {[3, 4, 5, 6].map((idx) => (
        <TabPanel key={idx} value={tabValue} index={idx}>
          <Card sx={{ backgroundColor: '#1a2332', borderRadius: 1 }}>
            <CardContent>
              <Typography sx={{ color: '#8b95a5' }}>
                This section is coming soon
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      ))}
    </Box>
  );
};
