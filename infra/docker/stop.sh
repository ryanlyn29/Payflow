#!/bin/bash
# PaySignal Enterprise Console - Docker Stop Script

set -e

echo "Stopping PaySignal Enterprise Console services..."

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

$COMPOSE_CMD down

echo "Services stopped."

