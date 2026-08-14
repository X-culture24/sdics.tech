import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, TextField, Typography, CircularProgress, Alert, MenuItem, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { registrationService } from '@services/api/registration';
export const CitizensTab = () => {
    const [selectedCounty, setSelectedCounty] = useState('');
    const [query, setQuery] = useState('');
    const { data: counties } = useQuery({
        queryKey: ['counties'],
        queryFn: () => registrationService.getCounties(),
    });
    const { data: citizens, isLoading, error } = useQuery({
        queryKey: ['citizens', selectedCounty, query],
        queryFn: () => selectedCounty
            ? registrationService.getCitizensByCounty(selectedCounty)
            : Promise.resolve({ results: [] }),
        enabled: !!selectedCounty,
    });
    const countyList = counties?.results || [];
    let filteredCitizens = citizens?.results || [];
    if (query) {
        filteredCitizens = filteredCitizens.filter((c) => c.national_id.includes(query) ||
            c.full_name.toLowerCase().includes(query.toLowerCase()));
    }
    return (_jsx(Box, { sx: { mt: 2 }, children: _jsxs(Card, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h3", sx: { mb: 2 }, children: "Citizens List" }), _jsxs(TextField, { select: true, fullWidth: true, label: "Select County", value: selectedCounty, onChange: (e) => {
                        setSelectedCounty(e.target.value);
                        setQuery('');
                    }, margin: "normal", children: [_jsx(MenuItem, { value: "", children: "-- Select a county --" }), countyList.map((county) => (_jsx(MenuItem, { value: county, children: county }, county)))] }), selectedCounty && (_jsx(TextField, { fullWidth: true, label: "Search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search by ID or name", margin: "normal" })), isLoading && _jsx(CircularProgress, { sx: { mt: 2 } }), error && _jsx(Alert, { severity: "error", children: "Failed to load citizens" }), selectedCounty && filteredCitizens.length > 0 && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsxs(Typography, { variant: "body2", sx: { mb: 1, fontWeight: 600 }, children: ["Found ", filteredCitizens.length, " citizens"] }), _jsx(List, { sx: { maxHeight: '400px', overflow: 'auto' }, children: filteredCitizens.map((citizen) => (_jsx(ListItem, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 1 }, children: _jsx(ListItemText, { primary: citizen.full_name, secondary: _jsxs(_Fragment, { children: [_jsxs(Typography, { variant: "caption", sx: { display: 'block' }, children: ["ID: ", citizen.national_id] }), _jsxs(Typography, { variant: "caption", sx: { display: 'block' }, children: [citizen.division, ", ", citizen.location] }), _jsx(Chip, { label: citizen.registration_status, size: "small", color: citizen.registration_status === 'REGISTERED' ? 'success' : 'default', sx: { mt: 0.5 } })] }) }) }, citizen.id))) })] })), selectedCounty && filteredCitizens.length === 0 && !isLoading && (_jsx(Alert, { severity: "info", sx: { mt: 2 }, children: "No citizens found" }))] }) }));
};
