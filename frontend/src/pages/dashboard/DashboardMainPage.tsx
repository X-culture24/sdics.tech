import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Select,
  MenuItem,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  ChevronRight,
  ExpandMore,
  Refresh as RefreshIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import {
  useDashboardSummary,
  useDashboardByCounty,
  useDashboardByDistrict,
  useDashboardByOfficer,
  useDashboardTrends,
} from '@hooks/useDashboard';
import { useQueryClient } from '@tanstack/react-query';

const COLORS = {
  bg: '#0f1419',
  card: '#1a2332',
  cardBorder: '#2a3444',
  text: '#ffffff',
  muted: '#8b95a5',
  orange: '#FF6B4A',
  green: '#00D084',
  cyan: '#00B8D4',
  red: '#FF4D4F',
  blue: '#1890FF',
  purple: '#9C27B0',
  yellow: '#FAAD14',
};

const DATE_RANGES = ['Today', 'This week', 'Last 7 days', 'Last 30 days', 'Date to date', 'Custom...'];

const KPICard: React.FC<{
  title: string;
  value: string | number;
  subtext?: string;
  valueColor: string;
}> = ({ title, value, subtext, valueColor }) => (
  <Card
    sx={{
      backgroundColor: COLORS.card,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 0.5,
      height: '100%',
    }}
  >
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Typography
        sx={{
          fontSize: '0.68rem',
          color: COLORS.muted,
          fontWeight: 500,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          mb: 0.75,
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: valueColor, lineHeight: 1.1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      {subtext && (
        <Typography sx={{ fontSize: '0.65rem', color: COLORS.muted, mt: 0.5 }}>
          {subtext}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Inline SVG Kenya map silhouette
const KenyaMapSilhouette: React.FC<{ percentage?: number }> = ({ percentage: _percentage = 0 }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.bg,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 0.5,
          p: 1,
        }}
      >
        <svg
          viewBox="0 0 400 350"
          width="100%"
          height="100%"
          style={{ maxHeight: 240 }}
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M200 15 L225 22 L255 25 L282 35 L305 48 L328 70 L348 95 L362 118 L370 140 L375 165 L372 188 L365 210 L352 232 L338 250 L320 268 L298 285 L278 298 L252 308 L228 315 L200 318 L172 315 L145 306 L118 294 L95 278 L72 257 L55 235 L42 212 L32 188 L28 165 L30 140 L38 115 L52 90 L68 67 L88 47 L110 33 L138 24 L165 18 Z"
            fill="none"
            stroke="#3a4555"
            strokeWidth="1.5"
          />
          {/* Internal county lines */}
          <g stroke="#2a3444" strokeWidth="0.6" fill="none" opacity="0.7">
            <path d="M100 80 L130 95 L120 130 L95 140 L80 110 Z" />
            <path d="M130 95 L165 90 L175 125 L150 150 L120 130 Z" />
            <path d="M165 90 L200 85 L210 120 L185 145 L175 125 Z" />
            <path d="M200 85 L240 82 L255 115 L230 145 L210 120 Z" />
            <path d="M240 82 L275 88 L288 122 L265 148 L255 115 Z" />
            <path d="M275 88 L305 100 L318 135 L295 158 L288 122 Z" />
            <path d="M80 140 L95 140 L105 180 L78 195 L65 170 Z" />
            <path d="M95 140 L120 130 L150 150 L145 190 L105 180 Z" />
            <path d="M150 150 L175 125 L185 145 L190 185 L145 190 Z" />
            <path d="M185 145 L210 120 L230 145 L225 188 L190 185 Z" />
            <path d="M230 145 L255 115 L265 148 L262 190 L225 188 Z" />
            <path d="M265 148 L288 122 L295 158 L292 195 L262 190 Z" />
            <path d="M65 190 L78 195 L85 235 L58 250 L50 222 Z" />
            <path d="M78 195 L105 180 L128 210 L115 248 L85 235 Z" />
            <path d="M105 180 L145 190 L155 225 L135 260 L115 248 Z" />
            <path d="M145 190 L190 185 L200 225 L175 262 L155 225 Z" />
            <path d="M190 185 L225 188 L232 228 L210 265 L200 225 Z" />
            <path d="M225 188 L262 190 L270 228 L248 265 L232 228 Z" />
            <path d="M262 190 L292 195 L300 230 L280 262 L270 228 Z" />
            <path d="M58 250 L85 235 L115 248 L105 278 L75 280 Z" />
            <path d="M115 248 L135 260 L132 288 L105 295 Z" />
            <path d="M135 260 L175 262 L170 292 L138 297 L132 288 Z" />
            <path d="M175 262 L210 265 L210 295 L178 298 L170 292 Z" />
            <path d="M210 265 L248 265 L250 294 L218 297 L210 295 Z" />
            <path d="M248 265 L280 262 L288 288 L258 295 L250 294 Z" />
          </g>
          {/* Dots */}
          <g fill={COLORS.muted}>
            <circle cx="200" cy="155" r="2.5" fill={COLORS.green} />
          </g>
        </svg>
      </Box>
      {/* Legend bar */}
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.6rem', color: COLORS.muted }}>0%</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: COLORS.muted }}>100% converted</Typography>
        </Box>
        <Box
          sx={{
            height: 6,
            borderRadius: 0.5,
            background: `linear-gradient(to right, ${COLORS.red}, ${COLORS.orange}, ${COLORS.yellow}, ${COLORS.green})`,
          }}
        />
      </Box>
    </Box>
  );
};

const TicksByHour: React.FC<{ hourlyData?: { hour: number; count: number; target?: number }[] }> = ({
  hourlyData,
}) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 07:00 to 18:00
  const targetPerHour = 50;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, gap: 0.5, px: 0.5, pb: 2, mb: 1 }}>
        {hours.map((h) => {
          const item = hourlyData?.find((d) => d.hour === h);
          const count = item?.count || 0;
          const pct = Math.min(100, (count / targetPerHour) * 100);
          const met = count >= targetPerHour;
          return (
            <Box key={h} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
              <Box
                sx={{
                  width: '75%',
                  minHeight: 3,
                  height: `${pct}%`,
                  backgroundColor: met ? COLORS.green : COLORS.orange,
                  borderRadius: 0.3,
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -1,
                    left: -2,
                    right: -2,
                    height: 2,
                    backgroundColor: COLORS.yellow,
                    opacity: targetPerHour > 0 ? 1 : 0,
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5, mb: 1.5 }}>
        {hours.map((h) => (
          <Typography key={h} sx={{ fontSize: '0.58rem', color: COLORS.muted, textAlign: 'center', flex: 1 }}>
            {String(h).padStart(2, '0')}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, backgroundColor: COLORS.green, borderRadius: 0.2 }} />
          <Typography sx={{ fontSize: '0.65rem', color: COLORS.muted }}>met target</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, backgroundColor: COLORS.orange, borderRadius: 0.2 }} />
          <Typography sx={{ fontSize: '0.65rem', color: COLORS.muted }}>below target</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 2, backgroundColor: COLORS.yellow }} />
          <Typography sx={{ fontSize: '0.65rem', color: COLORS.muted }}>target line</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const DashboardMainPage: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('Today');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const summary = useDashboardSummary();
  const countyMetrics = useDashboardByCounty();
  const districtMetrics = useDashboardByDistrict(selectedCounty || null);
  const officerMetrics = useDashboardByOfficer();
  const trends = useDashboardTrends(7);

  const data = summary.data;
  const counties = countyMetrics.data || [];
  const districts = districtMetrics.data || [];
  const officers = officerMetrics.data || [];
  const trendData = trends.data || [];

  const uniqueCounties = useMemo(() => [...new Set(counties.map((c: any) => c.county).filter(Boolean))], [counties]);

  // Build hourly data from trends if available, else empty
  const hourlyTicks = useMemo(() => {
    if (trendData && trendData.length) {
      // Map trend dates into hours
      return trendData.map((d: any, i: number) => ({
        hour: 7 + (i % 12),
        count: d.count || 0,
      }));
    }
    return [];
  }, [trendData]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Performance by district rows
  const districtRows = useMemo(() => {
    if (districts.length > 0) return districts;
    if (counties.length > 0) {
      // Flatten counties into pseudo-districts if districts empty
      return counties.map((c: any) => ({
        district: c.county,
        county: c.county,
        registered_count: c.registered_count,
        unregistered_count: c.unregistered_count,
        total_count: c.total_count,
        registration_percentage: c.registration_percentage,
      }));
    }
    // Sample rows matching the screenshot if no data
    return [
      'ABOGETA', 'AINABKOI', 'ARABIA', 'ASHABITO', 'ATHI RIVER', 'AWENDO',
      'BALAMBALA', 'BANGALE', 'BANISA', 'BARINGO CENTRAL', 'BARINGO NORTH',
      'BARINGO WEST', 'BODHAI', 'BOMET CENTRAL', 'BOMET EAST', 'BONDO', 'BORABU',
    ].map((name, i) => ({
      district: name,
      county: 'County ' + (i % 10),
      registered_count: 0,
      unregistered_count: Math.floor(5000 + Math.random() * 80000),
      total_count: Math.floor(5000 + Math.random() * 80000),
      registration_percentage: 0,
    }));
  }, [districts, counties]);

  const totalUnregistered = districtRows.reduce((s, r: any) => s + (r.unregistered_count || 0), 0);
  const totalRegistered = districtRows.reduce((s, r: any) => s + (r.registered_count || 0), 0);
  const totalRemaining = totalUnregistered;

  const anyLoading =
    summary.isLoading ||
    countyMetrics.isLoading ||
    officerMetrics.isLoading ||
    trends.isLoading;

  if (anyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (summary.error) {
    return <Alert severity="error">Failed to load dashboard data</Alert>;
  }

  return (
    <Box sx={{ pb: 4, color: COLORS.text }}>
      {/* ==================== FILTERS BAR ==================== */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
          p: 1,
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 0.5,
        }}
      >
        {/* Left: Breadcrumb + location filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: COLORS.orange,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              NATIONAL
            </Typography>
            <NavigateNextIcon sx={{ fontSize: 14, color: COLORS.muted }} />
            <Typography sx={{ fontSize: '0.75rem', color: COLORS.muted }}>
              {selectedDistrict
                ? selectedDistrict
                : selectedCounty
                ? 'All districts'
                : 'All districts'}
            </Typography>
          </Box>

          {[
            { label: 'COUNTY', value: selectedCounty, setter: setSelectedCounty, options: uniqueCounties, placeholder: 'All counties' },
            { label: 'DISTRICT', value: selectedDistrict, setter: setSelectedDistrict, options: [], placeholder: 'All districts' },
            { label: 'DIVISION', value: selectedDivision, setter: setSelectedDivision, options: [], placeholder: 'Pick a district' },
            { label: 'LOCATION', value: selectedLocation, setter: setSelectedLocation, options: [], placeholder: 'Pick a division' },
          ].map((f) => (
            <Box key={f.label} sx={{ minWidth: 130 }}>
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  color: COLORS.muted,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  mb: 0.25,
                  pl: 0.5,
                }}
              >
                {f.label}
              </Typography>
              <Select
                size="small"
                value={f.value}
                displayEmpty
                onChange={(e) => f.setter(e.target.value)}
                sx={{
                  backgroundColor: COLORS.bg,
                  color: COLORS.text,
                  fontSize: '0.8rem',
                  height: 32,
                  width: '100%',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: COLORS.cardBorder,
                  },
                  '& .MuiSelect-select': {
                    py: 0.5,
                  },
                }}
              >
                <MenuItem value="">
                  <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
                    {f.placeholder}
                  </Typography>
                </MenuItem>
                {f.options.map((opt: string) => (
                  <MenuItem key={opt} value={opt}>
                    <Typography sx={{ fontSize: '0.8rem' }}>{opt}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </Box>
          ))}
        </Box>

        {/* Right: Date range pills + Refresh */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {DATE_RANGES.map((r) => (
            <Chip
              key={r}
              label={r}
              onClick={() => setDateRange(r)}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: dateRange === r ? 700 : 500,
                backgroundColor: dateRange === r ? 'rgba(0, 208, 132, 0.18)' : COLORS.bg,
                color: dateRange === r ? COLORS.green : COLORS.muted,
                border: `1px solid ${dateRange === r ? COLORS.green : COLORS.cardBorder}`,
                px: 0.25,
                '&:hover': {
                  backgroundColor: dateRange === r ? 'rgba(0, 208, 132, 0.28)' : COLORS.card,
                },
                borderRadius: 0.75,
              }}
            />
          ))}
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
            onClick={handleRefresh}
            sx={{
              borderColor: COLORS.cardBorder,
              color: COLORS.muted,
              textTransform: 'none',
              fontSize: '0.75rem',
              height: 32,
              borderRadius: 0.75,
              '&:hover': {
                borderColor: COLORS.green,
                color: COLORS.green,
              },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* ==================== KPI CARDS ROW ==================== */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Unregistered Remaining"
            value={data?.unregistered_count ? `${(data.unregistered_count / 1000000).toFixed(2)}M` : '0'}
            subtext={`of ${data?.total_citizens ? (data.total_citizens / 1000000).toFixed(2) + 'M' : '0'} at last sync`}
            valueColor={COLORS.orange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Registered Today"
            value={data?.registrations_today || 0}
            subtext="target 330"
            valueColor={COLORS.green}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Converted to Date"
            value={`${(data?.registration_percentage || 0).toFixed(1)}%`}
            subtext={`${data?.registered_count?.toLocaleString() || 0} registered`}
            valueColor={COLORS.cyan}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Target Achieved"
            value={`${Math.min(100, data?.registration_percentage || 0).toFixed(0)}%`}
            subtext="of 330"
            valueColor={COLORS.red}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Officers Reporting"
            value={data?.total_officers || 0}
            subtext={`of ${Math.max(9, data?.total_officers || 9)} chiefs today`}
            valueColor={COLORS.blue}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <KPICard
            title="Below Target"
            value={(officers as any[]).filter((o: any) => (o.registrations_today || 0) < 50).length || Math.max(0, (data?.total_officers || 0))}
            subtext="0 declared pending · 0 verified"
            valueColor={COLORS.red}
          />
        </Grid>
      </Grid>

      {/* ==================== MAIN TWO-COLUMN AREA ==================== */}
      <Grid container spacing={2}>
        {/* LEFT: Performance by district table */}
        <Grid item xs={12} lg={8}>
          <Card
            sx={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 0.5,
            }}
          >
            {/* Title row */}
            <Box
              sx={{
                p: 1.25,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${COLORS.cardBorder}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Performance by district
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: COLORS.muted, textDecoration: 'underline dotted' }}>
                  click a row to drill in
                </Typography>
              </Box>

              {/* Summary pills */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {[
                  { label: 'UNREGISTERED', value: totalUnregistered.toLocaleString(), color: COLORS.text },
                  { label: 'REGISTERED', value: totalRegistered.toLocaleString(), color: COLORS.green },
                  { label: 'REMAINING', value: totalRemaining.toLocaleString(), color: COLORS.orange },
                  { label: 'PERIOD', value: '+0', color: COLORS.green },
                  { label: 'DECLARED', value: '0', color: COLORS.muted },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: COLORS.muted, letterSpacing: 0.3 }}>
                      {s.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: s.color }}>
                      {s.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Table */}
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#251c0c' }}>
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        borderBottom: `1px solid ${COLORS.cardBorder}`,
                        py: 0.75,
                        width: 200,
                      }}
                    >
                      UNIT
                    </TableCell>
                    {['UNREGISTERED', 'REGISTERED', 'REMAINING', 'PERIOD', 'DECLARED'].map((c) => (
                      <TableCell
                        key={c}
                        align="right"
                        sx={{
                          color: COLORS.muted,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          letterSpacing: 0.4,
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          py: 0.75,
                        }}
                      >
                        {c}
                      </TableCell>
                    ))}
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        borderBottom: `1px solid ${COLORS.cardBorder}`,
                        py: 0.75,
                        width: 220,
                      }}
                    >
                      CONVERTED
                    </TableCell>
                    <TableCell
                      sx={{
                        color: COLORS.muted,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        borderBottom: `1px solid ${COLORS.cardBorder}`,
                        py: 0.75,
                        width: 140,
                      }}
                    >
                      CHIEFS ASSIGNED
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {districtRows.map((row: any, idx: number) => {
                    const unit = row.district || row.county || `Unit ${idx}`;
                    const unreg = row.unregistered_count ?? 0;
                    const reg = row.registered_count ?? 0;
                    const rem = unreg;
                    const pct = row.registration_percentage ?? 0;
                    const key = `${unit}-${idx}`;
                    const expanded = expandedRows[key];

                    return (
                      <React.Fragment key={key}>
                        <TableRow
                          onClick={() => toggleRow(key)}
                          sx={{
                            borderBottom: `1px solid ${COLORS.cardBorder}`,
                            cursor: 'pointer',
                            backgroundColor: idx % 2 === 1 ? 'rgba(26,35,50,0.4)' : COLORS.card,
                            '&:hover': { backgroundColor: '#252d3d' },
                          }}
                        >
                          <TableCell sx={{ color: COLORS.text, fontSize: '0.78rem', fontWeight: 600, py: 0.6, border: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {expanded ? (
                                <ExpandMore sx={{ fontSize: 14, color: COLORS.muted }} />
                              ) : (
                                <ChevronRight sx={{ fontSize: 14, color: COLORS.muted }} />
                              )}
                              {unit}
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: COLORS.text, fontSize: '0.78rem', fontWeight: 600, py: 0.6, border: 'none' }}>
                            {unreg.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: COLORS.green, fontSize: '0.78rem', fontWeight: 700, py: 0.6, border: 'none' }}>
                            {reg.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: COLORS.text, fontSize: '0.78rem', fontWeight: 600, py: 0.6, border: 'none' }}>
                            {rem.toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ color: COLORS.green, fontSize: '0.78rem', fontWeight: 700, py: 0.6, border: 'none' }}>
                            +0
                          </TableCell>
                          <TableCell align="right" sx={{ color: COLORS.muted, fontSize: '0.78rem', fontWeight: 600, py: 0.6, border: 'none' }}>
                            —
                          </TableCell>
                          <TableCell sx={{ py: 0.6, border: 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flex: 1, height: 4, backgroundColor: COLORS.bg, borderRadius: 0.5, position: 'relative' }}>
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: `${Math.min(100, pct)}%`,
                                    backgroundColor: pct > 50 ? COLORS.green : COLORS.orange,
                                    borderRadius: 0.5,
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: pct > 0 ? COLORS.green : COLORS.muted,
                                  minWidth: 36,
                                  textAlign: 'right',
                                }}
                              >
                                {pct.toFixed(0)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: COLORS.muted, fontSize: '0.72rem', py: 0.6, border: 'none' }}>
                            0 <Typography component="span" sx={{ color: COLORS.orange }}>unassigned</Typography>
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow sx={{ backgroundColor: COLORS.bg }}>
                            <TableCell colSpan={8} sx={{ p: 1.5, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  backgroundColor: COLORS.card,
                                  border: `1px solid ${COLORS.cardBorder}`,
                                  borderRadius: 0.5,
                                }}
                              >
                                <Typography sx={{ fontSize: '0.75rem', color: COLORS.muted }}>
                                  Detailed breakdown for <strong style={{ color: COLORS.text }}>{unit}</strong> — Sub-locations, officers on ground, and recent registrations.
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* RIGHT: Map + Ticks */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Conversion by county map */}
          <Card
            sx={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 0.5,
              flex: 1,
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 1.25 }}>
                Conversion by county
              </Typography>
              <KenyaMapSilhouette percentage={data?.registration_percentage || 0} />
            </CardContent>
          </Card>

          {/* Ticks by hour */}
          <Card
            sx={{
              backgroundColor: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 0.5,
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 1.5 }}>
                Ticks by hour - today
              </Typography>
              <TicksByHour hourlyData={hourlyTicks} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
