import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@services/api/dashboard';
import { useAuth } from './useAuth';

export const useDashboardSummary = (enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
};

export const useDashboardByCounty = (enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'byCounty'],
    queryFn: () => dashboardApi.getByCounty(),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
};

export const useDashboardByDistrict = (county: string | null, enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'byDistrict', county],
    queryFn: () => dashboardApi.getByDistrict(county || undefined),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
};

export const useDashboardByOfficer = (status?: string, enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'byOfficer', status],
    queryFn: () => dashboardApi.getByOfficer(status),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Auto-refresh every 30 seconds
  });
};

export const useDashboardTrends = (days: number = 7, enabled: boolean = true) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['dashboard', 'trends', days],
    queryFn: () => dashboardApi.getTrends(days),
    enabled: enabled && isAuthenticated,
    staleTime: 1000 * 300, // 5 minutes
    refetchInterval: 1000 * 300, // Auto-refresh every 5 minutes
  });
};
