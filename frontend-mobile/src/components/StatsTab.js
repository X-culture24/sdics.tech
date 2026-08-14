import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Card, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';
export const StatsTab = () => {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['officer-stats'],
        queryFn: () => registrationService.getOfficerStats(),
        refetchInterval: 60000,
    });
    const { data: trends } = useQuery({
        queryKey: ['registration-trends'],
        queryFn: () => registrationService.getRegistrationTrends(7),
    });
    if (isLoading)
        return _jsx(CircularProgress, { sx: { mt: 4 } });
    if (error)
        return _jsx(Alert, { severity: "error", children: "Failed to load statistics" });
    return (_jsx(Box, { sx: { mt: 2 }, children: _jsxs(Card, { sx: { p: 3, mb: 2 }, children: [_jsx(Typography, { variant: "h3", sx: { mb: 2 }, children: "My Statistics" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { item: true, xs: 6, children: _jsxs(Card, { sx: { p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }, children: [_jsx(Typography, { variant: "caption", sx: { color: 'white', opacity: 0.9 }, children: "Total Registrations" }), _jsx(Typography, { variant: "h2", sx: { color: 'white', mt: 1 }, children: stats?.results?.[0]?.registrations_count || 0 })] }) }), _jsx(Grid, { item: true, xs: 6, children: _jsxs(Card, { sx: { p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }, children: [_jsx(Typography, { variant: "caption", sx: { color: 'white', opacity: 0.9 }, children: "Today" }), _jsx(Typography, { variant: "h2", sx: { color: 'white', mt: 1 }, children: stats?.results?.[0]?.registrations_today || 0 })] }) })] }), trends && trends.results && trends.results.length > 0 && (_jsxs(Box, { sx: { mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1, fontWeight: 600 }, children: "Last 7 Days" }), _jsx(Box, { sx: { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px' }, children: trends.results.map((point, index) => (_jsxs(Box, { sx: { textAlign: 'center', flex: 1 }, children: [_jsx(Box, { sx: {
                                            height: `${(point.count / Math.max(...trends.results.map((p) => p.count))) * 100}px`,
                                            backgroundColor: '#1976d2',
                                            borderRadius: '4px 4px 0 0',
                                            mx: 0.5,
                                        } }), _jsx(Typography, { variant: "caption", sx: { fontSize: '0.65rem', mt: 0.5, display: 'block' }, children: point.count })] }, index))) })] }))] }) }));
};
