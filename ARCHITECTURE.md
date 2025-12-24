# PayFlow Enterprise Platform - Architecture Documentation

## System Overview

PayFlow is a distributed platform designed for high-throughput payment processing with enterprise-grade reliability and observability.

## Service Architecture

### Frontend Layer

#### React Application (`frontend/react`)
- **Purpose**: Primary enterprise console for operators and administrators
- **Technology**: React 19, TypeScript, Vite, React Router
- **Features**:
  - Full CRUD operations for payments, alerts, audit logs
  - Real-time dashboard with metrics
  - User authentication and authorization
  - Light/dark mode support
  - Responsive design

### Backend Services

#### Node.js API Gateway (`backend/node-api`)
- **Language**: TypeScript/Node.js
- **Framework**: Express.js
- **Responsibilities**:
  - REST API for frontend clients
  - JWT-based authentication
  - Google OAuth 2.0 integration
  - User management and preferences
  - Input validation (express-validator)
  - State transition validation
  - Rate limiting (express-rate-limit)
  - Health check aggregation
  - Request/response logging
  - Business rule validation

**API Endpoints**:
- `POST /api/v1/auth/login` - User authentication
- `GET /api/v1/transactions` - List transactions
- `GET /api/v1/transactions/:id` - Get transaction details
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/alerts` - List alerts
- `GET /api/v1/audit/transactions/:id` - Get audit logs
- `GET /health` - Health check

#### Go Worker Service (`backend/go-worker`)
- **Language**: Go 1.21
- **Responsibilities**:
  - High-throughput payment event processing
  - SQS queue consumption with long polling
  - Concurrent worker pool (configurable size)
  - Retry logic with exponential backoff
  - Idempotency checks via Redis
  - State transition validation
  - Dead-letter queue handling

**Key Features**:
- Worker pool pattern for concurrent processing
- Exponential backoff: 1s → 5min max
- Max retries: 15 attempts
- Visibility timeout extension during retries
- Redis-based duplicate detection
- Inline state transition validation

### Data Layer

#### PostgreSQL
- **Purpose**: Persistent relational data
- **Tables**:
  - `users` - User accounts and preferences
  - `payment_transactions` - Transaction records
  - `audit_logs` - Event audit trail
  - `alerts` - System alerts
  - `rules` - Business rule definitions

**Indexes**:
- Transaction lookups by merchant, state, date
- Audit logs by transaction, timestamp
- Alerts by severity, resolved status

#### Redis
- **Purpose**: Caching, rate limiting, and idempotency
- **Use Cases**:
  - API response caching (30s TTL)
  - Idempotency keys (24h TTL)
  - Rate limiting counters
  - Session storage

### Messaging

#### Amazon SQS
- **Queue**: `payment-events`
- **Features**:
  - Long polling (20s)
  - Visibility timeout (30s)
  - Dead-letter queue (15 max receives)
  - Message retention (4 days)

### Infrastructure

#### Docker
- All services containerized
- Multi-stage builds for optimization
- Health checks configured
- Volume mounts for persistence

#### Kubernetes
- Namespace: `paysignal`
- Deployments with replicas:
  - Node API: 3 replicas
  - Go Worker: 5 replicas
- StatefulSet: PostgreSQL
- Services: ClusterIP and LoadBalancer
- Health probes: Liveness and readiness

## Data Flow

### Payment Processing Flow

1. **Event Ingestion**: Payment events arrive via SQS
2. **Go Worker**: Consumes events from queue
3. **Idempotency Check**: Redis checks for duplicate events
4. **State Validation**: Go worker validates state transitions
5. **State Update**: Go worker updates PostgreSQL
6. **Audit Logging**: Event logged to audit_logs table
7. **Alert Generation**: Alerts created if rules trigger
8. **Cache Update**: Redis updated for idempotency

### API Request Flow

1. **Frontend**: React app makes API request
2. **Node.js API**: Receives request, validates auth
3. **Rate Limiting**: Checks Redis for rate limits
4. **Cache Check**: Redis lookup for cached responses
5. **Database Query**: PostgreSQL query if not cached
6. **Response**: JSON response with caching headers
7. **Logging**: Request/response logged

## Service Communication

### Synchronous (HTTP/REST)
- Frontend → Node.js API

### Asynchronous (Queue)
- Event Producers → SQS
- SQS → Go Workers

### Shared State
- All services → Redis (caching, idempotency)
- All services → PostgreSQL (persistence)

## Security

- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control (admin, operator, read_only)
- **Rate Limiting**: Per-IP rate limits on API
- **Input Validation**: All inputs validated
- **HTTPS**: TLS for all external communication
- **Secrets Management**: Kubernetes secrets, environment variables

## Observability

- **Logging**: Structured JSON logs (Winston, Logrus)
- **Health Checks**: `/health` endpoints on all services
- **Tracing**: Correlation IDs for request tracking
- **Monitoring**: Kubernetes health probes

## Scalability

- **Horizontal Scaling**: Stateless services scale via Kubernetes
- **Worker Pool**: Go workers scale independently
- **Database**: Read replicas for PostgreSQL
- **Caching**: Redis cluster for high availability
- **Queue**: SQS handles high throughput

## Failure Handling

- **Retries**: Exponential backoff in Go workers
- **Dead Letter Queue**: Failed messages after max retries
- **Graceful Degradation**: Fallback responses when services unavailable
- **Health Checks**: Automatic restart of unhealthy pods

## Performance Targets

- **API Latency**: P95 < 200ms, P99 < 500ms
- **Worker Throughput**: 1000+ events/second per worker
- **Idempotency Check**: < 1ms per check
- **State Validation**: < 10ms per validation
- **Database Queries**: < 100ms for indexed queries

## Future Enhancements

- gRPC for inter-service communication
- GraphQL API layer
- Event sourcing for audit logs
- Real-time streaming with WebSockets
- Machine learning for fraud detection
- Distributed tracing with OpenTelemetry
