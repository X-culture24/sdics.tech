import { apiClient } from './client';

export const verifyApi = {
  async getVerifications() {
    return apiClient.get('/verify/');
  },

  async approveRecord(recordId: number, reason?: string) {
    return apiClient.post('/verify/', {
      action: 'approve',
      record_id: recordId,
      reason: reason || '',
    });
  },

  async rejectRecord(recordId: number, reason: string) {
    return apiClient.post('/verify/', {
      action: 'reject',
      record_id: recordId,
      reason,
    });
  },
};
