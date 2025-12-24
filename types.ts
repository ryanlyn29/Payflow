
export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_CANCELLED = 'payment_cancelled',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_DISPUTED = 'payment_disputed'
}

export enum PaymentTransactionState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'read_only';
  avatar_url?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'comfortable' | 'compact';
  notifications_enabled: boolean;
  default_region: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export interface Transaction {
  payment_transaction_id: string;
  merchant_id: string;
  payer_id?: string;
  amount: number;
  currency: string;
  current_state: PaymentTransactionState;
  created_at: string;
  updated_at: string;
  last_event_id: string;
  retry_count: number;
  failure_reason?: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  audit_log_id: string;
  payment_transaction_id: string;
  event_id: string;
  event_type: PaymentEventType;
  previous_state?: PaymentTransactionState;
  new_state: PaymentTransactionState;
  timestamp: string;
  source_service: string;
  correlation_id?: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  alert_id: string;
  alert_type: string;
  severity: AlertSeverity;
  payment_transaction_id?: string;
  merchant_id?: string;
  description: string;
  detected_at: string;
  resolved: boolean;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number | string;
  type: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, { status: 'healthy' | 'unhealthy'; message?: string }>;
}

export interface QueueStats {
  ApproximateNumberOfMessages: number;
  ApproximateNumberOfMessagesInFlight: number;
  ApproximateNumberOfMessagesInDeadLetterQueue: number;
}
