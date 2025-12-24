import { Transaction, Alert, HealthStatus, QueueStats, AuditLog, PaymentTransactionState, PaymentEventType } from '../types';

export const generateMockTransactions = (count: number = 20): Transaction[] => {
  const merchants = ['merchant_acme', 'merchant_techcorp', 'merchant_retail', 'merchant_finance', 'merchant_services'];
  const states: PaymentTransactionState[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
  
  const transactions: Transaction[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const created = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const state = states[Math.floor(Math.random() * states.length)];
    const amount = Math.floor(Math.random() * 100000) + 1000; // $10.00 to $1000.00
    
    transactions.push({
      payment_transaction_id: `txn_${Math.random().toString(36).substring(2, 15)}`,
      merchant_id: merchants[Math.floor(Math.random() * merchants.length)],
      payer_id: `payer_${Math.random().toString(36).substring(2, 10)}`,
      amount: amount,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      current_state: state,
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + Math.random() * 3600000).toISOString(),
      last_event_id: `evt_${Math.random().toString(36).substring(2, 15)}`,
      retry_count: state === 'failed' ? Math.floor(Math.random() * 5) : 0,
      failure_reason: state === 'failed' ? 'Payment gateway timeout' : undefined,
      metadata: {
        source: 'api',
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        risk_score: Math.random() * 100
      }
    });
  }
  
  return transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const generateMockAlerts = (count: number = 10): Alert[] => {
  const alertTypes = ['fraud_detected', 'high_volume', 'anomaly_detected', 'system_error', 'rate_limit_exceeded'];
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
  
  const alerts: Alert[] = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const detected = new Date(now - Math.random() * 24 * 60 * 60 * 1000);
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const resolved = Math.random() > 0.4;
    
    alerts.push({
      alert_id: `alert_${Math.random().toString(36).substring(2, 15)}`,
      alert_type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      severity: severity,
      payment_transaction_id: Math.random() > 0.5 ? `txn_${Math.random().toString(36).substring(2, 15)}` : undefined,
      merchant_id: Math.random() > 0.5 ? `merchant_${Math.random().toString(36).substring(2, 10)}` : undefined,
      description: `Alert detected: ${alertTypes[Math.floor(Math.random() * alertTypes.length)]} with ${severity} severity`,
      detected_at: detected.toISOString(),
      resolved: resolved,
      resolved_at: resolved ? new Date(detected.getTime() + Math.random() * 3600000).toISOString() : undefined,
      metadata: {
        threshold: Math.random() * 1000,
        current_value: Math.random() * 2000
      }
    });
  }
  
  return alerts.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
};

export const generateMockAuditLogs = (transactionId: string): AuditLog[] => {
  const eventTypes: PaymentEventType[] = [
    PaymentEventType.PAYMENT_INITIATED,
    PaymentEventType.PAYMENT_PROCESSING,
    PaymentEventType.PAYMENT_COMPLETED,
    PaymentEventType.PAYMENT_FAILED
  ];
  const states: PaymentTransactionState[] = ['pending', 'processing', 'completed', 'failed'];
  const services = ['node-api', 'go-worker', 'payment-gateway'];
  
  const logs: AuditLog[] = [];
  const now = Date.now();
  let previousState: PaymentTransactionState | undefined = undefined;
  
  for (let i = 0; i < eventTypes.length; i++) {
    const eventType = eventTypes[i];
    const newState = states[Math.min(i, states.length - 1)];
    const timestamp = new Date(now - (eventTypes.length - i) * 60000);
    
    logs.push({
      audit_log_id: `log_${Math.random().toString(36).substring(2, 15)}`,
      payment_transaction_id: transactionId,
      event_id: `evt_${Math.random().toString(36).substring(2, 15)}`,
      event_type: eventType,
      previous_state: previousState,
      new_state: newState,
      timestamp: timestamp.toISOString(),
      source_service: services[Math.floor(Math.random() * services.length)],
      correlation_id: `corr_${Math.random().toString(36).substring(2, 10)}`,
      metadata: {
        processing_time_ms: Math.floor(Math.random() * 500) + 50
      }
    });
    
    previousState = newState;
  }
  
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const generateMockHealthStatus = (): HealthStatus => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'production',
    checks: {
      'postgres': { status: 'healthy', message: 'Connection pool active' },
      'redis': { status: 'healthy', message: 'Cache operational' },
      'node-api': { status: 'healthy', message: 'All routes responding' },
      'go-worker': { status: 'healthy', message: 'Processing queue normally' },
      'sqs': { status: 'healthy', message: 'Queue accessible' }
    }
  };
};

export const generateMockQueueStats = (): QueueStats => {
  return {
    ApproximateNumberOfMessages: Math.floor(Math.random() * 100) + 10,
    ApproximateNumberOfMessagesInFlight: Math.floor(Math.random() * 20) + 2,
    ApproximateNumberOfMessagesInDeadLetterQueue: Math.floor(Math.random() * 5)
  };
};

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector or route
  action?: () => void | Promise<void>;
  waitFor?: number; // milliseconds to wait before next step
  highlight?: string; // element to highlight
  closeModal?: boolean; // whether to close modal after opening
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    id: '1',
    title: 'Welcome to PayFlow Demo',
    description: 'This walkthrough will show you all the features of PayFlow Enterprise Console. Let\'s start!',
    waitFor: 4000
  },
  {
    id: '2',
    title: 'Overview Dashboard',
    description: 'Here you can see real-time metrics, health status, and system overview.',
    target: '/dashboard',
    waitFor: 5000
  },
  {
    id: '3',
    title: 'Health Score Modal',
    description: 'Click on the Health Score card to see detailed system health information.',
    target: '/dashboard',
    highlight: '[data-demo="health-score"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '4',
    title: 'Queue Depth Modal',
    description: 'View the ingestion queue metrics and statistics.',
    target: '/dashboard',
    highlight: '[data-demo="queue-depth"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '5',
    title: 'Latency Distribution',
    description: 'Check global latency metrics and performance data.',
    target: '/dashboard',
    highlight: '[data-demo="latency"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '6',
    title: 'Payments Explorer',
    description: 'Navigate to the Payments Explorer to view all transactions.',
    target: '/payments',
    waitFor: 5000
  },
  {
    id: '7',
    title: 'Ingest New Transaction',
    description: 'Click the "New Ingest" button to create a new payment transaction.',
    target: '/payments',
    highlight: '[data-demo="new-ingest"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '8',
    title: 'View Transaction Details',
    description: 'Click on any transaction row to see detailed information and audit trail.',
    target: '/payments',
    highlight: '[data-demo="transaction-row"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '9',
    title: 'Transaction Timeline',
    description: 'Scroll through the event timeline to see the complete transaction lifecycle.',
    target: '/payments',
    waitFor: 4000
  },
  {
    id: '10',
    title: 'Alerts Page',
    description: 'Navigate to the Alerts page to view system alerts and notifications.',
    target: '/alerts',
    waitFor: 5000
  },
  {
    id: '11',
    title: 'Alert Actions',
    description: 'Use the dropdown menu to acknowledge or resolve alerts.',
    target: '/alerts',
    highlight: '[data-demo="alert-actions"]',
    waitFor: 5000
  },
  {
    id: '12',
    title: 'System Health Page',
    description: 'View detailed system health information and service status.',
    target: '/health',
    waitFor: 5000
  },
  {
    id: '13',
    title: 'Automation Page',
    description: 'Explore the automation and rules engine configuration.',
    target: '/automation',
    waitFor: 5000
  },
  {
    id: '14',
    title: 'Create Automation Rule',
    description: 'Click "Create Rule" to see how to set up automated processing rules.',
    target: '/automation',
    highlight: '[data-demo="create-rule"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '15',
    title: 'Audit Logs',
    description: 'View comprehensive audit logs for compliance and tracking.',
    target: '/audit',
    waitFor: 5000
  },
  {
    id: '16',
    title: 'Batch Jobs',
    description: 'Check scheduled and running batch jobs.',
    target: '/batch-jobs',
    waitFor: 5000
  },
  {
    id: '17',
    title: 'User Profile',
    description: 'Navigate to your profile to view and edit account information.',
    target: '/profile',
    waitFor: 5000
  },
  {
    id: '18',
    title: 'Profile Dropdown',
    description: 'Click on your profile in the top navigation to see the dropdown menu.',
    highlight: '[data-demo="profile-dropdown"]',
    waitFor: 5000
  },
  {
    id: '19',
    title: 'Settings Page',
    description: 'Access system settings and configuration options.',
    target: '/settings',
    waitFor: 5000
  },
  {
    id: '20',
    title: 'Settings Sections',
    description: 'Explore different settings sections: preferences, security, and integrations.',
    target: '/settings',
    waitFor: 5000
  },
  {
    id: '21',
    title: 'Help Center',
    description: 'Access the help center for documentation and support.',
    highlight: '[data-demo="help-center"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '22',
    title: 'AI Chat Assistant',
    description: 'Try the AI chat assistant for help with the platform.',
    highlight: '[data-demo="ai-chat"]',
    waitFor: 6000,
    closeModal: true
  },
  {
    id: '23',
    title: 'Demo Complete!',
    description: 'You\'ve seen all the major features of PayFlow. Start using the platform with real data!',
    waitFor: 4000
  }
];

