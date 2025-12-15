# 📌 QUICK REFERENCE CARDS
## Keep These Handy During Development

---

## 1️⃣ PHASE 8 ROADMAP (Visual)

```
WEEK 1: APPLICATION HARDENING ✅ DONE
├── Day 1-2: Security foundations
│   ├── API key bcrypt hashing ✅
│   ├── Rate limiting (3-tier) ✅
│   ├── Security headers ✅
│   └── Audit logging ✅
├── Day 3: Multi-tenancy
│   ├── Account model ✅
│   ├── Account ID foreign keys ✅
│   └── Data isolation ✅
└── Day 4-5: Integration & Verification
    ├── All endpoints wired ✅
    ├── Browser testing ✅
    └── Performance verified ✅

WEEK 2: DEVOPS & DEPLOYMENT ⬜ STARTING NOW
├── Day 1: Preparation
│   ├── Read documentation (1-2 hours)
│   ├── Run pre-phase-8 checks
│   └── Answer decision checklist
├── Day 2: Containerization
│   ├── 8A: Docker setup (2 hours)
│   ├── 8B: docker-compose (1 hour)
│   └── Verify locally working
├── Day 3: CI/CD & AWS
│   ├── 8C: GitHub Actions (2 hours)
│   ├── 8D: AWS infrastructure (3 hours)
│   └── Test builds and deployments
└── Day 4: Deployment & Monitoring
    ├── 8E: Secrets management (1 hour)
    ├── 8F: Production deployment (2 hours)
    ├── 8G: Monitoring setup (1 hour)
    ├── 8H: Load testing (1 hour)
    └── Go live! 🚀

RESULT: Production-ready, monitored, cost-controlled SaaS platform
```

---

## 2️⃣ CODING RULES QUICK CHECK

**Before every commit**:

```
SECURITY:
  ☐ No secrets in code
  ☐ No hardcoded URLs/API keys
  ☐ Input validation present
  ☐ Auth checks on protected endpoints

CODE QUALITY:
  ☐ No duplicate code (DRY)
  ☐ Files < 300 lines
  ☐ Functions < 30 lines
  ☐ Clear variable names (not a, b, x)
  ☐ Comments explain WHY, not WHAT

TESTING:
  ☐ Unit tests for services
  ☐ Integration tests for flows
  ☐ Manual tests documented
  ☐ All tests pass before merge

PERFORMANCE:
  ☐ No N+1 queries
  ☐ Caching used where appropriate
  ☐ Response time < target
  ☐ No memory leaks

GIT:
  ☐ Conventional commit format
  ☐ Clear PR description
  ☐ No merge conflicts
  ☐ Code review approval

STATUS: Ready to merge ✅
```

---

## 3️⃣ AWS COST QUICK CHECK (Monthly)

```
Service                Expected Cost    Alert Level
─────────────────────────────────────────────────
Fargate               $0.00 ✅         >$0.20
RDS (db.t3.micro)     $0.00 ✅         >$0.20
ECR (storage)         $0.00 ✅         >$0.10
CloudWatch (logs)     $0.00 ✅         >$0.30
Lambda (if used)      $0.00 ✅         >$0.10
─────────────────────────────────────────────────
TOTAL:                $0.00            $1.00 HARD CAP

🔴 IF TOTAL > $1.00 → PAUSE DEPLOYMENTS IMMEDIATELY
```

---

## 4️⃣ ERROR HANDLING PATTERNS

### Backend (Express)

```typescript
// Always throw typed errors
throw new NotFoundError('Drift', id);
throw new ValidationError('Invalid email');
throw new UnauthorizedError('Token required');
throw new ForbiddenError('Admin only');

// Global handler catches all
app.use((error, req, res, next) => {
  logger.error(error);
  res.status(error.statusCode || 500).json({
    success: false,
    error: { code: error.name, message: error.message }
  });
});
```

### Frontend (React)

```typescript
// ErrorBoundary wraps entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// 401 triggers logout
if (error.statusCode === 401) {
  authStore.logout();
  navigate('/login');
}

// User-friendly messages
catch (error) {
  toast.error('Approval failed. Please try again.');
  logger.error('Drift approval', error);
}
```

---

## 5️⃣ DATABASE QUERY PATTERNS

### ✅ GOOD
```typescript
// Use relationships
const drifts = await db.drift.findMany({
  where: { accountId },
  include: { user: true }  // No N+1
});

// Explicit select
const drifts = await db.drift.findMany({
  where: { accountId },
  select: {
    id: true, status: true,
    user: { select: { name: true } }
  }
});
```

### ❌ BAD
```typescript
// N+1 queries
const drifts = await db.drift.findMany();
for (const drift of drifts) {
  drift.user = await db.user.findById(drift.userId); // 1 + n queries!
}
```

---

## 6️⃣ API RESPONSE FORMAT

**Always use this format**:

```typescript
// Success (2xx)
{
  "success": true,
  "data": { /* actual data */ }
}

// Error (4xx, 5xx)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}

// Paginated (list endpoints)
{
  "success": true,
  "data": {
    "items": [ /* array */ ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

---

## 7️⃣ TESTING PATTERNS

### Unit Test Template
```typescript
describe('DriftService', () => {
  let service: DriftService;
  let mockRepo: jest.Mocked<IDriftRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    service = new DriftService(mockRepo);
  });

  it('should approve drift and log audit', async () => {
    mockRepo.findById.mockResolvedValue(drift);
    mockRepo.update.mockResolvedValue({ ...drift, status: 'approved' });

    const result = await service.approveDrift('123', 'user-1');

    expect(result.status).toBe('approved');
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
```

### Integration Test Template
```typescript
describe('Login Flow', () => {
  it('should login and persist session', async () => {
    // Register
    const reg = await request(app).post('/auth/register').send(...);
    expect(reg.status).toBe(201);

    // Login
    const login = await request(app).post('/auth/login').send(...);
    expect(login.status).toBe(200);

    // Use token
    const me = await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
  });
});
```

---

## 8️⃣ ENVIRONMENT VARIABLES

### .env.example (safe to commit)
```env
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/database
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
PORT=3002
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### .env (NEVER commit, gitignore required)
```env
NODE_ENV=production
DATABASE_URL=postgresql://admin:actual_password@rds-endpoint:5432/clouddrift
REDIS_URL=redis://redis-endpoint:6379
JWT_SECRET=actual-production-secret-from-secrets-manager
PORT=3002
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## 9️⃣ GIT WORKFLOW QUICK START

```bash
# 1. Create feature branch
git checkout -b feature/multi-tenancy-accounts

# 2. Make changes
vim src/models/user.ts
npm test

# 3. Commit with conventional format
git add .
git commit -m "feat(auth): add multi-tenancy to user model

- Add accountId to User model
- Add Account model with relationships
- Add migration for new columns"

# 4. Push and create PR
git push origin feature/multi-tenancy-accounts
# Go to GitHub, create PR with description

# 5. Wait for review + tests to pass
# Then merge: git checkout develop && git merge --no-ff feature/...

# 6. Delete branch
git branch -d feature/multi-tenancy-accounts
```

**Commit message format**:
```
<type>(<scope>): <subject>

<body>

Closes #123
```

---

## 🔟 PERFORMANCE TARGETS

| Endpoint | Target | Warning | Critical |
|----------|--------|---------|----------|
| GET /metrics | <500ms | >1s | >2s |
| GET /drifts | <800ms | >1.5s | >2.5s |
| POST /drifts/:id/approve | <1s | >1.5s | >2s |
| Full dashboard load | <2s | >3s | >4s |
| API response (any) | <500ms | >1s | >2s |

**How to check**:
1. DevTools → Network tab
2. Load page
3. Check "Finish" time
4. Compare to targets above

---

## 1️⃣1️⃣ SECURITY CHECKLIST (Per Commit)

```
AUTH:
  ☐ Protected endpoints have authMiddleware
  ☐ JWT tokens validated
  ☐ Permissions checked (not just auth)

SECRETS:
  ☐ No API keys in code
  ☐ No passwords in code
  ☐ .env.example used only
  ☐ Real secrets from env vars

VALIDATION:
  ☐ Input validated with Zod
  ☐ Email/URL formats checked
  ☐ Range checks (min/max)
  ☐ Type checks (TypeScript strict)

SQL INJECTION:
  ☐ Using ORM (Prisma) - safe by default
  ☐ No string concatenation in queries
  ☐ Parameterized queries

CORS:
  ☐ CORS whitelist configured
  ☐ Not * (wildcard) in production
  ☐ Credentials handled correctly

STATUS: Secure ✅
```

---

## 1️⃣2️⃣ DOCUMENTATION TEMPLATE

### For each service/file:

```typescript
/**
 * Service for managing infrastructure drifts
 * 
 * Responsibilities:
 * - Detect configuration changes
 * - Manage drift lifecycle
 * - Generate audit logs
 */
export class DriftService {
  /**
   * Approve a drift for remediation
   * 
   * @param driftId - ID of drift to approve
   * @param userId - ID of user approving
   * @returns Approved drift object
   * @throws {NotFoundError} If drift doesn't exist
   * @throws {ForbiddenError} If user lacks permission
   */
  async approveDrift(driftId: string, userId: string): Promise<Drift> {
    // implementation
  }
}
```

---

## 1️⃣3️⃣ DEPLOYMENT CHECKLIST (Before merging to main)

```
CODE:
  ☐ All tests pass
  ☐ No console.log() (use logger)
  ☐ No TODO comments
  ☐ TypeScript strict mode
  ☐ No any types

SECURITY:
  ☐ No secrets in code
  ☐ Rate limiting functional
  ☐ Auth checks present
  ☐ CORS configured

PERFORMANCE:
  ☐ Response times < targets
  ☐ No N+1 queries
  ☐ Caching implemented
  ☐ No memory leaks

DATABASE:
  ☐ Migrations created
  ☐ Rollback tested
  ☐ Indexes added
  ☐ Foreign keys correct

MONITORING:
  ☐ Logging present
  ☐ Metrics recorded
  ☐ Error tracking works
  ☐ Health checks pass

DOCUMENTATION:
  ☐ API documented
  ☐ README updated
  ☐ Architecture clear
  ☐ Deployment steps clear

STATUS: Ready for production ✅
```

---

## 1️⃣4️⃣ INCIDENT RESPONSE (Things go wrong)

### Dashboard is slow
```bash
# 1. Check CloudWatch metrics
aws cloudwatch get-metric-statistics --namespace AWS/ECS ...

# 2. Check Redis cache hit rate
redis-cli info stats

# 3. Check database slow queries
SELECT query_time, query FROM slow_log

# 4. Scale up if needed (costs $)
aws ecs update-service --desired-count 4
```

### Error rate is high
```bash
# 1. Check CloudWatch logs
aws logs tail /ecs/driftsentry-backend --follow

# 2. Check recent deployments
aws ecs describe-services --services driftsentry-backend

# 3. Rollback if needed
aws ecs update-service --task-definition driftsentry-backend:PREVIOUS_VERSION

# 4. Investigate root cause
# Check recent commits in GitHub Actions logs
```

### Cost exceeded budget
```bash
# 1. STOP all deployments immediately
# 2. Check AWS Billing Console
# 3. Identify expensive resource
# 4. Delete it (usually: NAT Gateway, Load Balancer, ElastiCache)
# 5. Report findings to owner
# 6. Wait for approval before continuing
```

---

## 1️⃣5️⃣ COMMAND REFERENCE

### Local Development
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Reset database
docker-compose down -v && docker-compose up -d
```

### Backend (npm)
```bash
npm install               # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Check code style
npm run db:migrate      # Apply migrations
npm run db:reset        # Reset database
```

### Frontend (npm)
```bash
npm install               # Install dependencies
npm run dev             # Start dev server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Check code style
```

### Docker
```bash
docker build -t app:latest .
docker run -p 3002:3002 app:latest
docker push registry.com/app:latest
```

### Git
```bash
git checkout -b feature/my-feature
git add .
git commit -m "feat(api): description"
git push origin feature/my-feature
git pull origin develop
git merge feature/my-feature
git push origin develop
```

### AWS (CLI)
```bash
# Deploy
aws ecs update-service --cluster driftsentry --service backend --force-new-deployment

# Logs
aws logs tail /ecs/driftsentry-backend --follow

# Metrics
aws cloudwatch get-metric-statistics ...

# Cost
aws ce get-cost-and-usage ...
```

---

## 📍 WHERE TO FIND THINGS

| What | Where |
|------|-------|
| Coding rules | CODING-RULES-STANDARDS.md |
| Phase 8 details | PHASE-8-DEVOPS-COMPLETE.md |
| Pre-deployment tests | PRE-PHASE-8-READINESS-CHECKLIST.md |
| Architecture decisions | README.md, BACKEND.md |
| Environment variables | .env.example |
| Database schema | schema.prisma |
| API documentation | BACKEND.md, API endpoints section |
| Deployment runbook | DEPLOYMENT-NOTES.md |
| Disaster recovery | DISASTER-RECOVERY.md |

---

## ✅ BEFORE YOU ASK FOR HELP

```
1. Search the documentation
2. Check if similar issue exists in GitHub Issues
3. Review error message carefully
4. Check logs (CloudWatch, console)
5. Try debugging locally first
6. THEN ask for help with:
   - What you tried
   - What happened
   - What you expected
   - Logs/error messages
   - Steps to reproduce
```

---

**Print this page. Keep it on your desk. Reference daily.**

🚀 **You've got everything you need. Build something great!**

