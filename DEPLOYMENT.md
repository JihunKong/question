# Railway Deployment Guide

## Prerequisites

1. Railway CLI installed
2. Railway account and project created
3. GitHub repository connected

## Environment Variables

Set these in Railway dashboard for each service:

### API Service
```env
DATABASE_URL=postgresql://${{PGUSER}}:${{PGPASSWORD}}@${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
REDIS_URL=redis://${{REDISUSER}}:${{REDISPASSWORD}}@${{REDISHOST}}:${{REDISPORT}}
JWT_SECRET=your-secret-key-here
AI_SERVICE_URL=https://ai-processor.railway.app
NODE_ENV=production
```

### Web Service
```env
NEXT_PUBLIC_API_URL=https://api.railway.app
NEXT_PUBLIC_WS_URL=wss://realtime.railway.app
```

### Realtime Service
```env
DATABASE_URL=postgresql://${{PGUSER}}:${{PGPASSWORD}}@${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
REDIS_URL=redis://${{REDISUSER}}:${{REDISPASSWORD}}@${{REDISHOST}}:${{REDISPORT}}
JWT_SECRET=your-secret-key-here
WEB_URL=https://web.railway.app
```

### AI Processor Service
```env
DATABASE_URL=postgresql://${{PGUSER}}:${{PGPASSWORD}}@${{PGHOST}}:${{PGPORT}}/${{PGDATABASE}}
CORS_ORIGINS=https://api.railway.app,https://web.railway.app
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update for Railway deployment"
   git push origin main
   ```

2. **Deploy Services**
   
   Railway will automatically deploy when you push to GitHub. Each service should be deployed separately:
   
   - **PostgreSQL & Redis**: Deploy from Railway templates
   - **API Service**: Deploy from `/` directory
   - **Web Service**: Create separate service, deploy from `/services/web`
   - **Realtime Service**: Create separate service, deploy from `/services/realtime`
   - **AI Processor**: Create separate service, deploy from `/services/ai-processor`

3. **Run Database Migrations**
   
   After API service is deployed:
   ```bash
   railway run --service=api npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```

4. **Verify Deployment**
   
   Check health endpoints:
   - API: `https://your-api.railway.app/health`
   - Realtime: `https://your-realtime.railway.app/health`
   - AI: `https://your-ai.railway.app/health`

## Service Configuration

### API Service
- Start command: `npx prisma migrate deploy && npm run start:api`
- Health check: `/health`
- Port: `$PORT` (Railway provides)

### Web Service
- Build command: `npm run build`
- Start command: `npm run start`
- Port: `$PORT`

### Realtime Service
- Start command: `npm run start`
- Port: `$PORT`

### AI Processor
- Start command: `python main.py`
- Health check: `/health`
- Port: `$PORT`

## Troubleshooting

1. **Build Failures**
   - Check Node.js version (20.x required)
   - Ensure all dependencies are in package.json
   - Check build logs in Railway

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check if migrations ran successfully
   - Ensure PostgreSQL service is running

3. **Service Communication**
   - Use Railway's internal URLs for service-to-service communication
   - Check CORS settings
   - Verify JWT_SECRET matches across services

## Monitoring

- Use Railway's built-in metrics
- Check service logs regularly
- Set up alerts for failures