import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, CircularProgress, Alert, Container } from '@mui/material';
import { useAuth } from '@hooks/useAuth';
export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, loading, error } = useAuth();
    const [nationalId, setNationalId] = useState('');
    const [pin, setPin] = useState('');
    const [localError, setLocalError] = useState('');
    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (!nationalId || !pin) {
            setLocalError('Please enter both National ID and PIN');
            return;
        }
        try {
            await login(nationalId, pin);
            navigate('/');
        }
        catch (err) {
            setLocalError(err.response?.data?.error?.message || 'Invalid credentials');
        }
    };
    return (_jsx(Container, { maxWidth: "sm", children: _jsx(Box, { sx: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs(Card, { sx: { p: 3, width: '100%' }, children: [_jsx(Typography, { variant: "h2", sx: { mb: 3, textAlign: 'center' }, children: "SDICS" }), _jsx(Typography, { variant: "body1", sx: { mb: 2, textAlign: 'center', color: 'text.secondary' }, children: "Officer Login" }), (error || localError) && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error || localError }), _jsxs("form", { onSubmit: handleLogin, children: [_jsx(TextField, { fullWidth: true, label: "National ID", value: nationalId, onChange: (e) => setNationalId(e.target.value), margin: "normal", disabled: loading, inputProps: { maxLength: 8 } }), _jsx(TextField, { fullWidth: true, label: "PIN", type: "password", value: pin, onChange: (e) => setPin(e.target.value), margin: "normal", disabled: loading, inputProps: { maxLength: 12 } }), _jsx(Button, { fullWidth: true, variant: "contained", size: "large", sx: { mt: 3, mb: 2 }, disabled: loading, type: "submit", children: loading ? _jsx(CircularProgress, { size: 24 }) : 'Login' })] }), _jsx(Typography, { variant: "caption", sx: { textAlign: 'center', display: 'block', color: 'text.secondary' }, children: "Test: ID: 12345678 | PIN: 12345678" })] }) }) }));
};
