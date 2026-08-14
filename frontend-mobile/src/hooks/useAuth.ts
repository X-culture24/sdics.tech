import { useState, useEffect } from 'react';
import { apiClient } from '@services/api/client';

interface Officer {
  id: number;
  national_id: string;
  full_name: string;
  role: string;
}

export const useAuth = () => {
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedOfficer = apiClient.getStoredOfficer();
    if (storedOfficer) {
      setOfficer(storedOfficer);
    }
    setLoading(false);
  }, []);

  const login = async (national_id: string, pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.login(national_id, pin);
      setOfficer(result.officer);
      return result;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.logout();
      setOfficer(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!officer;

  return { officer, loading, error, isAuthenticated, login, logout };
};
