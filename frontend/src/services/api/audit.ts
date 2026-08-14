import { apiClient } from './client';
import type { AuditLog, PaginatedResponse } from '@types';

export const auditApi = {
  /**
   * Get audit logs with pagination and filtering.
   */
  async getLogs(
    page: number = 1,
    pageSize: number = 50,
    filters?: {
      user_id?: number;
      action?: string;
      entity_type?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));

    if (filters?.user_id) params.append('user_id', String(filters.user_id));
    if (filters?.action) params.append('action', filters.action);
    if (filters?.entity_type) params.append('entity_type', filters.entity_type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    return apiClient.get(`/audit-logs/?${params.toString()}`);
  },

  /**
   * Get audit log by ID.
   */
  async getById(logId: number): Promise<AuditLog> {
    return apiClient.get(`/audit-logs/${logId}/`);
  },
};
