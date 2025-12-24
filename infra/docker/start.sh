#!/bin/bash
# PaySignal Enterprise Console - Docker Startup Script

set -e

echo "=========================================="
echo "PaySignal Enterprise Console"
echo "Starting Docker services..."
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Using defaults from docker-compose.yml"
    echo "Copy .env.example to .env and update with your values for production."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "Error: docker-compose or docker compose is not installed."
    exit 1
fi

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Start services
echo ""
echo "Starting infrastructure services (PostgreSQL, Redis)..."
$COMPOSE_CMD up -d postgres redis

echo ""
echo "Waiting for database to be ready..."
sleep 5

echo ""
echo "Starting backend services..."
$COMPOSE_CMD up -d node-api

echo ""
echo "Waiting for API to be ready..."
sleep 10

echo ""
echo "Starting remaining services..."
$COMPOSE_CMD up -d

echo ""
echo "=========================================="
echo "Services started successfully!"
echo "=========================================="
echo ""
echo "Services:"
echo "  - Frontend:     http://localhost:3000"
echo "  - API:          http://localhost:8080"
echo "  - Health Check: http://localhost:8080/health"
echo "  - PostgreSQL:   localhost:5432"
echo "  - Redis:        localhost:6379"
echo ""
echo "To view logs:"
echo "  $COMPOSE_CMD logs -f [service-name]"
echo ""
echo "To stop services:"
echo "  $COMPOSE_CMD down"
echo ""

