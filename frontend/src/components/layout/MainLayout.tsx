import React from 'react';
import { useAuth } from '@hooks/useAuth';
import { Outlet } from 'react-router-dom';
import { AppShell } from './AppShell';

export const MainLayout: React.FC = () => {
  const { officer } = useAuth();

  // Officers get a plain outlet (officer dashboard wraps them)
  if (officer?.role === 'REGISTRATION_OFFICER' || officer?.role === 'SUPERVISOR') {
    return <Outlet />;
  }

  // Admin/Administrator gets AppShell layout (includes top/bottom tabs + Outlet)
  return <AppShell />;
};
