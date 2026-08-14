import { apiClient } from './client';
import type { RegisterCitizenRequest, Registration, DeviceInfo } from '@types';

// Helper functions (not private, moved to module level)
function captureDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  return {
    device: getDeviceType(),
    os: getOS(ua),
    browser: getBrowser(ua),
    app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    user_agent: ua,
  };
}

function getDeviceType(): string {
  if (/mobile|android|iphone|iPad|ipod/i.test(navigator.userAgent)) {
    return 'Mobile';
  }
  if (/tablet|iPad/i.test(navigator.userAgent)) {
    return 'Tablet';
  }
  return 'Desktop';
}

function getOS(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  return 'Unknown';
}

function getBrowser(ua: string): string {
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Unknown';
}

export const registrationApi = {
  /**
   * Register a citizen.
   * Backend records officer, timestamp, device info, and marks citizen as REGISTERED.
   */
  async registerCitizen(citizenId: number, request?: Partial<RegisterCitizenRequest>): Promise<Registration> {
    const deviceInfo = captureDeviceInfo();

    const payload: RegisterCitizenRequest = {
      citizen_id: citizenId,
      device_info: deviceInfo,
      ...request,
    };

    return apiClient.post(`/citizens/${citizenId}/register/`, payload);
  },

  /**
   * Get today's registration count for current officer.
   */
  async getTodaysCount(): Promise<{ count: number }> {
    return apiClient.get('/registrations/today/');
  },

  /**
   * Get registration history for a citizen.
   */
  async getCitizenRegistrationHistory(citizenId: number): Promise<Registration[]> {
    return apiClient.get(`/citizens/${citizenId}/registrations/`);
  },
};
