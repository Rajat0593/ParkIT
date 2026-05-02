# ParkIT Platform - Deployment & Operations Guide

## Overview
Complete guide for deploying, monitoring, and maintaining the ParkIT platform across all environments (development, staging, production).

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Backend Deployment](#backend-deployment)
3. [Mobile App Deployment](#mobile-app-deployment)
4. [Admin Dashboard Deployment](#admin-dashboard-deployment)
5. [Database Management](#database-management)
6. [Monitoring & Logging](#monitoring-and-logging)
7. [Disaster Recovery](#disaster-recovery)

---

## Environment Setup

### Prerequisites
- Node.js 18+ with npm/yarn
- PostgreSQL 13+ with PostGIS extension
- Redis 6+
- Docker & Docker Compose (optional but recommended)
- AWS CLI configured (for production)

### Environment Variables

#### Backend (.env)
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=postgres.internal.parkit.com
DB_PORT=5432
DB_NAME=parkit_prod
DB_USER=parkit_user
DB_PASSWORD=<strong-password>
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000

# Redis
REDIS_HOST=redis.internal.parkit.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# JWT
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# APIs
GOOGLE_MAPS_API_KEY=<key>
GEOCODING_API_KEY=<key>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
SMTP_FROM=noreply@parkit.com

# Payment
STRIPE_SECRET_KEY=<key>
STRIPE_PUBLIC_KEY=<key>

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/parkit/app.log
SENTRY_DSN=<sentry-dsn>

# CORS
ALLOWED_ORIGINS=https://app.parkit.com,https://admin.parkit.com
```

#### Mobile App (app.json)
```json
{
  "expo": {
    "name": "ParkIT",
    "slug": "parkit",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "bundleIdentifier": "com.parkit.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.parkit.app",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "<eas-project-id>"
      },
      "apiUrl": "https://api.parkit.com"
    }
  }
}
```

#### Admin Dashboard (.env.production)
```bash
VITE_API_URL=https://api.parkit.com
VITE_APP_NAME=ParkIT Admin
VITE_LOG_LEVEL=warn
```

---

## Backend Deployment

### Development Deployment

```bash
# 1. Clone repository
git clone https://github.com/parkit/parkit-backend.git
cd parkit-backend

# 2. Install dependencies
npm install

# 3. Setup database
npm run db:setup
npm run db:migrate

# 4. Seed test data
npm run db:seed

# 5. Start server
npm run dev
# Server runs on http://localhost:3000
```

### Production Deployment (AWS)

#### Using Docker & ECS

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY .env.production .

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "src/app.js"]
```

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t parkit-backend:latest .
docker tag parkit-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/parkit-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/parkit-backend:latest
```

#### Using AWS ECS Task Definition

```json
{
  "family": "parkit-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "parkit-backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/parkit-backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:parkit/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:parkit/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/parkit-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 3,
        "retries": 3,
        "startPeriod": 5
      }
    }
  ]
}
```

#### Auto-Scaling Configuration

```bash
# Create target group
aws elbv2 create-target-group \
  --name parkit-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 3 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create auto-scaling service
aws ecs create-service \
  --cluster parkit-prod \
  --service-name parkit-backend \
  --task-definition parkit-backend:latest \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<account-id>:targetgroup/parkit-backend-tg/xxxxx,containerName=parkit-backend,containerPort=3000

# Configure auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/parkit-prod/parkit-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name parkit-backend-scaling \
  --policy-type TargetTrackingScaling \
  --resource-id service/parkit-prod/parkit-backend \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

#### scaling-policy.json
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 300
}
```

---

## Mobile App Deployment

### iOS Deployment

```bash
# Build for App Store
eas build --platform ios --auto-submit

# Manual submission
eas build --platform ios
# Then submit to App Store Connect via Xcode or transporter
```

### Android Deployment

```bash
# Build for Google Play
eas build --platform android --auto-submit

# Manual build and submission
eas build --platform android
# Sign and upload to Google Play Console
```

### Over-the-Air Updates

```bash
# Create and publish update
eas update --branch production --message "Bug fixes and performance improvements"

# View update history
eas update list

# Rollback to previous version
eas update view <update-id>
```

---

## Admin Dashboard Deployment

### Netlify Deployment

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Strict-Transport-Security = "max-age=31536000"
```

```bash
# Deploy
npm run build
netlify deploy --prod --dir dist
```

### AWS S3 + CloudFront Deployment

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://parkit-admin-prod/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E<distribution-id> \
  --paths "/*"
```

---

## Database Management

### PostgreSQL with PostGIS Setup

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create indices for spatial queries
CREATE INDEX idx_parking_spaces_location ON parking_spaces USING GIST(location);
CREATE INDEX idx_parking_spaces_available ON parking_spaces(available_slots DESC) WHERE available_slots > 0;
CREATE INDEX idx_bookings_space_time ON bookings(space_id, check_in_time, check_out_time);
CREATE INDEX idx_bookings_user_id ON bookings(user_id, created_at DESC);

-- Analyze query plans
ANALYZE parking_spaces;
ANALYZE bookings;
ANALYZE transactions;
```

### Backup Strategy

```bash
#!/bin/bash
# backup-database.sh

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/parkit"
DB_NAME="parkit_prod"

# Full backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/full_$TIMESTAMP.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/full_$TIMESTAMP.sql.gz s3://parkit-backups/postgresql/

# Keep only last 30 days
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +30 -delete

echo "Backup completed: full_$TIMESTAMP.sql.gz"
```

### Recovery Process

```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1
DB_NAME="parkit_prod"

# Create backup of current database
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > /tmp/pre_restore_backup.sql.gz

# Drop existing database
dropdb -h $DB_HOST -U $DB_USER $DB_NAME

# Create new database
createdb -h $DB_HOST -U $DB_USER $DB_NAME

# Restore from backup
gunzip -c $BACKUP_FILE | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Enable PostGIS
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;"

echo "Database restored from $BACKUP_FILE"
```

---

## Monitoring & Logging

### CloudWatch Configuration

```javascript
// Backend - Winston Logger Setup
const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new WinstonCloudWatch({
      logGroupName: '/ecs/parkit-backend',
      logStreamName: `${process.env.ENVIRONMENT}-${new Date().toISOString().split('T')[0]}`,
      awsRegion: 'us-east-1',
      messageFormatter: ({ level, message, meta }) => 
        `[${level}] ${message} ${JSON.stringify(meta)}`
    })
  ]
});

module.exports = logger;
```

### Application Performance Monitoring

```javascript
// Sentry Setup
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true })
  ]
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Custom Metrics

```javascript
// CloudWatch Custom Metrics
const cloudwatch = new AWS.CloudWatch();

async function recordMetric(metricName, value, unit = 'Count') {
  await cloudwatch.putMetricData({
    Namespace: 'ParkIT',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
}

// Usage
recordMetric('ActiveSearches', activeUsers, 'Count');
recordMetric('APIResponseTime', responseTime, 'Milliseconds');
recordMetric('BookingSuccessRate', successRate, 'Percent');
```

### Alerting

```bash
# Create SNS topic
aws sns create-topic --name parkit-alerts

# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name parkit-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorCount \
  --namespace ParkIT \
  --statistic Sum \
  --period 300 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:<account-id>:parkit-alerts
```

---

## Disaster Recovery

### RTO & RPO Targets
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 15 minutes

### Backup Strategy

| Component | Frequency | Retention | Location |
|-----------|-----------|-----------|----------|
| Database | Every 6 hours | 30 days | S3 + On-premise |
| Code | On commit | 90 days | GitHub + S3 |
| Configuration | On change | 90 days | AWS Secrets Manager |
| Logs | Real-time streaming | 30 days | CloudWatch Logs |
| User Data Export | Daily | 90 days | S3 |

### Failover Procedure

```bash
#!/bin/bash
# failover-procedure.sh

echo "1. Pause write operations"
# Stop accepting new bookings, only allow reads

echo "2. Backup current database"
pg_dump -h $CURRENT_DB_HOST -U $DB_USER -d parkit_prod | gzip > /tmp/failover_backup.sql.gz

echo "3. Restore to standby database"
gunzip -c /tmp/failover_backup.sql.gz | psql -h $STANDBY_DB_HOST -U $DB_USER -d parkit_prod

echo "4. Update application configuration"
aws secretsmanager update-secret --secret-id parkit/db-host --secret-string "{\"host\": \"$STANDBY_DB_HOST\"}"

echo "5. Restart application services"
aws ecs update-service --cluster parkit-prod --service parkit-backend --force-new-deployment

echo "6. Verify health checks"
for i in {1..10}; do
  HEALTH=$(curl -s http://parkit-api.com/health | grep -c healthy)
  if [ $HEALTH -gt 0 ]; then
    echo "Health check passed"
    break
  fi
  echo "Attempt $i: Health check failed, retrying..."
  sleep 10
done

echo "7. Notify team"
aws sns publish --topic-arn arn:aws:sns:us-east-1:<account-id>:parkit-alerts \
  --message "Failover completed successfully. API now running on standby database."

echo "Failover completed!"
```

### Runbooks

#### Database Performance Degradation

```markdown
1. **Identify slow queries**
   ```sql
   SELECT query, mean_time FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   ```

2. **Check index usage**
   ```sql
   SELECT * FROM pg_stat_user_indexes 
   WHERE idx_scan = 0;
   ```

3. **Analyze query plan**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM parking_spaces 
   WHERE ST_DWithin(location, ST_Point(77.2090, 28.6139)::geography, 5000);
   ```

4. **Vacuum and analyze**
   ```sql
   VACUUM ANALYZE parking_spaces;
   VACUUM ANALYZE bookings;
   ```

5. **Increase connection pool if needed**
```

#### High API Latency

```markdown
1. Check ECS service metrics in CloudWatch
2. View application logs for errors
3. Scale up service (increase desired count)
4. Check database connection pool
5. Review recent code deployments for issues
6. If persists, rollback last deployment
```

---

## Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Database VACUUM | Weekly | DBA |
| Database REINDEX | Monthly | DBA |
| Log rotation | Daily | DevOps |
| Security patches | As needed | DevOps |
| Dependency updates | Monthly | Engineering |
| Performance review | Weekly | DevOps |
| Backup verification | Bi-weekly | DevOps |
| Disaster recovery drill | Quarterly | All teams |

---

## Quick Reference

### Health Check Endpoints

- **Backend**: `GET /health` - Returns `{"status": "ok"}`
- **Database**: `SELECT 1;` - PostgreSQL connection test
- **Redis**: `PING` - Redis connection test
- **Admin Dashboard**: `https://admin.parkit.com/health.json`

### Common Commands

```bash
# View logs
kubectl logs -f deployment/parkit-backend
aws logs tail /ecs/parkit-backend --follow

# Scale service
aws ecs update-service --cluster parkit-prod --service parkit-backend --desired-count 5

# Database connectivity
psql -h $DB_HOST -U $DB_USER -d parkit_prod -c "SELECT version();"

# Clear cache
redis-cli FLUSHALL
```

---

## Emergency Contacts

| Role | Contact | Backup |
|------|---------|--------|
| DevOps Lead | +91-XXXXXXXXXX | ops@parkit.com |
| Database Administrator | +91-XXXXXXXXXX | dba@parkit.com |
| Backend Lead | +91-XXXXXXXXXX | backend@parkit.com |

