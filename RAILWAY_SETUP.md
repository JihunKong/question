# Railway 서비스 분리 설정 가이드

## 현재 문제
- 하나의 Railway 서비스에서 API와 프론트엔드를 모두 실행하려고 해서 충돌 발생
- 메인 도메인에 API가 표시되고 있음

## 해결 방법: 서비스 분리

### 1. Railway 대시보드에서 서비스 추가

#### API 서비스 (현재 서비스 유지)
- **이름**: `api` 또는 `question-api`
- **GitHub Repo**: 현재 저장소
- **Root Directory**: `/` (루트)
- **도메인**: `api-question.up.railway.app` (자동 생성됨)
- **환경변수**:
  ```
  DATABASE_URL=<PostgreSQL 연결 문자열>
  REDIS_URL=<Redis 연결 문자열>
  JWT_SECRET=<시크릿 키>
  ```

#### 프론트엔드 서비스 (새로 추가)
1. Railway 대시보드에서 **New Service** 클릭
2. **Deploy from GitHub repo** 선택
3. 같은 저장소 선택
4. **설정**:
   - **Service Name**: `web` 또는 `question-web`
   - **Root Directory**: `/services/web`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **환경변수**:
     ```
     NEXT_PUBLIC_API_URL=https://api-question.up.railway.app
     ```

### 2. 도메인 설정

#### 프론트엔드를 메인 도메인으로
1. 프론트엔드 서비스 설정에서 **Domains** 탭
2. **Custom Domain** 추가
3. 원하는 도메인 설정 (예: `question.app`)

#### API 서브도메인
1. API 서비스 설정에서 **Domains** 탭
2. Railway 제공 도메인 사용 또는
3. 서브도메인 설정 (예: `api.question.app`)

### 3. 서비스별 설정 파일

#### API 서비스 (`/railway.toml`)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node railway-simple-api.js"
healthcheckPath = "/health"
```

#### 프론트엔드 서비스 (`/services/web/railway.toml`)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/"
```

### 4. 최종 구조

```
Railway 프로젝트
├── API 서비스
│   ├── 도메인: api-question.up.railway.app
│   ├── 루트: /
│   └── 실행: railway-simple-api.js
│
├── 웹 서비스
│   ├── 도메인: question.up.railway.app (메인)
│   ├── 루트: /services/web
│   └── 실행: Next.js
│
├── PostgreSQL 서비스
└── Redis 서비스
```

### 5. 순서

1. 현재 커밋 푸시 (API 복구)
2. Railway 대시보드에서 새 서비스 추가
3. 프론트엔드 서비스 설정
4. 환경변수 설정
5. 도메인 설정

이렇게 하면 API와 프론트엔드가 각각 독립적으로 실행됩니다!