import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registrationApi } from '@services/api/registration';

export const useTodaysRegistrationCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['registration', 'today'],
    queryFn: () => registrationApi.getTodaysCount(),
    enabled: enabled,
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 10, // Auto-refresh every 10 seconds
  });
};

export const useRegisterCitizen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (citizenId: number) => registrationApi.registerCitizen(citizenId),
    onSuccess: () => {
      // Invalidate affected caches
      queryClient.invalidateQueries({ queryKey: ['citizens', 'search'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['registration', 'today'] });
    },
  });
};
