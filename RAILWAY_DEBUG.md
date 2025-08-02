# Railway 배포 디버깅 가이드

## Railway CLI 명령어

### 1. 실시간 로그 모니터링
```bash
# API 서비스 로그 확인
railway logs --follow

# 특정 시간 범위 로그
railway logs --since 10m
```

### 2. 서비스 상태 확인
```bash
# 현재 서비스 상태
railway status

# 환경변수 확인
railway variables

# 서비스 정보
railway service
```

### 3. 재배포 및 관리
```bash
# 수동 재배포
railway up

# 서비스 재시작
railway restart

# Railway 대시보드 열기
railway open
```

## 문제 해결 체크리스트

### 헬스체크 실패 시
1. **로그 확인**: `railway logs --follow`로 실제 에러 메시지 확인
2. **환경변수**: `DATABASE_URL`, `PORT` 설정 확인
3. **빌드 확인**: 빌드 로그에서 에러 없는지 확인
4. **경로 확인**: start-api.sh가 실행 가능한지 확인

### 일반적인 문제와 해결방법

#### 1. "service unavailable" 에러
- **원인**: 서비스가 PORT 환경변수로 바인딩하지 않음
- **해결**: 코드에서 `process.env.PORT || 3001` 사용 확인

#### 2. Migration 타임아웃
- **원인**: 데이터베이스 연결 대기 시간 초과
- **해결**: start-api.sh에서 백그라운드 마이그레이션 사용

#### 3. 빌드 실패
- **원인**: 의존성 순서 문제
- **해결**: build:sequential 스크립트 사용

## 모니터링 팁

### 배포 후 확인사항
```bash
# 1. 서비스가 시작되었는지 확인
railway logs --follow | grep "Server is ready"

# 2. 헬스체크 응답 확인
curl https://[your-app].railway.app/health

# 3. 데이터베이스 연결 확인
railway logs | grep "Database connected"
```

### 유용한 Railway 환경변수
- `RAILWAY_ENVIRONMENT`: 현재 환경 (production/staging)
- `RAILWAY_PROJECT_ID`: 프로젝트 ID
- `RAILWAY_SERVICE_NAME`: 서비스 이름
- `PORT`: Railway가 할당한 포트 (자동)

## 긴급 복구

만약 배포가 계속 실패한다면:

1. **최소 설정으로 되돌리기**
   ```bash
   # railway.toml만 유지하고 다른 설정 파일 제거
   rm nixpacks.toml
   ```

2. **간단한 헬스체크로 테스트**
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });
   ```

3. **Railway 지원팀 연락**
   - Dashboard → Help → Contact Support
   - 프로젝트 ID와 로그 제공