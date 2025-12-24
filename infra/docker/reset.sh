#!/bin/bash
# PaySignal Enterprise Console - Docker Reset Script
# WARNING: This will delete all data volumes!

set -e

read -p "This will delete all data volumes. Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "Stopping and removing all containers and volumes..."

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

$COMPOSE_CMD down -v

echo "All containers and volumes removed."
echo "Run ./start.sh to start fresh."

