// Simple Express API server for Railway - minimal dependencies
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      database: process.env.DATABASE_URL ? 'connected' : 'not-connected',
      redis: process.env.REDIS_URL ? 'connected' : 'not-connected'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Question Exchange API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        questions: '/api/questions',
        tags: '/api/tags'
      }
    }
  });
});

// Mock API endpoints (without database)
app.get('/api/questions', (req, res) => {
  res.json({
    success: true,
    data: {
      questions: [
        {
          id: '1',
          title: '한국 교육 시스템 개선 방안',
          content: '현재 한국 교육 시스템의 문제점과 개선 방안에 대해 논의해주세요.',
          status: 'active',
          value: 85,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: '효과적인 온라인 학습 방법',
          content: '코로나19 이후 온라인 학습이 보편화되었습니다. 효과적인 온라인 학습 방법은 무엇일까요?',
          status: 'active',
          value: 78,
          createdAt: new Date().toISOString()
        }
      ],
      total: 2,
      page: 1,
      limit: 10
    }
  });
});

app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    data: {
      tags: [
        { id: '1', name: '교육', count: 15 },
        { id: '2', name: '온라인학습', count: 8 },
        { id: '3', name: '학습방법', count: 12 }
      ]
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'teacher'
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: {
        message: 'Email and password are required',
        code: 'INVALID_CREDENTIALS'
      }
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not connected (using mock data)'}`);
  console.log(`API available at: http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});