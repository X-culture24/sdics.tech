import { apiClient } from './client';

export const exportsApi = {
  async getExports(limit: number = 50) {
    const data: any = await apiClient.get(`/exports/?limit=${limit}`);
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.exports)) return data.exports;
    if (data && Array.isArray(data.records)) return data.records;
    return [];
  },
};
