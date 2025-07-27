#!/bin/bash
# Migration script to run after DATABASE_URL is available

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set. Skipping migration."
  exit 0
fi

echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

if [ $? -eq 0 ]; then
  echo "Migrations completed successfully"
else
  echo "Migration failed"
  exit 1
fi