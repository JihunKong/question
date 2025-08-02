#!/bin/bash
# Railway API startup script with optimized Railway deployment

echo "Starting API service..."
echo "Current directory: $(pwd)"
echo "NODE_ENV: ${NODE_ENV:-development}"
echo "PORT: ${PORT:-3001}"

# For Railway: Start server immediately and run migrations in background
if [ -n "$DATABASE_URL" ] && [ -n "$RAILWAY_ENVIRONMENT" ]; then
  echo "Railway environment detected - starting server with background migration"
  
  # Start migrations in background
  (
    echo "Background migration starting..."
    ./migrate.sh && echo "Migration completed successfully" || echo "Migration failed"
  ) &
  
  # Start server immediately - use simple version if main fails
  echo "Starting API server (migrations running in background)..."
  if [ -f "services/api/dist/index-simple.js" ]; then
    echo "Using simple server for Railway startup..."
    exec node services/api/dist/index-simple.js
  else
    exec node services/api/dist/index.js
  fi
else
  # Non-Railway environment: Run migrations first (original behavior)
  if [ -n "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    ./migrate.sh
  else
    echo "DATABASE_URL not set, skipping migrations"
  fi
  
  # Start the API service
  echo "Starting API server..."
  exec node services/api/dist/index.js
fi