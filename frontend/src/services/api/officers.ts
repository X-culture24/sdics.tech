import { apiClient } from './client';
import type { Officer, OfficerWithLocations, PaginatedResponse } from '@types';

export const officersApi = {
  /**
   * Get list of all officers with pagination.
   */
  async getAll(page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<Officer>> {
    return apiClient.get(`/officers/?page=${page}&page_size=${pageSize}`);
  },

  /**
   * Get officer by ID.
   */
  async getById(officerId: number): Promise<OfficerWithLocations> {
    return apiClient.get(`/officers/${officerId}/`);
  },

  /**
   * Create a new officer (admin only).
   */
  async create(data: {
    national_id: string;
    full_name: string;
    phone: string;
    role: 'REGISTRATION_OFFICER' | 'SUPERVISOR' | 'ADMINISTRATOR';
  }): Promise<Officer> {
    return apiClient.post('/officers/', data);
  },

  /**
   * Update officer details (admin only).
   */
  async update(
    officerId: number,
    data: Partial<{
      full_name: string;
      phone: string;
      role: string;
      status: string;
    }>
  ): Promise<Officer> {
    return apiClient.patch(`/officers/${officerId}/`, data);
  },

  /**
   * Reset officer PIN (admin only).
   * Backend generates new PIN and returns it.
   */
  async resetPin(officerId: number): Promise<{ pin: string }> {
    return apiClient.post(`/officers/${officerId}/reset-pin/`);
  },

  /**
   * Deactivate officer (admin only).
   */
  async deactivate(officerId: number): Promise<Officer> {
    return apiClient.post(`/officers/${officerId}/deactivate/`);
  },

  /**
   * Assign locations to officer (admin only).
   */
  async assignLocations(
    officerId: number,
    locations: Array<{
      county: string;
      district: string;
      division?: string;
      location?: string;
    }>
  ): Promise<void> {
    return apiClient.post(`/officers/${officerId}/assign-locations/`, { locations });
  },
};
