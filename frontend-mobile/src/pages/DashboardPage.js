import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, Typography, Tab, Tabs, Container, CircularProgress } from '@mui/material';
import { useAuth } from '@hooks/useAuth';
import { TodayTargetTab } from '@components/TodayTargetTab';
import { RegisterTab } from '@components/RegisterTab';
import { CitizensTab } from '@components/CitizensTab';
import { StatsTab } from '@components/StatsTab';
export const DashboardPage = () => {
    const { officer, logout } = useAuth();
    const [currentTab, setCurrentTab] = useState(0);
    if (!officer) {
        return (_jsx(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }, children: _jsx(CircularProgress, {}) }));
    }
    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };
    return (_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5', pb: 10 }, children: [_jsx(Card, { sx: { p: 2, mb: 2, borderRadius: 0 }, children: _jsx(Container, { maxWidth: "sm", children: _jsxs(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h3", sx: { fontWeight: 700 }, children: "SDICS" }), _jsx(Typography, { variant: "caption", sx: { color: 'text.secondary' }, children: officer.full_name })] }), _jsx(Typography, { variant: "caption", onClick: handleLogout, sx: { cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }, children: "Logout" })] }) }) }), _jsxs(Container, { maxWidth: "sm", sx: { flex: 1, pb: 2 }, children: [currentTab === 0 && _jsx(TodayTargetTab, {}), currentTab === 1 && _jsx(RegisterTab, {}), currentTab === 2 && _jsx(CitizensTab, {}), currentTab === 3 && _jsx(StatsTab, {})] }), _jsx(Box, { sx: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid #e0e0e0' }, children: _jsx(Container, { maxWidth: "sm", disableGutters: true, children: _jsxs(Tabs, { value: currentTab, onChange: (_, value) => setCurrentTab(value), variant: "fullWidth", sx: {
                            '& .MuiTab-root': {
                                minHeight: '60px',
                                fontSize: '0.75rem',
                                py: 1,
                            },
                        }, children: [_jsx(Tab, { label: "Today's Target" }), _jsx(Tab, { label: "Register" }), _jsx(Tab, { label: "Citizens" }), _jsx(Tab, { label: "Stats" })] }) }) })] }));
};
