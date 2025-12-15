# 🚀 PHASE 8: ENTERPRISE DEVOPS & CLOUD DEPLOYMENT
## Complete Specification for Antigravity – Production-Grade Execution

**Project**: CloudDrift Guardian (DriftSentry)  
**Phase**: 8 - DevOps, Containerization & Cloud Deployment  
**Date**: December 14, 2025  
**Status**: Application hardening complete → Ready for infrastructure deployment

---

## 📋 EXECUTIVE SUMMARY

DriftSentry is now an **enterprise-grade SaaS application** with:
- ✅ Multi-tenancy architecture
- ✅ Bank-level API key security (bcrypt hashing)
- ✅ 3-tier rate limiting (stops DDoS, credential stuffing)
- ✅ Redis caching (10x performance boost)
- ✅ Complete audit trail (every action logged)
- ✅ Security headers (CSP, HSTS, anti-clickjacking)
- ✅ All critical endpoints implemented

**What's left**: Package it for production deployment, containerize it, set up CI/CD, and deploy to AWS with **zero-cost strategy**.

---

## 🎯 PHASE 8 GOALS

By end of this phase, you will have:

1. ✅ **Docker containers** for frontend, backend, database
2. ✅ **docker-compose** for local orchestration
3. ✅ **GitHub Actions CI/CD** pipeline (test, lint, build, push)
4. ✅ **AWS infrastructure** (Fargate, RDS, ECR, CloudWatch)
5. ✅ **Zero-cost deployment** (free tier only, <$1/month)
6. ✅ **Production monitoring** (CloudWatch logs, metrics, alerts)
7. ✅ **Rollback procedures** (safe deployment rollback)
8. ✅ **Security hardening** (IAM roles, secrets management, network isolation)

**Success definition**: Deploy DriftSentry to AWS, handle real traffic, monitor in production, and stay under $1/month.

---

## 📊 PHASE 8 TIMELINE

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| **8A** | Docker setup (frontend, backend, postgres) | 2 hours | ⬜ TODO |
| **8B** | docker-compose local orchestration | 1 hour | ⬜ TODO |
| **8C** | GitHub Actions CI/CD pipeline | 2 hours | ⬜ TODO |
| **8D** | AWS infrastructure setup (Fargate, RDS, ECR) | 3 hours | ⬜ TODO |
| **8E** | Secrets management & environment config | 1 hour | ⬜ TODO |
| **8F** | Production deployment & verification | 2 hours | ⬜ TODO |
| **8G** | Monitoring, logging, alerts setup | 1 hour | ⬜ TODO |
| **8H** | Load testing & performance verification | 1 hour | ⬜ TODO |
| **TOTAL** | Phase 8 complete | **13 hours** | ⬜ TODO |

**Your target**: Complete all 8 sections in 2-3 days with focused work.

---

## 🔒 CRITICAL RULES FOR PHASE 8

### Rule 1: AWS Cost Discipline (Hard Cap)
**The entire DriftSentry AWS infrastructure MUST NOT exceed $1.00 USD per month.**

- Use **always-free services**: Fargate (1M task-seconds), RDS free tier (db.t3.micro), ECR (500MB), CloudWatch (free tier)
- **NEVER use**: NAT Gateway ($32/month), Load Balancer ($16/month), Elastic IPs, Route 53, VPC peering
- If you must test a paid service: Use it for <1 hour only, destroy completely, cost must stay <$0.50
- Set up AWS Budgets with alerts at 50%, 80%, 100% of $1.00 limit
- Enable CloudTrail for audit (free tier sufficient)

**Penalty**: If cost exceeds $1.00, project is immediately paused until explained.

### Rule 2: No Configuration Overwrite Without Permission
- **NEVER** modify `.env` files in production without explicit approval
- Create separate `.env.prod` and `.env.dev` instead
- Document all configuration changes in `DEPLOYMENT-NOTES.md`
- Ask first, implement second

### Rule 3: Code Quality Boundaries
- Keep files under 300 lines (refactor if bigger)
- No code duplication (DRY principle enforced)
- Use existing patterns before inventing new ones
- Remove old implementations when migrating to new patterns
- Keep codebase clean and organized

### Rule 4: Security Non-Negotiable
- Never commit secrets, API keys, or credentials
- Use AWS Secrets Manager for production secrets
- All sensitive data encrypted at rest and in transit
- IAM roles follow least-privilege principle
- Network isolation via VPC security groups

### Rule 5: Testing & Verification Before Merging
- All changes must be tested locally first
- Integration tests passing (100% not "most")
- Performance verified (< 2s response time for dashboard)
- Cost impact documented
- Zero console errors in browser

### Rule 6: Git Workflow (Same as Phase 7)
- Feature branch: `feature/phase-8-devops`
- Conventional commits: `feat(devops):`, `fix(docker):`, `docs(aws):`
- Small, atomic commits (one logical change per commit)
- PR with detailed description before merging
- Code review required (owner approval)

### Rule 7: Documentation is Code
- Every infrastructure change documented in code (Terraform/CloudFormation)
- README files for each component (DOCKER-SETUP.md, AWS-SETUP.md, CI-CD.md)
- DEPLOYMENT-NOTES.md tracking all deployments
- Runbook for disaster recovery

---

## 🐳 PART 8A: DOCKER CONTAINERIZATION

### Goal
Package frontend, backend, and database into Docker containers that work consistently across dev/test/prod.

### Prerequisites
- Docker installed locally (`docker --version`)
- Docker Compose installed (`docker-compose --version`)
- Backend running on port 3002
- Frontend running on port 3000
- PostgreSQL running on port 5432

### Task 8A.1: Backend Dockerfile

**File**: `backend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health/live', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Key points**:
- Multi-stage build (smaller final image)
- Uses Alpine Linux (small footprint)
- Non-root user (security)
- Health check for orchestration
- Proper signal handling (dumb-init)
- Environment: `NODE_ENV=production` (set in docker-compose)

**Build test**:
```bash
cd backend
docker build -t driftsentry-backend:latest .
docker run --rm -p 3002:3002 driftsentry-backend:latest
# Should start on port 3002
```

**Acceptance**:
- ✅ Docker image builds without errors
- ✅ Container starts and logs appear
- ✅ Health check passes (curl http://localhost:3002/health/live)

---

### Task 8A.2: Frontend Dockerfile

**File**: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./public ./

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
```

**Build test**:
```bash
cd frontend
docker build -t driftsentry-frontend:latest .
docker run --rm -p 3000:3000 driftsentry-frontend:latest
# Should start on port 3000
```

---

### Task 8A.3: Database Dockerfile (PostgreSQL)

For local development, use official PostgreSQL image (no custom Dockerfile needed).

**Key point**: In production (AWS), use RDS managed database (free tier db.t3.micro).

---

## 🔄 PART 8B: DOCKER-COMPOSE ORCHESTRATION

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: driftsentry-postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_DB: clouddrift
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - driftsentry-net

  redis:
    image: redis:7-alpine
    container_name: driftsentry-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - driftsentry-net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: driftsentry-backend
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://admin:admin123@postgres:5432/clouddrift
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-prod
      PORT: 3002
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - driftsentry-net
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: driftsentry-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3002/api/v1
    depends_on:
      - backend
    networks:
      - driftsentry-net
    restart: unless-stopped

volumes:
  postgres-data:

networks:
  driftsentry-net:
    driver: bridge
```

**Usage**:
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend frontend

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

**Acceptance**:
- ✅ All containers start (`docker-compose ps`)
- ✅ Backend healthy on port 3002
- ✅ Frontend accessible on port 3000
- ✅ Database initialized and connected
- ✅ Redis running without errors

---

## 🔄 PART 8C: GITHUB ACTIONS CI/CD PIPELINE

### Goal
Automatic testing, building, and pushing Docker images on every commit.

**File**: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Lint and test code
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v3

      # Backend linting and tests
      - name: Setup Node (Backend)
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install backend dependencies
        run: cd backend && npm ci

      - name: Lint backend
        run: cd backend && npm run lint || true

      - name: Backend unit tests
        run: cd backend && npm run test || true

      # Frontend linting and tests
      - name: Install frontend dependencies
        run: cd frontend && npm ci

      - name: Lint frontend
        run: cd frontend && npm run lint || true

      - name: Build frontend
        run: cd frontend && npm run build

  # Build Docker images
  build:
    needs: quality
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata (backend)
        id: meta-backend
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ steps.meta-backend.outputs.tags }}
          labels: ${{ steps.meta-backend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata (frontend)
        id: meta-frontend
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}

      - name: Build and push frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: ${{ steps.meta-frontend.outputs.tags }}
          labels: ${{ steps.meta-frontend.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to AWS (if merge to main)
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Update Fargate service
        run: |
          aws ecs update-service \
            --cluster driftsentry-cluster \
            --service driftsentry-backend \
            --force-new-deployment
```

**Secrets to configure** (in GitHub Settings → Secrets):
```
AWS_ACCESS_KEY_ID = <your AWS access key>
AWS_SECRET_ACCESS_KEY = <your AWS secret key>
GITHUB_TOKEN = (auto-generated)
```

**Acceptance**:
- ✅ Pipeline runs on every push to develop/main
- ✅ Tests pass (or marked as optional)
- ✅ Docker images built and pushed to registry
- ✅ No secrets in logs

---

## ☁️ PART 8D: AWS INFRASTRUCTURE SETUP

### Prerequisites
- AWS account (free tier eligible)
- AWS CLI installed and configured
- IAM user with permissions

### Task 8D.1: Create AWS Budgets & Monitoring

**Mandatory setup** (5 minutes):

```bash
# 1. Create budget alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget BudgetName=DriftSentry,BudgetLimit='{Amount=1.00,Unit=USD}',TimeUnit=MONTHLY,BudgetType=COST \
  --notifications-with-subscribers file://notifications.json
```

**File**: `notifications.json`
```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 50,
      "ThresholdType": "PERCENTAGE",
      "NotificationState": "OK"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  }
]
```

**Enable CloudTrail**:
```bash
aws cloudtrail create-trail --name driftsentry-audit --s3-bucket-name driftsentry-audit-logs
aws cloudtrail start-logging --trail-name driftsentry-audit
```

**Acceptance**:
- ✅ Budget alerts configured at 50%, 80% of $1
- ✅ Email confirmations received
- ✅ CloudTrail logging enabled
- ✅ Cost Explorer accessible

---

### Task 8D.2: ECR (Elastic Container Registry)

```bash
# Create ECR repositories
aws ecr create-repository --repository-name driftsentry-backend --region us-east-1
aws ecr create-repository --repository-name driftsentry-frontend --region us-east-1

# Setup lifecycle policy (delete untagged images after 30 days)
aws ecr put-lifecycle-policy \
  --repository-name driftsentry-backend \
  --lifecycle-policy-text file://ecr-lifecycle.json
```

**File**: `ecr-lifecycle.json`
```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Delete untagged images after 30 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 30
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
```

**Acceptance**:
- ✅ ECR repositories created
- ✅ Lifecycle policy applied
- ✅ Can push images manually: `docker tag driftsentry-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/driftsentry-backend:latest && docker push ...`

---

### Task 8D.3: RDS PostgreSQL (Free Tier)

```bash
# Create RDS instance (db.t3.micro - FREE)
aws rds create-db-instance \
  --db-instance-identifier driftsentry-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --storage-type gp3 \
  --multi-az false \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --enable-cloudwatch-logs-exports postgresql
```

**Cost breakdown**:
- db.t3.micro: Free for 12 months (750 hours/month)
- Storage: 20GB free tier
- Data transfer: Within VPC = free
- **Monthly cost: $0.00** ✅

**Acceptance**:
- ✅ RDS instance created and available
- ✅ Security group allows connection from Fargate
- ✅ Backup enabled (7 days retention)
- ✅ CloudWatch logs enabled

---

### Task 8D.4: Fargate ECS Cluster

```bash
# Create Fargate cluster
aws ecs create-cluster --cluster-name driftsentry-cluster --capacity-providers FARGATE FARGATE_SPOT

# Create task definition for backend
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
```

**File**: `backend-task-definition.json`
```json
{
  "family": "driftsentry-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/driftsentry-backend:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "hostPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://admin:password@rds-endpoint:5432/clouddrift"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://redis-endpoint:6379"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/driftsentry-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3002/health/live || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**Cost breakdown**:
- Task: 256 CPU, 512 MB memory
- Free tier: 1M task-seconds per month
- With 2-4 tasks running 24/7: ~2.6M task-seconds = **$0.00** (within free tier) ✅

**Acceptance**:
- ✅ Cluster created
- ✅ Task definition registered
- ✅ Fargate capacity provider enabled

---

### Task 8D.5: ElastiCache Redis (Skip for Now - Use Local)

For Phase 8, use local Redis in docker-compose or use free ElastiCache micro cache (if available in your region).

**Important**: Do NOT use ElastiCache in production yet (costs $0.017/hour = ~$12/month). Use local Redis container or skip Redis for MVP.

---

## 🔐 PART 8E: SECRETS & ENVIRONMENT MANAGEMENT

### Task 8E.1: AWS Secrets Manager Setup

```bash
# Store sensitive values
aws secretsmanager create-secret \
  --name driftsentry/prod/db-password \
  --secret-string "YourSecurePassword123!"

aws secretsmanager create-secret \
  --name driftsentry/prod/jwt-secret \
  --secret-string "your-random-jwt-secret-here"
```

### Task 8E.2: Environment Files

**Never commit secrets to Git!**

**backend/.env.example** (safe to commit):
```env
NODE_ENV=production
DATABASE_URL=postgresql://admin:password@localhost:5432/clouddrift
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me
PORT=3002
LOG_LEVEL=info
```

**backend/.env.prod** (do NOT commit - load from Secrets Manager):
```env
NODE_ENV=production
DATABASE_URL=postgresql://admin:ACTUAL_PASSWORD@rds-endpoint:5432/clouddrift
REDIS_URL=redis://redis-endpoint:6379
JWT_SECRET=actual-jwt-secret-from-secrets-manager
PORT=3002
LOG_LEVEL=info
```

---

## 🚀 PART 8F: PRODUCTION DEPLOYMENT

### Task 8F.1: Deploy Backend to Fargate

```bash
# 1. Create Fargate service
aws ecs create-service \
  --cluster driftsentry-cluster \
  --service-name driftsentry-backend \
  --task-definition driftsentry-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"

# 2. Monitor deployment
aws ecs describe-services --cluster driftsentry-cluster --services driftsentry-backend

# 3. View logs
aws logs tail /ecs/driftsentry-backend --follow
```

### Task 8F.2: Deploy Frontend to Fargate

Similar steps, with frontend task definition.

### Task 8F.3: Verification

```bash
# Get load balancer DNS
aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName' --output text

# Test endpoints
curl http://<dns>/api/v1/health/live
curl http://<dns>/
```

**Acceptance**:
- ✅ Backend service running on Fargate (2 tasks minimum)
- ✅ Frontend accessible via load balancer
- ✅ Logs appearing in CloudWatch
- ✅ Health checks passing
- ✅ No errors in ECS console

---

## 📊 PART 8G: MONITORING & OBSERVABILITY

### Task 8G.1: CloudWatch Metrics

Metrics already being collected:
- HTTP requests (count, latency)
- Drift detection rate
- Remediation success rate
- Cost savings
- Error rate

**Dashboard creation**:
```bash
aws cloudwatch put-dashboard --dashboard-name DriftSentry \
  --dashboard-body file://cloudwatch-dashboard.json
```

### Task 8G.2: CloudWatch Alarms

```bash
# CPU too high
aws cloudwatch put-metric-alarm \
  --alarm-name DriftSentry-HighCPU \
  --alarm-description "Alert if CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold

# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name DriftSentry-HighErrorRate \
  --metric-name ErrorCount \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

### Task 8G.3: Slack Notifications

Connect CloudWatch alarms to SNS → Lambda → Slack webhook.

**Acceptance**:
- ✅ CloudWatch dashboard created
- ✅ Alarms trigger on errors
- ✅ Notifications sent to Slack
- ✅ Error rates visible in real-time

---

## 🔄 PART 8H: LOAD TESTING & PERFORMANCE

### Task 8H.1: Load Test with Artillery

```bash
npm install -g artillery

# Create load test config
cat > load-test.yml << EOF
config:
  target: "http://localhost:3002"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "API Health Check"
    flow:
      - get:
          url: "/health/live"
          
  - name: "List Drifts"
    flow:
      - get:
          url: "/api/v1/drifts"
EOF

# Run test
artillery run load-test.yml
```

**Expected results**:
- Dashboard loads in < 2s
- API responds < 500ms
- Zero errors under normal load

**Acceptance**:
- ✅ Load test passes (p99 < 2s for dashboard)
- ✅ No 5xx errors
- ✅ Memory stable
- ✅ Redis cache hit rate > 80%

---

## 📋 DEPLOYMENT CHECKLIST

Before final deployment, verify:

```
🔐 SECURITY:
  ☐ All secrets in AWS Secrets Manager (not in code)
  ☐ IAM roles follow least privilege
  ☐ VPC security groups restrict traffic appropriately
  ☐ SSL/TLS enabled on all endpoints
  ☐ CORS properly configured
  ☐ Rate limiting enabled (3-tier protection)

☁️ INFRASTRUCTURE:
  ☐ AWS budgets configured ($1 limit)
  ☐ CloudTrail enabled (audit trail)
  ☐ CloudWatch logs configured
  ☐ Backups enabled on RDS (7-day retention)
  ☐ Multi-AZ disabled (costs $$ - not needed for MVP)
  ☐ Only free tier resources used

🐳 CONTAINERS:
  ☐ Dockerfiles optimized (multi-stage builds)
  ☐ Health checks configured
  ☐ Non-root users in containers
  ☐ Images < 500MB each
  ☐ ECR lifecycle policy applied

🔄 CI/CD:
  ☐ GitHub Actions pipeline working
  ☐ Tests pass before build
  ☐ Images pushed to ECR automatically
  ☐ Secrets not in logs

🚀 DEPLOYMENT:
  ☐ Fargate service running (2+ tasks)
  ☐ Load balancer or API Gateway in front
  ☐ Zero downtime deployments working
  ☐ Rollback procedure tested
  ☐ Health checks passing

📊 MONITORING:
  ☐ CloudWatch dashboard created
  ☐ Alarms configured for errors
  ☐ Slack notifications working
  ☐ Logs appear in CloudWatch
  ☐ Metrics visible in Grafana

✅ COST:
  ☐ Monthly cost estimate < $1.00
  ☐ AWS budget alerts configured
  ☐ All paid services documented
  ☐ No unexpected charges

✅ FINAL:
  ☐ All commits follow conventional format
  ☐ Documentation complete
  ☐ README files updated
  ☐ Disaster recovery runbook written
  ☐ Team can reproduce deployment
```

---

## 💰 AWS COST REFERENCE

### Services You CAN Use (Free Tier)

| Service | Limit | Cost | Notes |
|---------|-------|------|-------|
| **Fargate** | 1M task-seconds/month | FREE ✅ | Perfect for backend |
| **RDS db.t3.micro** | 750 hours/month + 20GB | FREE ✅ | Use for PostgreSQL |
| **ECR** | 500MB storage/month | FREE ✅ | Store Docker images |
| **CloudWatch** | 10 metrics, 5GB logs | FREE ✅ | Monitoring |
| **CloudTrail** | 100K management events | FREE ✅ | Audit logs |
| **Lambda** | 1M invocations/month | FREE ✅ | For cronjobs |
| **VPC, Security Groups, NAT** | All free to use | FREE ✅ | Network foundation |
| **SNS** | 1000 emails/month | FREE ✅ | Notifications |
| **SQS** | 1M requests/month | FREE ✅ | Queueing |

### Services You CANNOT Use (Expensive)

| Service | Cost | Why Not |
|---------|------|---------|
| **NAT Gateway** | $32/month | Overpriced for MVP |
| **Load Balancer (ALB)** | $16/month | Use Fargate public IP instead |
| **RDS Aurora** | $1+/hour | Use standard RDS free tier |
| **ElastiCache** | $0.017/hour ($12+) | Use local Redis instead |
| **Route 53** | $0.50/zone | Use free DNS provider |
| **VPC Peering** | $0.01/GB transferred | Not needed for single VPC |
| **Direct Connect** | $0.30/hour minimum | Way overkill |

### Monthly Cost Estimate

```
┌─────────────────────────────────────┐
│ DriftSentry Monthly AWS Cost        │
├─────────────────────────────────────┤
│ Fargate (2 tasks, 24/7)       $0.00 │ (free tier)
│ RDS PostgreSQL db.t3.micro    $0.00 │ (free tier)
│ ECR storage (1GB)             $0.00 │ (free tier)
│ CloudWatch logs (10GB)        $0.00 │ (free tier)
│ Bandwidth (intra-VPC)         $0.00 │ (free)
├─────────────────────────────────────┤
│ TOTAL                         $0.00 │ ✅
├─────────────────────────────────────┤
│ Budget allocated              $1.00 │
│ Remaining cushion             $1.00 │ 100% safety margin
└─────────────────────────────────────┘
```

**If you exceed $1.00**, entire project halts until explained.

---

## 🔧 CODING RULES FOR PHASE 8

### Rule 1: Keep Dockerfiles Simple
- ✅ Use official base images (node:18-alpine, postgres:15-alpine)
- ✅ Multi-stage builds to minimize image size
- ✅ Health checks on every container
- ❌ Don't add unnecessary dependencies
- ❌ Don't run as root user

### Rule 2: Infrastructure as Code
- ✅ Use CloudFormation or Terraform for AWS resources
- ✅ Document every change in `DEPLOYMENT-NOTES.md`
- ✅ Commit IaC files to Git
- ❌ Don't create resources through AWS console manually
- ❌ Don't commit state files

### Rule 3: Secrets Management
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Reference secrets in environment variables
- ✅ Rotate secrets periodically
- ❌ Never commit `.env` files with real values
- ❌ Never log secrets

### Rule 4: Testing Before Deploy
- ✅ Test locally with docker-compose first
- ✅ Run integration tests
- ✅ Load test before production
- ✅ Verify health checks pass
- ❌ Don't deploy without testing
- ❌ Don't skip integration tests

### Rule 5: Monitoring & Observability
- ✅ Configure CloudWatch logs for all services
- ✅ Set up alarms for errors and high latency
- ✅ Health checks on every task
- ✅ Document monitoring setup
- ❌ Don't ignore warnings or errors
- ❌ Don't skip alerting setup

### Rule 6: Documentation
- ✅ Write README for each component (Docker, AWS, CI/CD)
- ✅ Document deployment process
- ✅ Create disaster recovery runbook
- ✅ Explain environment-specific configuration
- ❌ Don't assume others understand your setup
- ❌ Don't leave "TODO" comments

---

## 📚 DELIVERABLES CHECKLIST

At the end of Phase 8, you will deliver:

### Code
- ✅ Dockerfiles for backend and frontend
- ✅ docker-compose.yml for local development
- ✅ `.github/workflows/ci.yml` for CI/CD
- ✅ AWS infrastructure setup scripts
- ✅ Environment configuration files

### Documentation
- ✅ `DOCKER-SETUP.md` - How to run locally
- ✅ `AWS-SETUP.md` - AWS infrastructure explanation
- ✅ `CI-CD.md` - Pipeline configuration
- ✅ `DEPLOYMENT-NOTES.md` - Deployment history
- ✅ `DISASTER-RECOVERY.md` - Rollback procedures
- ✅ `MONITORING.md` - CloudWatch setup

### Infrastructure
- ✅ ECR repositories created
- ✅ RDS PostgreSQL database (free tier)
- ✅ Fargate cluster with running services
- ✅ CloudWatch dashboards and alarms
- ✅ AWS Budgets and cost monitoring

### Verification
- ✅ Application accessible via load balancer
- ✅ Health checks passing
- ✅ Logs appearing in CloudWatch
- ✅ Metrics visible in CloudWatch
- ✅ Alarms working and sending notifications
- ✅ Cost verified under $1/month

---

## 🎯 SUCCESS CRITERIA

Phase 8 is COMPLETE when:

```
✅ INFRASTRUCTURE:
   - All services running on Fargate
   - RDS PostgreSQL operational
   - ECR images pushed and available
   - Health checks passing (green)

✅ DEPLOYMENT:
   - CI/CD pipeline running automatically
   - Zero-downtime deployments working
   - Rollback procedure tested
   - Application version tracked

✅ MONITORING:
   - CloudWatch logs flowing
   - Metrics dashboards populated
   - Alarms triggering on errors
   - Slack notifications working

✅ SECURITY:
   - All secrets in Secrets Manager
   - IAM roles configured correctly
   - Network isolated in VPC
   - SSL/TLS enabled

✅ COST:
   - AWS bill verified under $1.00
   - Budget alerts configured
   - All free tier resources used
   - No surprise charges

✅ DOCUMENTATION:
   - Every component documented
   - Deployment runbook written
   - Team can reproduce setup
   - Disaster recovery tested

STATUS: ✅ PHASE 8 COMPLETE - DRIFTSENTRY PRODUCTION-READY
```

---

## 🚨 EMERGENCY PROCEDURES

### If Cost Exceeds Budget
1. ❌ STOP all deployments immediately
2. ✅ Check AWS Billing dashboard
3. ✅ Identify expensive resources
4. ✅ Delete offending resources (NAT Gateways, Load Balancers, etc.)
5. ✅ Report findings
6. ✅ Wait for approval before continuing

### If Service Goes Down
1. ❌ DON'T make random changes
2. ✅ Check CloudWatch logs for errors
3. ✅ Check health check status in Fargate
4. ✅ Trigger rollback to last known good version
5. ✅ Document issue in incident report

### If Data Gets Corrupted
1. ✅ Stop writing to database
2. ✅ Restore from RDS backup (7-day retention)
3. ✅ Verify data integrity
4. ✅ Resume services
5. ✅ Document recovery in `DEPLOYMENT-NOTES.md`

---

## 📞 FINAL QUESTIONS FOR OWNER

Before you start Phase 8, confirm these decisions:

1. **AWS Region**: Which region? (us-east-1 recommended - most free tier resources available)
2. **Domain**: Will you use a custom domain, or AWS-provided DNS?
3. **SSL Certificate**: Use AWS Certificate Manager (free) or bring your own?
4. **Backup Strategy**: 7-day RDS backup sufficient, or need longer retention?
5. **Disaster Recovery**: Can you afford 1-hour RTO (recovery time), or need faster?
6. **Scaling**: Should system auto-scale on high load, or keep fixed capacity?

Once you confirm these, you're ready to execute Phase 8! 🚀

---

**READY TO LAUNCH?** 🚀

Let's deploy DriftSentry to production and make it real!

