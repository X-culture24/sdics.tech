import { apiClient } from './client';

export const reportsApi = {
  async getReports(type: string = 'daily_breakdown') {
    return apiClient.get(`/reports/?type=${encodeURIComponent(type)}`);
  },
};
