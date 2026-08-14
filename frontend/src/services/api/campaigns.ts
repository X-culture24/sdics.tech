import { apiClient } from './client';
import type { Campaign, PaginatedResponse } from '@types';

export const campaignsApi = {
  /**
   * Get list of all campaigns.
   */
  async getAll(page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<Campaign>> {
    return apiClient.get(`/campaigns/?page=${page}&page_size=${pageSize}`);
  },

  /**
   * Get campaign by ID.
   */
  async getById(campaignId: number): Promise<Campaign> {
    return apiClient.get(`/campaigns/${campaignId}/`);
  },

  /**
   * Create new campaign (admin only).
   */
  async create(data: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    target_count?: number;
  }): Promise<Campaign> {
    return apiClient.post('/campaigns/', data);
  },

  /**
   * Update campaign (admin only).
   */
  async update(
    campaignId: number,
    data: Partial<{
      name: string;
      description: string;
      target_count: number;
      status: string;
    }>
  ): Promise<Campaign> {
    return apiClient.patch(`/campaigns/${campaignId}/`, data);
  },

  /**
   * Get active campaigns.
   */
  async getActive(): Promise<Campaign[]> {
    return apiClient.get('/campaigns/?status=ACTIVE');
  },
};
