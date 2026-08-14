import { apiClient } from './client';
import type { Citizen, CitizenSearchParams, PaginatedResponse } from '@types';

export const citizensApi = {
  /**
   * Search for citizens with server-side pagination and filtering.
   * Never requests all citizens - uses pagination with max 100 per page.
   */
  async search(params: CitizenSearchParams = {}): Promise<PaginatedResponse<Citizen>> {
    const queryParams = new URLSearchParams();

    // Only add parameters if they have values
    if (params.national_id) queryParams.append('national_id', params.national_id);
    if (params.full_name) queryParams.append('full_name', params.full_name);
    if (params.county) queryParams.append('county', params.county);
    if (params.district) queryParams.append('district', params.district);
    if (params.division) queryParams.append('division', params.division);
    if (params.location) queryParams.append('location', params.location);
    if (params.sub_location) queryParams.append('sub_location', params.sub_location);
    if (params.village) queryParams.append('village', params.village);
    if (params.registration_status) queryParams.append('registration_status', params.registration_status);

    // Pagination: default 25, max 100
    const pageSize = Math.min(params.page_size || 25, 100);
    queryParams.append('page', String(params.page || 1));
    queryParams.append('page_size', String(pageSize));

    // Ordering
    if (params.ordering) queryParams.append('ordering', params.ordering);

    const response = await apiClient.get<PaginatedResponse<Citizen>>(
      `/citizens/?${queryParams.toString()}`
    );

    return response;
  },

  /**
   * Get a single citizen by ID.
   */
  async getById(citizenId: number): Promise<Citizen> {
    return apiClient.get(`/citizens/${citizenId}/`);
  },

  /**
   * Get available counties for filtering.
   * Backend returns distinct list of counties.
   */
  async getCounties(): Promise<string[]> {
    return apiClient.get('/citizens/counties/');
  },

  /**
   * Get districts for a specific county.
   * Backend returns distinct list of districts.
   */
  async getDistricts(county: string): Promise<string[]> {
    return apiClient.get(`/citizens/districts/?county=${encodeURIComponent(county)}`);
  },

  /**
   * Get divisions for a specific district.
   */
  async getDivisions(county: string, district: string): Promise<string[]> {
    return apiClient.get(
      `/citizens/divisions/?county=${encodeURIComponent(county)}&district=${encodeURIComponent(district)}`
    );
  },

  /**
   * Get locations for a specific division.
   */
  async getLocations(county: string, district: string, division: string): Promise<string[]> {
    return apiClient.get(
      `/citizens/locations/?county=${encodeURIComponent(county)}&district=${encodeURIComponent(
        district
      )}&division=${encodeURIComponent(division)}`
    );
  },

  /**
   * Get sub-locations for a specific location.
   */
  async getSubLocations(
    county: string,
    district: string,
    division: string,
    location: string
  ): Promise<string[]> {
    return apiClient.get(
      `/citizens/sub-locations/?county=${encodeURIComponent(
        county
      )}&district=${encodeURIComponent(district)}&division=${encodeURIComponent(
        division
      )}&location=${encodeURIComponent(location)}`
    );
  },

  /**
   * Get villages for a specific sub-location.
   */
  async getVillages(
    county: string,
    district: string,
    division: string,
    location: string,
    subLocation: string
  ): Promise<string[]> {
    return apiClient.get(
      `/citizens/villages/?county=${encodeURIComponent(
        county
      )}&district=${encodeURIComponent(district)}&division=${encodeURIComponent(
        division
      )}&location=${encodeURIComponent(location)}&sub_location=${encodeURIComponent(subLocation)}`
    );
  },
};
