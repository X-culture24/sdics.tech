import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '@theme/theme';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';
import { useAuth } from '@hooks/useAuth';
import { LoginSelectorPage } from '@pages/LoginSelectorPage';
import { OfficerLoginPage } from '@pages/OfficerLoginPage';
import { AdminLoginPage } from '@pages/AdminLoginPage';
import { AdminDashboardPage } from '@pages/AdminDashboardPage';
import { OfficerDashboardPage } from '@pages/OfficerDashboardPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Layout selector for the root "/" route.
 * - ADMINISTRATOR and SUPERVISOR → Admin dashboard with top tabs (Dashboard / Officers / Locations / Reports / Gaps / Verify / Exports)
 * - REGISTRATION_OFFICER → Officer dashboard with bottom mobile-style tabs (Dashboard / Register / Search / Settings)
 */
const RootLayoutRouter: React.FC = () => {
  const { officer } = useAuth();

  if (!officer) {
    // Fallback - ProtectedRoute parent should redirect before this renders
    return <Outlet />;
  }

  if (officer.role === 'ADMINISTRATOR' || officer.role === 'SUPERVISOR') {
    return <AdminDashboardPage />;
  }

  return <OfficerDashboardPage />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginSelectorPage />} />
            <Route path="/login/officer" element={<OfficerLoginPage />} />
            <Route path="/login/admin" element={<AdminLoginPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RootLayoutRouter />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
