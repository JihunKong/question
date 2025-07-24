#!/bin/bash

echo "🚀 Setting up Question Exchange Platform for development..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Create .env files from examples
echo "📝 Creating environment files..."
cp .env.example .env 2>/dev/null || echo "⚠️  .env.example not found"
cp services/api/.env.example services/api/.env 2>/dev/null || echo "⚠️  API .env.example not found"
cp services/realtime/.env.example services/realtime/.env 2>/dev/null || echo "⚠️  Realtime .env.example not found"
cp services/ai-processor/.env.example services/ai-processor/.env 2>/dev/null || echo "⚠️  AI Processor .env.example not found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run generate -w @question-exchange/database

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run database migrations
echo "🗄️  Running database migrations..."
npm run migrate -w @question-exchange/database

# Seed database (optional)
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npm run seed -w @question-exchange/database
fi

echo "✅ Development setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  npm run dev"
echo ""
echo "Services will be available at:"
echo "  - API: http://localhost:3001"
echo "  - Web: http://localhost:3000"
echo "  - Realtime: ws://localhost:3002"
echo "  - AI Processor: http://localhost:3003"