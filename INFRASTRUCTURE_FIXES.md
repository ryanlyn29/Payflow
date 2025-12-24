# Infrastructure Fixes Summary

All Docker setup, environment variables, and service connections have been fixed and hardened.

## Docker Compose Improvements

### Network Configuration
- Added dedicated `paysignal-network` bridge network
- All services connected to the same network for service discovery
- Services can communicate using container names (e.g., `postgres`, `redis`, `node-api`)

### Service Health Checks
- **PostgreSQL**: `pg_isready` with 10s start period
- **Redis**: `redis-cli ping` with 5s start period
- **Node API**: HTTP GET `/health/liveness` with 40s start period
- All health checks have proper intervals, timeouts, and retries

### Service Dependencies
- Proper `depends_on` with `condition: service_healthy` for critical dependencies
- Services wait for dependencies to be healthy before starting
- Prevents race conditions and connection errors

### Environment Variables
- All environment variables use `${VAR:-default}` syntax for defaults
- Variables can be overridden via `.env` file
- Comprehensive environment variable documentation in `.env.example`

### Container Configuration
- All containers have explicit names (`paysignal-*`)
- `restart: unless-stopped` for all services
- Proper volume mounts with read-only where appropriate
- Health checks configured for all services

## Environment Variables

### Created `.env.example`
Comprehensive environment variable template with:
- Application settings (NODE_ENV, PORT, LOG_LEVEL)
- Database configuration (PostgreSQL connection pool settings)
- Redis configuration
- Authentication secrets (JWT_SECRET, JWT_REFRESH_SECRET)
- Rate limiting configuration
- Frontend URLs
- Service URLs
- Optional AWS/SQS configuration
- Optional email service configuration
- Optional OAuth configuration

### Docker Compose Environment Variables
All services now use environment variable substitution:
- `${VAR:-default}` - Use VAR if set, otherwise default
- Variables can be set in `.env` file or passed via command line
- Production-ready with secure defaults

## Dockerfile Improvements

### Node.js API Dockerfile
- Multi-stage build for smaller image size
- Added `wget` and `curl` for health checks
- Health check configured in Dockerfile
- Proper user permissions (runs as `node` user)
- Logs directory created with proper permissions

### Frontend Dockerfile
- Build-time environment variables via ARG
- Proper nginx configuration
- API proxy configuration
- Static asset caching
- Security headers

### Nginx Configuration
- API proxy to `node-api:8080`
- Health check proxy
- Gzip compression
- Security headers
- Static asset caching
- SPA routing support

## Service Connections

### Fixed Service URLs
- All services use Docker service names for internal communication
- `postgres` instead of `localhost` for database
- `redis` instead of `localhost` for Redis
- `node-api`, `java-rules`, `go-worker`, `cpp-dedup` for service-to-service communication

### Frontend API Connection
- Build-time `VITE_API_BASE_URL` via Docker build args
- Runtime API proxy via nginx (for Docker networking)
- Supports both direct API calls and nginx proxy

## Helper Scripts

### `start.sh`
- Checks Docker availability
- Checks for `.env` file
- Starts services in correct order
- Provides helpful output and next steps

### `stop.sh`
- Gracefully stops all services
- Clean shutdown

### `reset.sh`
- Removes all containers and volumes
- WARNING: Deletes all data
- Confirmation prompt for safety

## Volume Management

- `postgres_data`: Persistent PostgreSQL data
- `redis_data`: Persistent Redis data (with AOF enabled)
- Migration files mounted read-only to PostgreSQL container
- Automatic migration execution on first start

## Port Configuration

All ports are configurable via environment variables:
- `POSTGRES_PORT` (default: 5432)
- `REDIS_PORT` (default: 6379)
- `PORT` (default: 8080) - Node API
- `FRONTEND_PORT` (default: 3000)
- `JAVA_RULES_PORT` (default: 8081)
- `GO_WORKER_PORT` (default: 8082)
- `CPP_DEDUP_PORT` (default: 8083)

## Production Readiness

### Security
- Services run as non-root users where possible
- Read-only volume mounts for migrations
- Security headers in nginx
- Environment variable defaults are development-safe

### Reliability
- Health checks for all services
- Proper dependency management
- Automatic restart on failure
- Graceful shutdown handling

### Observability
- Health check endpoints
- Structured logging
- Container names for easy identification
- Network isolation

## Usage

### Quick Start
```bash
cd infra/docker
cp ../../.env.example ../../.env  # Optional: edit .env
./start.sh
```

### View Logs
```bash
docker-compose logs -f node-api
docker-compose logs -f postgres
```

### Stop Services
```bash
./stop.sh
```

### Reset Everything
```bash
./reset.sh  # WARNING: Deletes all data
```

## Troubleshooting

### Services won't start
1. Check Docker is running: `docker info`
2. Check ports are available
3. View logs: `docker-compose logs [service-name]`
4. Check health: `docker-compose ps`

### Database connection errors
1. Verify PostgreSQL is healthy: `docker-compose ps postgres`
2. Check environment variables: `docker-compose exec node-api env | grep POSTGRES`
3. Verify network: `docker network inspect paysignal-network`

### Frontend can't connect to API
1. Check `VITE_API_BASE_URL` in build args
2. Verify nginx proxy configuration
3. Check CORS settings in node-api
4. Verify services are on same network

## Migration Notes

- Old docker-compose.yml had hardcoded values - now uses environment variables
- Services now wait for dependencies to be healthy
- Network isolation added for security
- Health checks added for all services
- Volume persistence improved

