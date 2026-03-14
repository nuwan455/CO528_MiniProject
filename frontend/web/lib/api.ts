import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  // Keep web and mobile on the same backend during local development.
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000/api/v1';
  }

  return 'https://140.245.230.95.sslip.io/api/v1';
};

const unwrapApiData = <T>(payload: any): T | undefined => {
  if (!payload) return undefined;
  if (payload.data !== undefined) return payload.data as T;
  return payload as T;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resolveApiAssetUrl = (assetUrl?: string | null) => {
  if (!assetUrl) {
    return undefined;
  }

  if (/^(https?:\/\/|blob:|data:)/i.test(assetUrl)) {
    return assetUrl;
  }

  return new URL(assetUrl, api.defaults.baseURL).toString();
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // In a real app, you'd get this from a secure store or cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh or logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt token refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
          const payload = unwrapApiData<{ tokens: { accessToken: string; refreshToken: string } }>(res.data?.data);
          if (payload?.tokens) {
            localStorage.setItem('token', payload.tokens.accessToken);
            localStorage.setItem('refreshToken', payload.tokens.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${payload.tokens.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
