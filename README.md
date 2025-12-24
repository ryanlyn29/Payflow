# PayFlow Enterprise Console

A production-grade distributed platform for payment processing and real-time transaction monitoring.

## Architecture Overview

This platform uses a clean separation between frontend and backend services, with each technology chosen for its specific strengths in the payment processing domain.

### Directory Structure

```
payflow-enterprise-console/
├── frontend/
│   └── react/          # React TypeScript enterprise console
├── backend/
│   ├── node-api/       # Node.js TypeScript REST API gateway
│   └── go-worker/      # Go asynchronous payment processing workers
├── tools/
│   └── python/         # Python analysis and automation tools
└── infra/
    ├── docker/         # Docker configurations
    └── k8s/            # Kubernetes manifests
```

## Technology Stack

### Frontend

- **React (TypeScript)**: Enterprise console with full CRUD operations, system health monitoring, and interactive demo walkthrough
- **Features**: 
  - Payment transaction explorer with real-time filtering
  - Alert management and monitoring
  - System health dashboards
  - Audit log viewer
  - Automation rules engine UI
  - User profile and settings management
  - Google OAuth authentication
  - AI-powered chat assistant (Gemini integration)
  - Interactive demo walkthrough (23 steps)
  - Responsive design with dark mode support

### Backend Services

- **Node.js (TypeScript)**: REST API gateway handling authentication, request validation, state transitions, and business logic
- **Go**: High-throughput asynchronous workers for payment event processing from SQS queues

### Data Layer

- **PostgreSQL**: Persistent storage for users, payments, alerts, audits, and all transaction data
- **Redis**: Caching, rate limiting, session storage, and idempotency keys

### Messaging

- **Amazon SQS**: Asynchronous message queue with dead-letter queues for payment event processing

### Infrastructure

- **Docker**: All services containerized
- **Kubernetes**: Service orchestration and scaling

### Tooling

- **Python**: Analysis tools, replay scripts, load testing, chaos engineering
- **Git**: Source control

## Architecture Decisions

### Why Node.js for the API Gateway?

Node.js serves as the API gateway because:
- Rapid development with TypeScript for type safety
- Excellent ecosystem for authentication (JWT, OAuth)
- Efficient handling of I/O-bound operations (database queries, Redis operations)
- Single-threaded event loop suits request/response patterns
- Easy integration with frontend React application

### Why Go for Background Workers?

Go is used for asynchronous payment processing because:
- Excellent concurrency model (goroutines) for handling multiple SQS messages
- High performance for CPU-bound validation and state transition logic
- Strong AWS SDK support for SQS integration
- Efficient memory usage for long-running worker processes
- Compile-time type safety without runtime overhead

### Why SQS for Async Processing?

Amazon SQS is chosen because:
- Managed service reduces operational overhead
- Built-in dead-letter queue support for failed messages
- Long polling reduces API calls and costs
- Visibility timeout prevents duplicate processing
- Scales automatically with message volume
- No infrastructure to manage compared to self-hosted Kafka

### How Redis Ensures Idempotency

Redis is used for idempotency by:
- Storing processed event IDs with TTL (24 hours)
- Checking for duplicate events before processing
- Using atomic operations to prevent race conditions
- Providing fast lookups (O(1)) for duplicate detection
- Serving as distributed lock mechanism when needed

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Go 1.21+
- PostgreSQL 16+
- Redis 7+

### Development Setup

#### Option 1: Docker Compose (Recommended)

1. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services:**

```bash
cd infra/docker
docker-compose up -d
```

3. **Access services:**

- Frontend: http://localhost:3000
- API: http://localhost:8080
- Health Check: http://localhost:8080/health
- PostgreSQL: localhost:5432
- Redis: localhost:6379

4. **View logs:**

```bash
docker-compose logs -f node-api
```

#### Option 2: Local Development

1. **Start infrastructure services:**

```bash
cd infra/docker
docker-compose up -d postgres redis
```

2. **Run database migrations:**

```bash
# Using Docker
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/002_auth_schema.sql

# Or locally (if psql is installed)
psql -U postgres -d paysignal -f backend/node-api/migrations/001_initial_schema.sql
psql -U postgres -d paysignal -f backend/node-api/migrations/002_auth_schema.sql
```

3. **Start backend services:**

```bash
# Node.js API
cd backend/node-api
npm install
npm run dev

# Go Worker (optional)
cd backend/go-worker
go mod download
go run main.go
```

4. **Start frontend:**

```bash
# React App
cd frontend/react
npm install
npm run dev
```

## Service Responsibilities

### Node.js API (`backend/node-api`)

- REST API gateway for frontend clients
- Authentication and authorization (JWT with access/refresh tokens)
- Google OAuth 2.0 integration
- User profiles and preferences management
- Payment transaction CRUD operations
- Request validation and state transition rules
- Alert management
- Audit log tracking
- System health monitoring
- Queue statistics
- Batch job management
- Rules engine (stored in PostgreSQL, validated in Node.js)
- Input validation and rate limiting
- Redis caching for performance
- PostgreSQL database operations

### Go Worker (`backend/go-worker`)

- High-throughput payment event processing from SQS
- Idempotency checks via Redis
- State transition validation
- Retry logic with exponential backoff
- Dead-letter queue handling
- Database updates and audit log creation

### Python Tools (`tools/python`)

- **replay.py**: Replay historical events for testing
- **backfill.py**: Backfill missing transaction data
- **load_test.py**: Load testing with Locust
- **chaos_test.py**: Chaos engineering and failure simulation
- **analyze.py**: Offline transaction analysis

## Deployment

### Docker Compose

```bash
cd infra/docker
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/
```

## API Documentation

### Authentication

```bash
# Sign up
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "password",
  "name": "User Name"
}

# Login
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
# Returns: { user, accessToken, refreshToken }

# Refresh token
POST /api/v1/auth/refresh
{
  "refreshToken": "token"
}

# Logout
POST /api/v1/auth/logout
{
  "refreshToken": "token"
}

# Google OAuth
GET /api/v1/auth/oauth/google
GET /api/v1/auth/oauth/google/callback

# Email verification
GET /api/v1/auth/verify-email?token=verification-token
POST /api/v1/auth/resend-verification
{
  "email": "user@example.com"
}

# Password reset
POST /api/v1/auth/forgot-password
{
  "email": "user@example.com"
}
POST /api/v1/auth/reset-password
{
  "token": "reset-token",
  "password": "new-password"
}
```

### Transactions

```bash
# List transactions
GET /api/v1/transactions?merchant_id=MERC-001&limit=50&offset=0

# Get transaction by ID
GET /api/v1/transactions/:transactionId

# Create transaction
POST /api/v1/transactions
{
  "merchant_id": "merchant_123",
  "amount": 100.00,
  "currency": "USD",
  "payer_id": "payer_123",
  "current_state": "pending",
  "metadata": {}
}

# Get audit logs for transaction
GET /api/v1/transactions/:transactionId/audit-logs
```

### Alerts

```bash
# List alerts
GET /api/v1/alerts

# Get alert by ID
GET /api/v1/alerts/:alertId

# Acknowledge alert
POST /api/v1/alerts/:alertId/acknowledge
```

### Health & Monitoring

```bash
# System health
GET /api/v1/health

# Queue statistics
GET /api/v1/queue/stats
```

### Users

```bash
# Get current user
GET /api/v1/users/me

# Update user preferences
PATCH /api/v1/users/me/preferences
{
  "theme": "dark",
  "density": "comfortable",
  "notifications_enabled": true
}
```

### Rules

```bash
# List rules
GET /api/v1/rules

# Create rule
POST /api/v1/rules
{
  "name": "rule-name",
  "description": "Rule description",
  "enabled": true,
  "rule_definition": {}
}

# Update rule
PUT /api/v1/rules/:ruleId
```

### Audit Logs

```bash
# List audit logs
GET /api/v1/audit?limit=50&offset=0
```

### Batch Jobs

```bash
# List batch jobs
GET /api/v1/batch-jobs

# Get job by ID
GET /api/v1/batch-jobs/:jobId
```

## Frontend Features

### Pages

- **Landing Page**: Marketing page with hero section, features, and demo walkthrough
- **Dashboard/Overview**: Real-time metrics, health scores, queue depth, latency monitoring
- **Payments Explorer**: Transaction listing, filtering, search, and detailed transaction inspection
- **Alerts**: Alert management with severity filtering and acknowledgment
- **System Health**: Service status monitoring and health checks
- **Automation**: Rules engine configuration and management
- **Audit Logs**: Comprehensive audit trail viewer
- **Batch Jobs**: Scheduled and running job monitoring
- **Profile**: User profile and account management
- **Settings**: System preferences and configuration

### Components

- **AI Chat Assistant**: Gemini-powered chat for platform assistance
- **Demo Walkthrough**: Interactive 23-step tour of all features
- **Onboarding**: First-time user guidance
- **Help Center**: Comprehensive documentation and help
- **Notification System**: Real-time notifications and alerts
- **OAuth Integration**: Google OAuth 2.0 authentication

## Development Guidelines

1. **Service Boundaries**: Each service has clear responsibilities and communicates via well-defined APIs
2. **Language Justification**: Each language is used for its strengths:
   - Node.js: Rapid API development, ecosystem, JWT authentication, request validation
   - Go: Concurrency, performance, SQS queue processing, state validation
   - Python: Data analysis and tooling
3. **Error Handling**: All services implement proper error handling and logging
4. **Testing**: Unit and integration tests required for all services
5. **Code Quality**: Codebase is production-ready

## Implementation Status

### Fully Implemented

- JWT authentication with access/refresh tokens
- Google OAuth 2.0 integration
- Node.js API gateway with full CRUD operations
- Go SQS workers with idempotency and retry logic
- PostgreSQL database (all persistent storage)
- Redis caching, rate limiting, and idempotency
- Docker containerization
- Kubernetes manifests
- Frontend dashboard with all pages
- Demo walkthrough system
- AI chat integration (Gemini)

## License

Proprietary - Internal Enterprise Platform
