# Question Exchange Platform

교육용 질문 교환 플랫폼 - 한국 교육 환경에 최적화된 지능형 질문 관리 시스템

## 🚀 Live Demo

- **API Server**: https://question-production-eaa3.up.railway.app/
- **Health Check**: https://question-production-eaa3.up.railway.app/health

## 📋 주요 기능

### 핵심 기능
- **질문 관리**: 질문 생성, 수정, 삭제, 상태 관리
- **AI 기반 가치 평가**: 질문의 교육적 가치를 AI가 자동 평가
- **실시간 협업**: 여러 사용자가 동시에 질문 편집 가능
- **태그 시스템**: 효율적인 질문 분류 및 검색

### 교육 특화 기능
- **교사 온보딩**: 단계별 교사 적응 프로그램
- **학부모 리포트**: 자녀의 학습 진행 상황 리포트
- **오프라인 지원**: PWA 기반 오프라인 모드
- **저대역폭 모드**: 느린 인터넷 환경 최적화

## 🛠 기술 스택

### Backend
- **Node.js + Express**: API 서버
- **PostgreSQL + Prisma**: 데이터베이스
- **Redis**: 캐싱 및 실시간 기능
- **Socket.io + Yjs**: 실시간 협업

### Frontend
- **Next.js**: React 기반 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **PWA**: 오프라인 지원

### AI/ML
- **Python + FastAPI**: AI 처리 서버
- **Transformers**: 한국어 NLP 모델
- **BERT**: 질문 가치 평가

## 📦 프로젝트 구조

```
question-exchange/
├── packages/           # 공유 패키지
│   ├── database/      # Prisma 스키마 및 클라이언트
│   └── shared/        # 공통 타입 및 유틸리티
├── services/          # 마이크로서비스
│   ├── api/          # Express API 서버
│   ├── web/          # Next.js 프론트엔드
│   ├── realtime/     # Socket.io 실시간 서버
│   └── ai-processor/ # Python AI 처리 서버
└── railway-*.js      # Railway 배포 스크립트
```

## 🚀 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Redis 7+
- Python 3.9+ (AI 서비스용)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/JihunKong/question.git
cd question
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일 편집하여 필요한 값 설정
```

4. **데이터베이스 마이그레이션**
```bash
npm run migrate
```

5. **개발 서버 실행**
```bash
npm run dev
```

## 🌐 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/logout` - 로그아웃

### 질문 관리
- `GET /api/questions` - 질문 목록 조회
- `GET /api/questions/:id` - 특정 질문 조회
- `POST /api/questions` - 질문 생성
- `PUT /api/questions/:id` - 질문 수정
- `DELETE /api/questions/:id` - 질문 삭제

### 태그
- `GET /api/tags` - 태그 목록 조회
- `POST /api/tags` - 태그 생성

## 📱 프론트엔드 접근

- **개발**: http://localhost:3000
- **프로덕션**: https://question-web.railway.app (배포 예정)

## 🚀 Railway 배포

### 현재 배포 상태
- ✅ API 서버: 배포 완료
- ⏳ PostgreSQL: 연결 대기
- ⏳ Redis: 연결 대기
- ⏳ 프론트엔드: 배포 예정

### 배포 명령어
```bash
# Railway CLI 로그인
railway login

# 프로젝트 연결
railway link

# 배포
railway up
```

## 🔧 문제 해결

### Railway 배포 이슈
- **헬스체크 실패**: `railway logs`로 로그 확인
- **환경변수 누락**: `railway variables`로 확인
- **빌드 실패**: `nixpacks.toml` 설정 확인

### 로컬 개발 이슈
- **포트 충돌**: 기본 포트 변경 (API: 3001, Web: 3000)
- **데이터베이스 연결**: PostgreSQL 서비스 실행 확인

## 📝 라이선스

MIT License

## 👥 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

- GitHub Issues: [https://github.com/JihunKong/question/issues](https://github.com/JihunKong/question/issues)
- Email: jihunkong@example.com