# Railway 서비스 설정 가이드

## 🚨 중요: Railway 대시보드에서 설정 필요

### 1. API 서비스 설정
Railway 대시보드에서 `question` 서비스:
- **Settings → Root Directory**: `/services/api` 설정
- **Deploy → Start Command**: `node railway-api.js`
- **Deploy → Build Command**: `npm install express cors`

### 2. 웹 서비스 설정
Railway 대시보드에서 `web` 서비스:
- **Settings → Root Directory**: `/services/web` 설정
- **Deploy → Start Command**: `npm run start`
- **Deploy → Build Command**: `npm ci && npm run build`

## 📁 현재 구조

```
/
├── services/
│   ├── api/
│   │   ├── railway-api.js (API 서버)
│   │   ├── railway.toml (API 설정)
│   │   └── nixpacks.toml (API 빌드)
│   │
│   └── web/
│       ├── railway.toml (웹 설정)
│       ├── nixpacks.toml (웹 빌드)
│       └── Next.js 앱 파일들
│
└── (루트에 설정 파일 없음 - 중요!)
```

## ⚠️ 주의사항

1. **루트에 railway.toml이나 nixpacks.toml을 두지 마세요**
   - Railway는 루트 설정을 모든 서비스에 적용합니다

2. **각 서비스의 Root Directory를 반드시 설정하세요**
   - API: `/services/api`
   - Web: `/services/web`

3. **서비스별 도메인**
   - Web: 메인 도메인
   - API: api 서브도메인 또는 별도 도메인

## 🔍 확인 방법

1. Railway 대시보드에서 각 서비스 클릭
2. Settings 탭에서 Root Directory 확인
3. Deploy 탭에서 빌드/시작 명령어 확인
4. 배포 후 도메인 접속하여 테스트

## 🎯 예상 결과

- **웹 서비스 URL**: Next.js 프론트엔드 UI
- **API 서비스 URL**: JSON API 응답

이 설정을 완료하면 프론트엔드와 API가 각각 독립적으로 작동합니다!