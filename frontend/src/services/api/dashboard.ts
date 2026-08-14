import { apiClient } from './client';
import type {
  DashboardSummary,
  CountyMetrics,
  DistrictMetrics,
  OfficerMetrics,
  TrendPoint,
} from '@types';

export const dashboardApi = {
  /**
   * Get dashboard summary metrics.
   * Cached by backend for 30 seconds.
   * Never includes raw citizen data - only aggregated counts.
   */
  async getSummary(): Promise<DashboardSummary> {
    return apiClient.get('/dashboard/summary/');
  },

  /**
   * Get metrics grouped by county.
   * Shows total, registered, unregistered counts and percentage.
   * Cached by backend for 30 seconds.
   */
  async getByCounty(): Promise<CountyMetrics[]> {
    return apiClient.get('/dashboard/by-county/');
  },

  /**
   * Get metrics grouped by district within a county.
   * Cached by backend for 30 seconds.
   */
  async getByDistrict(county?: string): Promise<DistrictMetrics[]> {
    const url = county
      ? `/dashboard/by-district/?county=${encodeURIComponent(county)}`
      : '/dashboard/by-district/';
    return apiClient.get(url);
  },

  /**
   * Get metrics grouped by officer.
   * Shows registration counts for each officer, including today's count.
   * Cached by backend for 30 seconds.
   */
  async getByOfficer(status?: string): Promise<OfficerMetrics[]> {
    const url = status
      ? `/dashboard/by-officer/?status=${encodeURIComponent(status)}`
      : '/dashboard/by-officer/';
    return apiClient.get(url);
  },

  /**
   * Get registration trends by day.
   * Returns daily registration counts for the specified period.
   * Cached by backend for 5 minutes.
   */
  async getTrends(days?: number, startDate?: string, endDate?: string): Promise<TrendPoint[]> {
    const params = new URLSearchParams();
    if (days) params.append('days', String(days));
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const url = params.toString()
      ? `/dashboard/trends/?${params.toString()}`
      : '/dashboard/trends/';
    return apiClient.get(url);
  },

  /**
   * Invalidate dashboard cache (admin only).
   * Manually trigger cache refresh if needed.
   */
  async invalidateCache(): Promise<void> {
    return apiClient.post('/dashboard/invalidate-cache/');
  },
};
