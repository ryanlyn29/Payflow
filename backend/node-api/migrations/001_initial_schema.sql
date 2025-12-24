-- PaySignal Enterprise Platform - Initial Schema
-- PostgreSQL Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'read_only')),
    password_hash VARCHAR(255) NOT NULL,
    preferences JSONB DEFAULT '{"theme": "dark", "density": "comfortable", "notifications_enabled": true, "default_region": "us-east-1"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    payment_transaction_id VARCHAR(100) PRIMARY KEY,
    merchant_id VARCHAR(100) NOT NULL,
    payer_id VARCHAR(100),
    amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    current_state VARCHAR(50) NOT NULL CHECK (current_state IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_event_id VARCHAR(100),
    retry_count INTEGER DEFAULT 0,
    failure_reason TEXT,
    metadata JSONB
);

CREATE INDEX idx_transactions_merchant ON payment_transactions(merchant_id);
CREATE INDEX idx_transactions_state ON payment_transactions(current_state);
CREATE INDEX idx_transactions_created ON payment_transactions(created_at);
CREATE INDEX idx_transactions_updated ON payment_transactions(updated_at);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_log_id VARCHAR(100) PRIMARY KEY,
    payment_transaction_id VARCHAR(100) NOT NULL REFERENCES payment_transactions(payment_transaction_id),
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    previous_state VARCHAR(50),
    new_state VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_service VARCHAR(100) NOT NULL,
    correlation_id VARCHAR(100),
    metadata JSONB
);

CREATE INDEX idx_audit_transaction ON audit_logs(payment_transaction_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_correlation ON audit_logs(correlation_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(100) PRIMARY KEY,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    payment_transaction_id VARCHAR(100) REFERENCES payment_transactions(payment_transaction_id),
    merchant_id VARCHAR(100),
    description TEXT NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(resolved);
CREATE INDEX idx_alerts_detected ON alerts(detected_at);
CREATE INDEX idx_alerts_transaction ON alerts(payment_transaction_id);

-- Rules table (for business rule definitions)
CREATE TABLE IF NOT EXISTS rules (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    version VARCHAR(50) NOT NULL,
    rule_definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rules_enabled ON rules(enabled);
CREATE INDEX idx_rules_version ON rules(version);

-- System metrics table (for C agent)
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    cpu_percent DECIMAL(5,2),
    memory_total BIGINT,
    memory_used BIGINT,
    memory_free BIGINT,
    load_avg_1m DECIMAL(10,2),
    load_avg_5m DECIMAL(10,2),
    load_avg_15m DECIMAL(10,2),
    process_count INTEGER,
    disk_total BIGINT,
    disk_used BIGINT,
    disk_free BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_hostname ON system_metrics(hostname);
CREATE INDEX idx_metrics_timestamp ON system_metrics(timestamp);

-- Insert default admin user (password: admin123 - change in production!)
INSERT INTO users (id, email, name, role, password_hash) VALUES
('USR-001', 'admin@paysignal.com', 'System Administrator', 'admin', '$2b$10$rQ8K8K8K8K8K8K8K8K8K8uK8K8K8K8K8K8K8K8K8K8K8K8K8K8K8')
ON CONFLICT (id) DO NOTHING;





