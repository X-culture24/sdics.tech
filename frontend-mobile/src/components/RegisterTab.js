import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, TextField, Button, Typography, CircularProgress, Alert, MenuItem } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
export const RegisterTab = () => {
    const [query, setQuery] = useState('');
    const [selectedCitizen, setSelectedCitizen] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const { data: searchResults, isLoading: isSearching } = useQuery({
        queryKey: ['search-citizens', query],
        queryFn: () => (query ? registrationService.searchCitizens(query) : Promise.resolve({ results: [] })),
        enabled: query.length > 2,
    });
    const { mutate: register, isPending: isRegistering } = useMutation({
        mutationFn: (citizenId) => registrationService.registerCitizen(citizenId),
        onSuccess: () => {
            setSuccessMessage('Registration completed successfully!');
            setQuery('');
            setSelectedCitizen(null);
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error) => {
            alert(error.response?.data?.error?.message || 'Registration failed');
        },
    });
    const citizens = searchResults?.results || [];
    return (_jsxs(Box, { sx: { mt: 2 }, children: [successMessage && (_jsx(Alert, { icon: _jsx(CheckCircleIcon, { fontSize: "inherit" }), severity: "success", sx: { mb: 2 }, onClose: () => setSuccessMessage(''), children: successMessage })), _jsxs(Card, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h3", sx: { mb: 2 }, children: "Register Citizen" }), _jsx(TextField, { fullWidth: true, label: "Search by National ID or Name", value: query, onChange: (e) => {
                            setQuery(e.target.value);
                            setSelectedCitizen(null);
                        }, placeholder: "Enter at least 3 characters", margin: "normal", disabled: isSearching }), isSearching && _jsx(CircularProgress, { sx: { mt: 2 }, size: 24 }), citizens.length > 0 && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsxs(Typography, { variant: "body2", sx: { mb: 1, fontWeight: 600 }, children: ["Found ", citizens.length, " citizens"] }), _jsxs(MenuItem, { select: true, fullWidth: true, value: selectedCitizen?.id?.toString() || '', onChange: (e) => setSelectedCitizen(citizens.find((c) => c.id === parseInt(e.target.value))), sx: { mb: 2 }, component: TextField, children: [_jsx(MenuItem, { value: "", children: "Select a citizen" }), citizens.map((citizen) => (_jsxs(MenuItem, { value: citizen.id, children: [citizen.full_name, " (", citizen.national_id, ")"] }, citizen.id)))] })] })), selectedCitizen && (_jsxs(Card, { sx: { p: 2, mb: 2, backgroundColor: '#f0f4ff', border: '2px solid #1976d2' }, children: [_jsxs(Typography, { variant: "body2", sx: { mb: 1 }, children: [_jsx("strong", { children: "Name:" }), " ", selectedCitizen.full_name] }), _jsxs(Typography, { variant: "body2", sx: { mb: 1 }, children: [_jsx("strong", { children: "National ID:" }), " ", selectedCitizen.national_id] }), _jsxs(Typography, { variant: "body2", sx: { mb: 1 }, children: [_jsx("strong", { children: "Location:" }), " ", selectedCitizen.county, ", ", selectedCitizen.district] }), _jsx(Button, { fullWidth: true, variant: "contained", size: "large", sx: { mt: 2 }, disabled: isRegistering, onClick: () => register(selectedCitizen.id), children: isRegistering ? _jsx(CircularProgress, { size: 24 }) : 'Confirm Registration' })] })), query.length > 2 && citizens.length === 0 && !isSearching && (_jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "No unregistered citizens found" }))] })] }));
};
