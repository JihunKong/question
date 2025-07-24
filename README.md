# Question Exchange Platform

A sophisticated question management system with real-time collaboration, AI-powered value assessment, and microservices architecture designed for Railway deployment.

## Railway 프로젝트 구조

```
question-exchange-app/
├── services/
│   ├── api/                 # Node.js/Express API
│   ├── web/                 # Next.js 프론트엔드
│   ├── realtime/            # WebSocket 서버
│   └── ai-processor/        # Python AI 서비스
├── packages/
│   ├── shared/              # 공유 타입, 유틸리티
│   └── database/            # Prisma 스키마
├── railway.json
└── .env.example
```

## Railway 서비스 구성

### 1. PostgreSQL Database 설정
```yaml
# railway.json
{
  "version": 1,
  "services": {
    "postgres": {
      "image": "railway/postgresql:13",
      "volumes": ["/var/lib/postgresql/data"]
    }
  }
}
```

### 2. API 서비스 (Node.js + Express)
```javascript
// services/api/package.json
{
  "name": "question-api",
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "migrate": "prisma migrate deploy"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0"
  }
}

// services/api/src/index.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

// 질문 생성 엔드포인트
app.post('/api/questions', async (req, res) => {
  try {
    const { coreQuestion, context, tags } = req.body;
    
    // 트랜잭션으로 질문과 관련 데이터 생성
    const result = await prisma.$transaction(async (tx) => {
      // 질문 생성
      const question = await tx.question.create({
        data: {
          coreQuestion,
          status: 'draft',
          valueScore: 0
        }
      });
      
      // 맥락 생성
      const contextData = await tx.context.create({
        data: {
          questionId: question.id,
          background: context.background,
          priorKnowledge: context.priorKnowledge,
          attemptedApproach: context.attemptedApproach,
          expectedUse: context.expectedUse
        }
      });
      
      // 태그 처리
      const tagPromises = tags.map(async (tagName: string) => {
        const tag = await tx.tag.upsert({
          where: { name: tagName },
          update: { usageCount: { increment: 1 } },
          create: { name: tagName }
        });
        
        return tx.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tag.id
          }
        });
      });
      
      await Promise.all(tagPromises);
      
      return { question, context: contextData };
    });
    
    // AI 가치 평가 요청 (비동기)
    await fetch(`${process.env.AI_SERVICE_URL}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: result.question.id })
    });
    
    res.json(result);
  } catch (error) {
    console.error('Question creation error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

### 3. Prisma 스키마 설정
```prisma
// packages/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Question {
  id            String   @id @default(cuid())
  coreQuestion  String
  status        Status   @default(DRAFT)
  valueScore    Float    @default(0)
  reusability   Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  context       Context?
  tags          QuestionTag[]
  chains        QuestionChain[] @relation("ParentQuestion")
  childChains   QuestionChain[] @relation("ChildQuestion")
  versions      QuestionVersion[]
  
  @@index([status, createdAt])
  @@index([valueScore])
}

model Context {
  id                String   @id @default(cuid())
  questionId        String   @unique
  background        String
  priorKnowledge    String
  attemptedApproach String
  expectedUse       String
  
  question          Question @relation(fields: [questionId], references: [id])
  versions          ContextVersion[]
  
  @@index([questionId])
}

model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String?
  usageCount  Int      @default(0)
  
  questions   QuestionTag[]
}

model QuestionTag {
  questionId  String
  tagId       String
  
  question    Question @relation(fields: [questionId], references: [id])
  tag         Tag      @relation(fields: [tagId], references: [id])
  
  @@id([questionId, tagId])
  @@index([tagId])
}

enum Status {
  DRAFT
  PUBLISHED
  ANSWERED
  ARCHIVED
}
```

### 4. Next.js 프론트엔드
```typescript
// services/web/app/questions/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from '@/components/QuestionForm';
import { RealtimeCollaboration } from '@/components/RealtimeCollaboration';

export default function NewQuestionPage() {
  const router = useRouter();
  const [questionId, setQuestionId] = useState<string | null>(null);
  
  const handleQuestionCreate = async (data: QuestionFormData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      setQuestionId(result.question.id);
      
      // 실시간 협업 모드 활성화
      if (data.enableCollaboration) {
        return <RealtimeCollaboration questionId={result.question.id} />;
      }
      
      router.push(`/questions/${result.question.id}`);
    } catch (error) {
      console.error('Failed to create question:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">새 질문 만들기</h1>
      <QuestionForm onSubmit={handleQuestionCreate} />
    </div>
  );
}
```

### 5. WebSocket 서버 (실시간 협업)
```typescript
// services/realtime/src/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000'
  }
});

// Redis 어댑터 설정 (Railway Redis 사용)
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// Yjs 문서 관리
const docs = new Map<string, Y.Doc>();

io.on('connection', (socket) => {
  socket.on('join-question', async (questionId: string) => {
    // 권한 검증
    const hasAccess = await verifyAccess(socket.handshake.auth.token, questionId);
    if (!hasAccess) {
      socket.disconnect();
      return;
    }
    
    socket.join(`question:${questionId}`);
    
    // Yjs 문서 설정
    let doc = docs.get(questionId);
    if (!doc) {
      doc = new Y.Doc();
      docs.set(questionId, doc);
      
      // 기존 데이터 로드
      const existingData = await loadQuestionData(questionId);
      if (existingData) {
        const questionText = doc.getText('question');
        questionText.insert(0, existingData.coreQuestion);
        
        const contextMap = doc.getMap('context');
        Object.entries(existingData.context).forEach(([key, value]) => {
          contextMap.set(key, value);
        });
      }
    }
    
    // 동기화 설정
    setupWSConnection(socket, questionId, doc);
  });
  
  // 변경사항 저장
  socket.on('save-changes', async (questionId: string, updates: any) => {
    await saveQuestionUpdates(questionId, updates);
    socket.to(`question:${questionId}`).emit('changes-saved', updates);
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`Realtime server running on port ${PORT}`);
});
```

### 6. Python AI 평가 서비스
```python
# services/ai-processor/main.py
from fastapi import FastAPI, BackgroundTasks
import os
import asyncpg
from transformers import pipeline
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# NLP 모델 초기화
embedder = pipeline('feature-extraction', model='klue/bert-base')
classifier = pipeline('text-classification', model='custom-question-quality')

# Railway PostgreSQL 연결
DATABASE_URL = os.environ.get('DATABASE_URL')

@app.post("/evaluate")
async def evaluate_question(question_id: str, background_tasks: BackgroundTasks):
    """질문 가치 평가 비동기 처리"""
    background_tasks.add_task(process_evaluation, question_id)
    return {"status": "evaluation_started", "question_id": question_id}

async def process_evaluation(question_id: str):
    # DB에서 질문 데이터 조회
    conn = await asyncpg.connect(DATABASE_URL)
    
    question_data = await conn.fetchrow(
        """
        SELECT q.core_question, c.background, c.prior_knowledge, 
               c.attempted_approach, c.expected_use
        FROM questions q
        JOIN contexts c ON q.id = c.question_id
        WHERE q.id = $1
        """,
        question_id
    )
    
    # 다차원 평가
    scores = {
        'context_completeness': evaluate_context_completeness(question_data),
        'question_quality': evaluate_question_quality(question_data['core_question']),
        'ripple_effect': evaluate_ripple_effect(question_data),
        'originality': evaluate_originality(question_data['core_question']),
        'interactivity': evaluate_interaction_potential(question_data)
    }
    
    # 가중 평균 계산
    weights = get_dynamic_weights(question_data)
    total_score = sum(scores[k] * weights[k] for k in scores)
    
    # 결과 저장
    await conn.execute(
        """
        UPDATE questions 
        SET value_score = $1, updated_at = NOW()
        WHERE id = $2
        """,
        total_score, question_id
    )
    
    await conn.close()

def evaluate_context_completeness(data):
    """맥락 완성도 평가"""
    context_text = f"{data['background']} {data['prior_knowledge']} {data['attempted_approach']}"
    
    # 텍스트 임베딩
    embeddings = embedder(context_text)
    
    # 일관성 점수 계산
    sentences = context_text.split('.')
    if len(sentences) > 1:
        sent_embeddings = [embedder(s)[0] for s in sentences if s.strip()]
        coherence = np.mean([
            cosine_similarity([sent_embeddings[i]], [sent_embeddings[i+1]])[0][0]
            for i in range(len(sent_embeddings)-1)
        ])
    else:
        coherence = 0.5
    
    # 길이와 구체성 점수
    word_count = len(context_text.split())
    specificity = min(word_count / 100, 1.0)
    
    return coherence * 0.6 + specificity * 0.4

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-processor"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 3003)))
```

### 7. Railway 배포 설정
```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "services": [
    {
      "name": "api",
      "source": {
        "repo": "services/api"
      },
      "deploy": {
        "startCommand": "npm run migrate && npm start",
        "healthcheckPath": "/health"
      }
    },
    {
      "name": "web",
      "source": {
        "repo": "services/web"
      },
      "deploy": {
        "startCommand": "npm run build && npm start"
      }
    },
    {
      "name": "realtime",
      "source": {
        "repo": "services/realtime"
      }
    },
    {
      "name": "ai-processor",
      "source": {
        "repo": "services/ai-processor"
      },
      "deploy": {
        "startCommand": "python main.py"
      }
    }
  ]
}
```

### 8. 환경 변수 설정
```bash
# Railway 프로젝트 환경 변수
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# API 서비스
JWT_SECRET=your-secret-key
AI_SERVICE_URL=https://ai-processor.railway.app

# Web 서비스
NEXT_PUBLIC_API_URL=https://api.railway.app
NEXT_PUBLIC_WS_URL=wss://realtime.railway.app

# Realtime 서비스
WEB_URL=https://web.railway.app

# AI Processor
OPENAI_API_KEY=sk-...
```

## Railway 배포 프로세스

```bash
# 1. Railway CLI 설치
npm install -g @railway/cli

# 2. 로그인
railway login

# 3. 프로젝트 생성
railway init

# 4. 서비스 배포
railway up

# 5. 데이터베이스 마이그레이션
railway run npm run migrate

# 6. 로그 확인
railway logs
```

이렇게 구성하면 Railway의 자동 스케일링, 로드 밸런싱, 그리고 간편한 환경 변수 관리를 활용할 수 있습니다. 각 서비스는 독립적으로 배포되고 관리되므로 개발과 유지보수가 용이합니다.

추가로 필요한 부분이나 특정 기능에 대해 더 자세히 알고 싶으신 점이 있으시면 말씀해 주세요!