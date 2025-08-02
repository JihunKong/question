#!/bin/bash
# Railway API startup script with proper error handling

echo "Starting API service..."
echo "Current directory: $(pwd)"
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "PORT: ${PORT:-3001}"

# Run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  ./migrate.sh
else
  echo "DATABASE_URL not set, skipping migrations"
fi

# Start the API service
echo "Starting API server..."
exec node services/api/dist/index.js