import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { CircularProgress, Box } from '@mui/material';
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (_jsx(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }, children: _jsx(CircularProgress, {}) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return _jsx(_Fragment, { children: children });
};
