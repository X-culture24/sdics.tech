import { useQuery } from '@tanstack/react-query';
import { citizensApi } from '@services/api/citizens';
import type { CitizenSearchParams } from '@types';

export const useCitizensSearch = (params: CitizenSearchParams = {}, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['citizens', 'search', params],
    queryFn: () => citizensApi.search(params),
    enabled: enabled,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCitizen = (citizenId: number | null) => {
  return useQuery({
    queryKey: ['citizens', citizenId],
    queryFn: () => citizensApi.getById(citizenId!),
    enabled: !!citizenId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCounties = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['citizens', 'counties'],
    queryFn: () => citizensApi.getCounties(),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useDistricts = (county: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['citizens', 'districts', county],
    queryFn: () => citizensApi.getDistricts(county!),
    enabled: enabled && !!county,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useDivisions = (county: string | null, district: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['citizens', 'divisions', county, district],
    queryFn: () => citizensApi.getDivisions(county!, district!),
    enabled: enabled && !!county && !!district,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useLocations = (
  county: string | null,
  district: string | null,
  division: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['citizens', 'locations', county, district, division],
    queryFn: () => citizensApi.getLocations(county!, district!, division!),
    enabled: enabled && !!county && !!district && !!division,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useSubLocations = (
  county: string | null,
  district: string | null,
  division: string | null,
  location: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['citizens', 'subLocations', county, district, division, location],
    queryFn: () => citizensApi.getSubLocations(county!, district!, division!, location!),
    enabled: enabled && !!county && !!district && !!division && !!location,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useVillages = (
  county: string | null,
  district: string | null,
  division: string | null,
  location: string | null,
  subLocation: string | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['citizens', 'villages', county, district, division, location, subLocation],
    queryFn: () => citizensApi.getVillages(county!, district!, division!, location!, subLocation!),
    enabled: enabled && !!county && !!district && !!division && !!location && !!subLocation,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
