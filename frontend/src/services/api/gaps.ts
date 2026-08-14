import { apiClient } from './client';

export const gapsApi = {
  async getGaps() {
    const data: any = await apiClient.get('/gaps/');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.records)) return data.records;
    if (data && Array.isArray(data.counties)) return data.counties;
    return [];
  },
};
