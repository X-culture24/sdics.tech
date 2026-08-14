import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Card, Typography, LinearProgress, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';
export const TodayTargetTab = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['today-target'],
        queryFn: () => registrationService.getTodayTarget(),
        refetchInterval: 60000, // Refresh every minute
    });
    if (isLoading)
        return _jsx(CircularProgress, { sx: { mt: 4 } });
    if (error)
        return _jsx(Alert, { severity: "error", children: "Failed to load target" });
    const target = data?.target || 50;
    const registered = data?.registered_today || 0;
    const percentage = Math.round((registered / target) * 100);
    return (_jsx(Box, { sx: { mt: 2 }, children: _jsxs(Card, { sx: { p: 3, mb: 2 }, children: [_jsx(Typography, { variant: "h3", sx: { mb: 2, textAlign: 'center' }, children: "Today's Target" }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', mb: 1 }, children: [_jsx(Typography, { variant: "body2", sx: { fontWeight: 600 }, children: "Progress" }), _jsxs(Typography, { variant: "body2", sx: { fontWeight: 600, color: 'primary.main' }, children: [percentage, "%"] })] }), _jsx(LinearProgress, { variant: "determinate", value: Math.min(percentage, 100), sx: {
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: '#e0e0e0',
                                '& .MuiLinearProgress-bar': {
                                    background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)',
                                },
                            } })] }), _jsxs(Box, { sx: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }, children: [_jsxs(Card, { sx: { p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)' }, children: [_jsx(Typography, { variant: "body2", sx: { color: 'white', opacity: 0.9, mb: 1 }, children: "Registered" }), _jsx(Typography, { variant: "h2", sx: { color: 'white' }, children: registered })] }), _jsxs(Card, { sx: { p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }, children: [_jsx(Typography, { variant: "body2", sx: { color: 'white', opacity: 0.9, mb: 1 }, children: "Target" }), _jsx(Typography, { variant: "h2", sx: { color: 'white' }, children: target })] })] }), _jsx(Box, { sx: { mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }, children: _jsxs(Typography, { variant: "caption", sx: { color: 'text.secondary', display: 'block', textAlign: 'center' }, children: ["Remaining: ", Math.max(0, target - registered)] }) })] }) }));
};
