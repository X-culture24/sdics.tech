import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@services/api/client';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Get current officer from localStorage
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      console.log('[useAuth] Checking stored officer...');
      const officer = apiClient.getStoredOfficer();
      console.log('[useAuth] Found officer:', officer);
      if (!officer) {
        throw new Error('Not authenticated');
      }
      return officer;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0, // Don't retry - if not authenticated, we're not authenticated
    enabled: true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { national_id: string; pin: string }) => {
      console.log('[useAuth] Login mutation called');
      const { tokens, officer } = await apiClient.login(credentials.national_id, credentials.pin);
      console.log('[useAuth] Login successful, officer:', officer);
      return { tokens, officer };
    },
    onSuccess: (data) => {
      console.log('[useAuth] Login mutation success, updating query cache');
      queryClient.setQueryData(['auth', 'me'], data.officer);
    },
    onError: (error) => {
      console.error('[useAuth] Login mutation error:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[useAuth] Logout mutation called');
      await apiClient.logout();
    },
    onSuccess: () => {
      console.log('[useAuth] Logout mutation success, clearing cache');
      queryClient.clear();
    },
  });

  // Change PIN mutation
  const changePinMutation = useMutation({
    mutationFn: async (passwords: { currentPin: string; newPin: string }) => {
      await apiClient.changePin(passwords.currentPin, passwords.newPin);
    },
  });

  return {
    officer: meQuery.data || null,
    isAuthenticated: !!meQuery.data,
    isLoading: meQuery.isLoading,
    error: meQuery.error,

    login: loginMutation.mutateAsync,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,

    logout: logoutMutation.mutateAsync,

    changePin: changePinMutation.mutateAsync,
    changePinLoading: changePinMutation.isPending,
    changePinError: changePinMutation.error,
  };
};
