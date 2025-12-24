
import axios from 'axios';
import { Transaction, AuditLog, HealthStatus, QueueStats, Alert, User, UserPreferences, Notification } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const STORAGE_KEYS = {
  USER: 'paysignal_user',
  PREFS: 'paysignal_prefs',
  NOTIFS: 'paysignal_notifications',
  TOKEN: 'paysignal_auth_token'
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const originalConsoleError = console.error;
let isSuppressingErrors = false;

const filteredConsoleError = (...args: any[]) => {
  if (isSuppressingErrors) {
    const errorMessage = args[0]?.toString() || '';
    const isConnectionError = errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                              errorMessage.includes('ERR_NETWORK') ||
                              errorMessage.includes('ECONNREFUSED') ||
                              errorMessage.includes('Failed to load resource') ||
                              args.some(arg => 
                                arg?.code === 'ERR_NETWORK' || 
                                arg?.code === 'ECONNREFUSED' ||
                                arg?.message?.includes('ERR_CONNECTION_REFUSED') ||
                                arg?.message?.includes('Network Error')
                              );
    
    if (!isConnectionError) {
      originalConsoleError.apply(console, args);
    }
  } else {
    originalConsoleError.apply(console, args);
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isConnectionError = error.code === 'ERR_NETWORK' || 
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED') || 
                              error.message?.includes('Network Error');

    if (isConnectionError) {

      error.silent = true;

      isSuppressingErrors = true;
      console.error = filteredConsoleError;

      if (originalRequest.url?.includes('/users/me') && originalRequest.method === 'get') {

        setTimeout(() => {
          isSuppressingErrors = false;
          console.error = originalConsoleError;
        }, 50);
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/health') || originalRequest.url?.includes('/queue/stats')) {

        setTimeout(() => {
          isSuppressingErrors = false;
          console.error = originalConsoleError;
        }, 50);
        return Promise.reject(error);
      }

      setTimeout(() => {
        isSuppressingErrors = false;
        console.error = originalConsoleError;
      }, 50);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('paysignal_refresh_token');
      if (!refreshToken) {

        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem('paysignal_refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{ accessToken: string }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken } = response.data;
        localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {

        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem('paysignal_refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const getStoredUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const response = await api.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      email,
      password
    });
    
    const { user, accessToken, refreshToken } = response.data;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    localStorage.setItem('paysignal_refresh_token', refreshToken);
    return { user, accessToken, refreshToken };
  },
  signup: async (email: string, password: string, name: string): Promise<{ user: User; message: string }> => {
    const response = await api.post<{ user: User; message: string }>('/auth/signup', {
      email,
      password,
      name
    });
    return response.data;
  },
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await api.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken
    });
    const { accessToken } = response.data;
    localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    return { accessToken };
  },
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('paysignal_refresh_token');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {

        console.error('Logout API call failed:', error);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('paysignal_refresh_token');
  },
  getCurrentUser: (): User | null => getStoredUser(),
  getCurrentUserFromAPI: async (): Promise<User> => {
    try {
      const response = await api.get<{ user: User }>('/users/me');
      const user = response.data.user;

      if (typeof user.preferences === 'string') {
        user.preferences = JSON.parse(user.preferences);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return user;
    } catch (error: any) {

      const isConnectionError = error.code === 'ERR_NETWORK' || 
                                error.code === 'ECONNREFUSED' ||
                                error.message?.includes('ERR_CONNECTION_REFUSED') || 
                                error.message?.includes('Network Error') ||
                                error.silent;
      
      if (isConnectionError) {

        throw error;
      }
      throw error;
    }
  },
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.patch<{ user: User }>('/users/me', data);
    const user = response.data.user;

    if (typeof user.preferences === 'string') {
      user.preferences = JSON.parse(user.preferences);
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },
  updatePreferences: async (prefs: UserPreferences): Promise<User> => {
    const response = await api.patch<{ user: User }>('/users/me/preferences', { preferences: prefs });
    const user = response.data.user;

    if (typeof user.preferences === 'string') {
      user.preferences = JSON.parse(user.preferences);
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  },
  getSessions: async (): Promise<any[]> => {
    const response = await api.get<{ sessions: any[] }>('/users/me/sessions');
    return response.data.sessions;
  },
  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/users/me/sessions/${sessionId}`);
  },
  verifyEmail: async (token: string): Promise<{ message: string; verified: boolean }> => {
    const response = await api.get<{ message: string; verified: boolean }>(`/auth/verify-email?token=${token}`);
    return response.data;
  },
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  }
};

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {

    return [];
  },
  markAsRead: async (id: string): Promise<void> => {

  },
  clearAll: async (): Promise<void> => {

  }
};

export const getHealth = async (): Promise<HealthStatus> => {
  try {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  } catch (error: any) {

    const isConnectionError = error.code === 'ERR_NETWORK' || 
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED') || 
                              error.message?.includes('Network Error') ||
                              error.silent;
    
    if (isConnectionError) {

      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        services: [],
        checks: {}
      } as HealthStatus;
    }
    throw error;
  }
};

export const getQueueStats = async (): Promise<QueueStats> => {
  try {
    const response = await api.get<QueueStats>('/queue/stats');
    return response.data;
  } catch (error: any) {

    const isConnectionError = error.code === 'ERR_NETWORK' || 
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED') || 
                              error.message?.includes('Network Error') ||
                              error.silent;
    
    if (isConnectionError) {

      return {
        total_queued: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        avg_processing_time_ms: 0
      } as QueueStats;
    }
    throw error;
  }
};

export const getTransactions = async (merchantId?: string): Promise<{ transactions: Transaction[] }> => {
  const response = await api.get<{ transactions: Transaction[] }>('/transactions', {
    params: merchantId ? { merchant_id: merchantId } : {}
  });
  return response.data;
};

export const getAuditLogs = async (transactionId: string): Promise<{ logs: AuditLog[] }> => {
  const response = await api.get<{ logs: AuditLog[] }>(`/transactions/${transactionId}/audit-logs`);
  return response.data;
};

export const createTransaction = async (data: {
  merchant_id: string;
  amount: number;
  currency?: string;
  payer_id?: string;
  current_state?: string;
  metadata?: Record<string, any>;
}): Promise<{ transaction: Transaction }> => {
  try {

    const payload = {
      ...data,
      amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
      currency: data.currency?.toUpperCase() || 'USD',

      ...(data.payer_id && { payer_id: data.payer_id }),
      ...(data.current_state && { current_state: data.current_state }),
      ...(data.metadata && Object.keys(data.metadata).length > 0 && { metadata: data.metadata })
    };
    
    const response = await api.post<{ transaction: Transaction }>('/transactions', payload);
    return response.data;
  } catch (error: any) {

    if (error.response?.data?.error) {
      const apiError = new Error(error.response.data.error.message || 'Failed to create transaction');
      (apiError as any).response = error.response;
      throw apiError;
    }
    throw error;
  }
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await api.get<Alert[]>('/alerts');
    return response.data;
  } catch (error: any) {

    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED') || error.code === 'ECONNREFUSED') {
      return [];
    }
    throw error;
  }
};

export const alertService = {
  acknowledge: async (alertId: string): Promise<void> => {
    await api.patch(`/alerts/${alertId}/resolve`);
  },
  resolve: async (alertId: string): Promise<void> => {
    await api.patch(`/alerts/${alertId}/resolve`);
  },
};

export const getBatchJobs = async (): Promise<{ jobs: any[] }> => {
  const response = await api.get<{ jobs: any[] }>('/batch-jobs');
  return response.data;
};

export const rulesService = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/rules');
    return response.data;
  },
  getById: async (id: string): Promise<any> => {
    const response = await api.get<any>(`/rules/${id}`);
    return response.data;
  },
  create: async (rule: { name: string; description: string; threshold: string | number; enabled: boolean; rule_definition: any }): Promise<any> => {
    const response = await api.post<any>('/rules', rule);
    return response.data;
  },
  update: async (id: string, rule: Partial<any>): Promise<any> => {
    const response = await api.put<any>(`/rules/${id}`, rule);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/rules/${id}`);
  },
  toggle: async (id: string, enabled: boolean): Promise<any> => {
    const response = await api.patch<any>(`/rules/${id}/toggle`, { enabled });
    return response.data;
  },
};

export const oauthService = {
  initiateGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/oauth/google`;
  },
  initiateGithub: () => {
    window.location.href = `${API_BASE_URL}/auth/oauth/github`;
  },
};
