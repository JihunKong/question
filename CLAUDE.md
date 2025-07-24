# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a question exchange application designed for Railway deployment. It implements a sophisticated question management system with real-time collaboration, AI-powered value assessment, and a microservices architecture.

## Architecture

The project follows a microservices architecture with the following services:
- **API Service** (Node.js/Express): Handles core business logic and database operations
- **Web Service** (Next.js): Frontend application for user interaction
- **Realtime Service** (Socket.io + Yjs): WebSocket server for real-time collaboration
- **AI Processor** (Python/FastAPI): Evaluates question value using NLP models

### Key Technologies
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io with Redis adapter and Yjs for collaborative editing
- **AI/ML**: Transformers, BERT-based models for Korean text
- **Deployment**: Railway platform with automatic scaling

## Development Commands

Since this is a conceptual architecture document, actual implementation files don't exist yet. When implementing:

### API Service
```bash
cd services/api
npm install
npm run dev     # Development with hot reload
npm run build   # TypeScript compilation
npm run migrate # Apply database migrations
npm start       # Production start
```

### Web Service
```bash
cd services/web
npm install
npm run dev   # Next.js development server
npm run build # Production build
npm start     # Production server
```

### Realtime Service
```bash
cd services/realtime
npm install
npm run dev   # Development server
npm start     # Production server
```

### AI Processor
```bash
cd services/ai-processor
pip install -r requirements.txt
uvicorn main:app --reload  # Development
python main.py              # Production
```

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:
- **Question**: Core question entity with status, value score, and relationships
- **Context**: Detailed background information for each question
- **Tag**: Categorization system with usage tracking
- **QuestionChain**: Relationships between questions
- **Version tracking**: For both questions and contexts

## Key Implementation Patterns

1. **Transaction Management**: Use Prisma transactions for multi-table operations
2. **Async Processing**: AI evaluation runs in background tasks
3. **Real-time Sync**: Yjs documents for collaborative editing
4. **Service Communication**: HTTP APIs between microservices
5. **Error Handling**: Consistent error responses across services

## Environment Variables

Each service requires specific environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection for real-time features
- `JWT_SECRET`: Authentication secret
- Service URLs for inter-service communication

## Railway Deployment

The project is configured for Railway deployment with:
- Automatic builds using Nixpacks
- Health check endpoints for each service
- Database migrations on API service startup
- Service-specific start commands