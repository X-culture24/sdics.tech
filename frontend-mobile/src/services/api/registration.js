import { apiClient } from './client';
export const registrationService = {
    async searchCitizens(query) {
        const result = await apiClient.get('/citizens/', {
            params: { search: query, registration_status: 'UNREGISTERED', page_size: 20 },
        });
        return result;
    },
    async getCitizensByCounty(county) {
        const result = await apiClient.get('/citizens/', {
            params: { county, registration_status: 'UNREGISTERED', page_size: 50 },
        });
        return result;
    },
    async registerCitizen(citizenId, campaignId) {
        return apiClient.post('/registrations/', {
            citizen_id: citizenId,
            campaign_id: campaignId,
        });
    },
    async getTodayTarget() {
        const data = await apiClient.get('/dashboard/summary/');
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
        const data = await apiClient.get('/dashboard/by-officer/');
        return { results: Array.isArray(data) ? data : [] };
    },
    async getRegistrationTrends(days = 7) {
        const data = await apiClient.get(`/dashboard/trends/?days=${days}`);
        return { results: Array.isArray(data) ? data : [] };
    },
    async getCounties() {
        const data = await apiClient.get('/citizens/counties/');
        return { results: Array.isArray(data) ? data : [] };
    },
};
