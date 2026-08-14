import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { TokenResponse, ApiError, Officer } from '@types';

// Token storage keys
const ACCESS_TOKEN_KEY = 'sdics_access_token';
const REFRESH_TOKEN_KEY = 'sdics_refresh_token';
const OFFICER_KEY = 'sdics_officer';

// Auth endpoints that should not trigger token refresh or attach token
// Note: auth/logout/ is NOT here because it needs a valid token to revoke server-side
const AUTH_ENDPOINTS = ['auth/login/', 'auth/admin-login/', 'auth/refresh/'];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
}

class ApiClient {
  public client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    // Use production domain or fallback to relative URL
    const backendUrl = import.meta.env.VITE_API_URL || 'https://sdics.tech/api';
    
    this.client = axios.create({
      baseURL: backendUrl,
      timeout: 120000, // 120 seconds for large data operations
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: false,
    });

    // Request interceptor: attach access token (skip for auth endpoints)
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Don't attach token to auth endpoints (especially important for refresh/login)
        if (!isAuthEndpoint(config.url)) {
          const token = this.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } else {
          // Explicitly remove any Authorization header for auth endpoints
          if (config.headers) {
            delete config.headers.Authorization;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: handle 401 and refresh token
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip refresh logic for auth endpoints themselves - prevents infinite loops
        const isAuth = isAuthEndpoint(originalRequest.url);

        if (error.response?.status === 401 && !originalRequest._retry && !isAuth) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // If auth endpoint returns 401 (e.g., bad credentials on login), just reject normally
        // If non-auth endpoint and refresh was skipped/already retried, redirect to login
        if (error.response?.status === 401 && !isAuth && originalRequest._retry) {
          this.clearTokens();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  /* ==================== Token Management ==================== */

  private getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private setTokens(tokens: TokenResponse, officer: Officer): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    localStorage.setItem(OFFICER_KEY, JSON.stringify(officer));
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(OFFICER_KEY);
  }

  getStoredOfficer(): Officer | null {
    const officer = localStorage.getItem(OFFICER_KEY);
    return officer ? JSON.parse(officer) : null;
  }

  storeOfficer(officer: Officer): void {
    localStorage.setItem(OFFICER_KEY, JSON.stringify(officer));
  }

  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await this.client.post<TokenResponse>(
          'auth/refresh/',
          { refresh: refreshToken },
          { headers: { Authorization: '' } }
        );

        const newAccessToken = response.data.access_token;
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        return newAccessToken;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  /* ==================== Authentication ==================== */

  async login(national_id: string, pin: string): Promise<{ tokens: TokenResponse; officer: Officer }> {
    try {
      const response = await this.client.post<{
        access_token: string;
        refresh_token: string;
        officer: Officer;
      }>('auth/login/', {
        national_id,
        pin,
      });

      const { access_token, refresh_token, officer } = response.data;
      this.setTokens({ access_token, refresh_token }, officer);

      return {
        tokens: { access_token, refresh_token },
        officer,
      };
    } catch (error) {
      throw this.parseError(error);
    }
  }

  async adminLogin(email: string, password: string): Promise<{ tokens: TokenResponse; officer: Officer }> {
    try {
      console.log('[apiClient] adminLogin: posting to auth/admin-login/');
      const response = await this.client.post<{
        access_token: string;
        refresh_token: string;
        officer: Officer;
      }>('auth/admin-login/', {
        email,
        password,
      });

      console.log('[apiClient] adminLogin: response received', response.status);
      const { access_token, refresh_token, officer } = response.data;
      this.setTokens({ access_token, refresh_token }, officer);
      console.log('[apiClient] adminLogin: tokens stored');

      return {
        tokens: { access_token, refresh_token },
        officer,
      };
    } catch (error) {
      console.error('[apiClient] adminLogin: error caught', error);
      throw this.parseError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        await this.client.post('auth/logout/', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  getMe(): Officer | null {
    return this.getStoredOfficer();
  }

  async changePin(currentPin: string, newPin: string): Promise<void> {
    try {
      await this.client.post('auth/change-pin/', {
        current_pin: currentPin,
        new_pin: newPin,
      });
    } catch (error) {
      throw this.parseError(error);
    }
  }

  /* ==================== Generic Request Methods ==================== */

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.parseError(error);
    }
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.parseError(error);
    }
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.parseError(error);
    }
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.parseError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.parseError(error);
    }
  }

  /* ==================== Error Handling ==================== */

  private parseError(error: unknown): ApiError {
    console.error('[apiClient] parseError: parsing error', error);
    
    if (axios.isAxiosError(error)) {
      console.error('[apiClient] parseError: axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      
      const data = error.response?.data as ApiError | undefined;

      if (data?.error) {
        return data;
      }

      return {
        error: {
          code: error.response?.status?.toString() || 'UNKNOWN',
          message: error.message,
        },
      };
    }

    if (error instanceof Error) {
      return {
        error: {
          code: 'UNKNOWN',
          message: error.message,
        },
      };
    }

    return {
      error: {
        code: 'UNKNOWN',
        message: 'An unknown error occurred',
      },
    };
  }

  getHttpStatus(error: unknown): number {
    if (axios.isAxiosError(error)) {
      return error.response?.status || 500;
    }
    return 500;
  }

  isUnauthorized(error: unknown): boolean {
    return this.getHttpStatus(error) === 401;
  }

  isForbidden(error: unknown): boolean {
    return this.getHttpStatus(error) === 403;
  }

  isNotFound(error: unknown): boolean {
    return this.getHttpStatus(error) === 404;
  }

  isNetworkError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      return !error.response;
    }
    return false;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
