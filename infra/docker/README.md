# Docker Infrastructure Setup

This directory contains Docker Compose configuration for running the PaySignal Enterprise Console.

## Quick Start

### Prerequisites

- Docker Desktop or Docker Engine 20.10+
- Docker Compose v2.0+ (or docker-compose v1.29+)

### Starting Services

1. **Copy environment file (optional):**
   ```bash
   cp ../../.env.example ../../.env
   # Edit .env with your values
   ```

2. **Start all services:**
   ```bash
   ./start.sh
   # Or manually:
   docker-compose up -d
   ```

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f node-api
   docker-compose logs -f postgres
   docker-compose logs -f redis
   ```

### Stopping Services

```bash
./stop.sh
# Or manually:
docker-compose down
```

### Reset Everything (WARNING: Deletes all data)

```bash
./reset.sh
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| `react-frontend` | 3000 | React frontend application |
| `node-api` | 8080 | Node.js API gateway |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache |
| `go-worker` | 8082 | Go worker service |

## Environment Variables

All environment variables can be set in a `.env` file in the project root. See `.env.example` for all available options.

### Required for Production

- `JWT_SECRET` - Strong secret for JWT tokens
- `JWT_REFRESH_SECRET` - Strong secret for refresh tokens
- `POSTGRES_PASSWORD` - Database password
- `FRONTEND_URL` - Frontend URL for CORS and email links

### Optional

- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/warn/error)
- `RATE_LIMIT_*` - Rate limiting configuration
- `POSTGRES_*` - PostgreSQL connection pool settings
- `REDIS_*` - Redis connection settings

## Network

All services are connected to the `paysignal-network` bridge network, allowing them to communicate using service names.

## Health Checks

All services have health checks configured:
- **PostgreSQL**: `pg_isready`
- **Redis**: `redis-cli ping`
- **Node API**: HTTP GET `/health/liveness`

## Volumes

- `postgres_data` - PostgreSQL data persistence
- `redis_data` - Redis data persistence

## Development vs Production

### Development Mode

- Services start even if dependencies are unavailable
- More lenient error handling
- Debug logging enabled
- Hot reload for frontend (if running locally)

### Production Mode

- Strict dependency checks
- PostgreSQL and Redis required
- Production logging
- Optimized builds

## Troubleshooting

### Services won't start

1. Check Docker is running: `docker info`
2. Check ports are available: `netstat -an | grep -E ':(3000|8080|5432|6379)'`
3. View logs: `docker-compose logs [service-name]`

### Database connection errors

1. Ensure PostgreSQL is healthy: `docker-compose ps postgres`
2. Check environment variables: `docker-compose exec node-api env | grep POSTGRES`
3. Verify network: `docker network inspect paysignal-network`

### Frontend can't connect to API

1. Check `VITE_API_BASE_URL` in frontend build
2. Verify CORS settings in node-api
3. Check browser console for errors

### Reset database

```bash
docker-compose down -v
docker-compose up -d postgres
# Wait for postgres to be ready
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/002_auth_schema.sql
```

## Database Migrations

Migrations are automatically run when PostgreSQL container starts for the first time. They are located in:
- `backend/node-api/migrations/001_initial_schema.sql`
- `backend/node-api/migrations/002_auth_schema.sql`

To run migrations manually:
```bash
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/001_initial_schema.sql
docker-compose exec postgres psql -U postgres -d paysignal -f /docker-entrypoint-initdb.d/002_auth_schema.sql
```

## Service Dependencies

```
postgres ──┐
           ├──> node-api ──> react-frontend
redis ─────┘
           └──> go-worker
```

## Building Images

To rebuild a specific service:
```bash
docker-compose build node-api
docker-compose up -d node-api
```

To rebuild all services:
```bash
docker-compose build
docker-compose up -d
```

