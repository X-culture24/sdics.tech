import { apiClient } from './client';

export interface Citizen {
  id: number;
  national_id: string;
  full_name: string;
  county: string;
  district: string;
  division: string;
  location: string;
  registration_status: 'UNREGISTERED' | 'REGISTERED';
}

export interface Registration {
  id: number;
  citizen: number;
  officer: number;
  registered_at: string;
}

export const registrationService = {
  async searchCitizens(query: string) {
    const result = await apiClient.get<{ results: Citizen[]; count: number }>('/citizens/', {
      params: { search: query, registration_status: 'UNREGISTERED', page_size: 20 },
    });
    return result as { results: Citizen[] };
  },

  async getCitizensByCounty(county: string) {
    const result = await apiClient.get<{ results: Citizen[]; count: number }>('/citizens/', {
      params: { county, registration_status: 'UNREGISTERED', page_size: 50 },
    });
    return result as { results: Citizen[] };
  },

  async registerCitizen(citizenId: number, campaignId?: number) {
    return apiClient.post<Registration>('/registrations/', {
      citizen_id: citizenId,
      campaign_id: campaignId,
    });
  },

  async getTodayTarget() {
    const data: any = await apiClient.get('/dashboard/summary/');
    return {
      target: 50,
      registered_today: data?.registrations_today || 0,
      total_citizens: data?.total_citizens || 0,
      registered_count: data?.registered_count || 0,
      unregistered_count: data?.unregistered_count || 0,
      total_officers: data?.total_officers || 0,
      registration_percentage: data?.registration_percentage || 0,
    };
  },

  async getOfficerStats() {
    const data: any = await apiClient.get('/dashboard/by-officer/');
    return { results: Array.isArray(data) ? data : [] };
  },

  async getRegistrationTrends(days: number = 7) {
    const data: any = await apiClient.get(`/dashboard/trends/?days=${days}`);
    return { results: Array.isArray(data) ? data : [] };
  },

  async getCounties() {
    const data: any = await apiClient.get('/citizens/counties/');
    return { results: Array.isArray(data) ? data : [] };
  },
};
