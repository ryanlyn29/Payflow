
import axios from 'axios';
import { Transaction, AuditLog, HealthStatus, QueueStats, Alert, User, UserPreferences, Notification } from '../types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Persistence Utilities
const STORAGE_KEYS = {
  USER: 'paysignal_user',
  PREFS: 'paysignal_prefs',
  NOTIFS: 'paysignal_notifications',
  TOKEN: 'paysignal_auth_token'
};

const getDefaultPrefs = (): UserPreferences => ({
  theme: 'dark',
  density: 'comfortable',
  notifications_enabled: true,
  default_region: 'us-east-1'
});

// Mock Persistence Layer
const getStoredUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

const getStoredNotifs = (): Notification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFS);
  if (data) return JSON.parse(data);
  const initial: Notification[] = [
    { id: '1', title: 'System Healthy', message: 'All clusters reporting 100% uptime.', type: 'success', timestamp: new Date().toISOString(), read: false },
    { id: '2', title: 'High Latency Detected', message: 'Region eu-central-1 experiencing 250ms+ spikes.', type: 'warning', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false }
  ];
  localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(initial));
  return initial;
};

// --- AUTH API ---
export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulating API latency
    await new Promise(r => setTimeout(r, 800));
    
    const user: User = {
      id: 'USR-001',
      email,
      name: email.split('@')[0].toUpperCase(),
      role: 'admin',
      preferences: getDefaultPrefs()
    };
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock_jwt_token_header_payload_sig');
    return { user, token: 'mock_jwt_token' };
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
  getCurrentUser: (): User | null => getStoredUser(),
  updatePreferences: (prefs: UserPreferences) => {
    const user = getStoredUser();
    if (user) {
      const updated = { ...user, preferences: prefs };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    }
    return null;
  }
};

// --- NOTIFICATIONS API ---
export const notificationService = {
  getAll: (): Notification[] => getStoredNotifs(),
  markAsRead: (id: string) => {
    const notifs = getStoredNotifs().map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifs));
    return notifs;
  },
  clearAll: () => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify([]));
    return [];
  }
};

// --- DATA API ---
export const getHealth = async (): Promise<HealthStatus> => {
  try {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  } catch (e) {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        redis: { status: 'healthy' },
        postgres: { status: 'healthy' },
        sqs: { status: 'healthy' }
      }
    };
  }
};

export const getQueueStats = async (): Promise<QueueStats> => {
  try {
    const response = await api.get<QueueStats>('/queue/stats');
    return response.data;
  } catch (e) {
    return {
      ApproximateNumberOfMessages: 124,
      ApproximateNumberOfMessagesInFlight: 12,
      ApproximateNumberOfMessagesInDeadLetterQueue: 2
    };
  }
};

export const getTransactions = async (merchantId?: string): Promise<{ transactions: Transaction[] }> => {
  try {
    const response = await api.get<{ transactions: Transaction[] }>('/transactions', {
      params: merchantId ? { merchant_id: merchantId } : {}
    });
    return response.data;
  } catch (e) {
    const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 50 }).map((_, i) => ({
      payment_transaction_id: `TXN-${1000 + i}`,
      merchant_id: `MERC-${(i % 5) + 1}`,
      amount: Math.floor(Math.random() * 100000),
      currency: 'USD',
      current_state: ['completed', 'failed', 'processing', 'pending'][i % 4] as any,
      created_at: new Date(Date.now() - i * 3600000).toISOString(),
      updated_at: new Date(Date.now() - i * 1800000).toISOString(),
      last_event_id: `EVT-${5000 + i}`,
      retry_count: i % 3,
      metadata: { ip: '192.168.1.1', user_agent: 'Mozilla/5.0' }
    }));
    let filtered = MOCK_TRANSACTIONS;
    if (merchantId) filtered = filtered.filter(t => t.merchant_id === merchantId);
    return { transactions: filtered };
  }
};

export const getAuditLogs = async (transactionId: string): Promise<{ logs: AuditLog[] }> => {
  try {
    const response = await api.get<{ logs: AuditLog[] }>(`/transactions/${transactionId}/audit-logs`);
    return response.data;
  } catch (e) {
    return {
      logs: [
        {
          audit_log_id: 'AUD-001',
          payment_transaction_id: transactionId,
          event_id: 'EVT-1',
          event_type: 'payment_initiated' as any,
          new_state: 'pending' as any,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          source_service: 'checkout-gateway'
        },
        {
          audit_log_id: 'AUD-002',
          payment_transaction_id: transactionId,
          event_id: 'EVT-2',
          event_type: 'payment_processing' as any,
          previous_state: 'pending' as any,
          new_state: 'processing' as any,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          source_service: 'payment-router'
        }
      ]
    };
  }
};

export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const response = await api.get<Alert[]>('/alerts');
    return response.data;
  } catch (e) {
    return [
      {
        alert_id: 'AL-001',
        alert_type: 'DUPLICATE_PAYMENT',
        severity: 'high' as any,
        payment_transaction_id: 'TXN-1001',
        merchant_id: 'MERC-1',
        description: 'Multiple identical transactions detected within 30s window.',
        detected_at: new Date().toISOString(),
        resolved: false
      },
      {
        alert_id: 'AL-002',
        alert_type: 'RETRY_STORM',
        severity: 'critical' as any,
        payment_transaction_id: 'TXN-1050',
        description: 'Transaction TXN-1050 has exceeded 15 retry attempts.',
        detected_at: new Date().toISOString(),
        resolved: false
      }
    ];
  }
};
