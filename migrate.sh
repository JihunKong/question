#!/bin/bash
# Migration script to run after DATABASE_URL is available

set -e  # Exit on error

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Skipping migration."
  exit 0
fi

echo "Waiting for database to be ready..."
# Simple retry logic for database connection
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma db execute --schema=packages/database/prisma/schema.prisma --stdin <<< "SELECT 1;" 2>/dev/null; then
    echo "Database is ready!"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Database connection timeout after $MAX_RETRIES attempts"
  exit 1
fi

echo "Generating Prisma client..."
npx prisma generate --schema=packages/database/prisma/schema.prisma

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed"
  exit 1
fi