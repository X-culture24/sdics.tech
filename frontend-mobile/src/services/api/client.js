import axios from 'axios';
const ACCESS_TOKEN_KEY = 'sdics_mobile_access_token';
const REFRESH_TOKEN_KEY = 'sdics_mobile_refresh_token';
const OFFICER_KEY = 'sdics_mobile_officer';
// Auth endpoints that should not trigger token refresh or attach token
const AUTH_ENDPOINTS = ['auth/login/', 'auth/admin-login/', 'auth/refresh/'];
function isAuthEndpoint(url) {
    if (!url)
        return false;
    return AUTH_ENDPOINTS.some((ep) => url.includes(ep));
}
class ApiClient {
    constructor() {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "refreshTokenPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        const backendUrl = import.meta.env.VITE_API_URL || '/api';
        this.client = axios.create({
            baseURL: backendUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: false,
        });
        // Request interceptor: attach access token (skip for auth endpoints)
        this.client.interceptors.request.use((config) => {
            if (!isAuthEndpoint(config.url)) {
                const token = this.getAccessToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            else {
                if (config.headers) {
                    delete config.headers.Authorization;
                }
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor: handle 401 and refresh token
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            const isAuth = isAuthEndpoint(originalRequest.url);
            if (error.response?.status === 401 && !originalRequest._retry && !isAuth) {
                originalRequest._retry = true;
                try {
                    const newAccessToken = await this.refreshAccessToken();
                    if (newAccessToken && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return this.client(originalRequest);
                    }
                }
                catch (refreshError) {
                    this.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }
            if (error.response?.status === 401 && !isAuth && originalRequest._retry) {
                this.clearTokens();
                window.location.href = '/login';
            }
            return Promise.reject(error);
        });
    }
    getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(OFFICER_KEY);
    }
    storeOfficer(officer) {
        localStorage.setItem(OFFICER_KEY, JSON.stringify(officer));
    }
    getStoredOfficer() {
        const officer = localStorage.getItem(OFFICER_KEY);
        return officer ? JSON.parse(officer) : null;
    }
    async refreshAccessToken() {
        if (this.refreshTokenPromise) {
            return this.refreshTokenPromise;
        }
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }
        this.refreshTokenPromise = (async () => {
            try {
                const response = await this.client.post('auth/refresh/', { refresh: refreshToken }, { headers: { Authorization: '' } });
                const newAccessToken = response.data.access_token;
                localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
                return newAccessToken;
            }
            finally {
                this.refreshTokenPromise = null;
            }
        })();
        return this.refreshTokenPromise;
    }
    async login(national_id, pin) {
        try {
            const response = await this.client.post('auth/login/', { national_id, pin });
            const { access_token, refresh_token, officer } = response.data;
            this.setTokens(access_token, refresh_token);
            this.storeOfficer(officer);
            return { tokens: { access_token, refresh_token }, officer };
        }
        catch (error) {
            throw error;
        }
    }
    async adminLogin(email, password) {
        try {
            const response = await this.client.post('auth/admin-login/', { email, password });
            const { access_token, refresh_token, officer } = response.data;
            this.setTokens(access_token, refresh_token);
            this.storeOfficer(officer);
            return { tokens: { access_token, refresh_token }, officer };
        }
        catch (error) {
            throw error;
        }
    }
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                await this.client.post('auth/logout/', { refresh_token: refreshToken });
            }
        }
        finally {
            this.clearTokens();
        }
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
export const apiClient = new ApiClient();
