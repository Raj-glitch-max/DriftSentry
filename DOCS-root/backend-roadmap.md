# 📋 BACKEND INTEGRATION ROADMAP
## CloudDrift Guardian - Complete Backend Implementation Plan

---

## OVERVIEW

The backend is divided into **4 phases**, each building on the previous one:

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: Domain Modeling & Data Persistence (2-3 hours)      │
│  ├─ PostgreSQL schema creation                                  │
│  ├─ Prisma ORM setup                                           │
│  ├─ Domain types & interfaces                                   │
│  └─ Repository pattern implementation                           │
│                                                                  │
│  Phase 2: API Contracts & Service Layer (3-4 hours)            │
│  ├─ REST endpoint design                                        │
│  ├─ Request/Response validation                                 │
│  ├─ Business logic services                                     │
│  └─ API middleware & error handling                            │
│                                                                  │
│  Phase 3: Authentication & Real-Time (2-3 hours)               │
│  ├─ JWT token generation & validation                          │
│  ├─ Role-based access control (RBAC)                           │
│  ├─ WebSocket setup for real-time updates                      │
│  └─ Session management                                          │
│                                                                  │
│  Phase 4: Deployment & Operations (2-3 hours)                  │
│  ├─ Structured logging & metrics                               │
│  ├─ Error monitoring & alerting                                │
│  ├─ Database migrations automation                             │
│  └─ Docker & deployment configuration                          │
│                                                                  │
│  **Total: ~9-13 hours → Fully functional backend**             │
└─────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: DOMAIN MODELING & DATA PERSISTENCE

**Status**: Ready for Antigravity  
**Prompt File**: `backend-part1-prompt.md`  
**Duration**: 2-3 hours

### Deliverables

1. **Database Schema** (`src/database/migrations/`)
   - 001_initial_schema.sql (users, drifts, alerts, audit_logs, cost_metrics, sessions)
   - 002_indexes.sql (performance indexes for all queries)
   - 003_functions.sql (triggers for updated_at, stored procedures)

2. **Prisma ORM** (`prisma/schema.prisma`)
   - Type-safe database client
   - Auto-generated types matching database
   - Relations defined correctly

3. **Domain Types** (`src/types/domain/`)
   - Drift, User, Alert, AuditLog, CostMetric, Session
   - Request/Response DTOs
   - Never uses Prisma models in API

4. **Repositories** (`src/repositories/`)
   - DriftRepository (create, list, getById, updateStatus, findRecentDuplicate)
   - UserRepository (create, getByEmail, getById, updateRole)
   - AlertRepository (create, list, markAsRead)
   - CostMetricRepository (create, listByDrift)
   - AuditLogRepository (log, listByDrift)

5. **Utilities**
   - `src/utils/errors.ts` - Custom error classes (ValidationError, AuthError, NotFoundError, etc.)
   - `src/utils/logger.ts` - Structured logging (info, warn, error, debug)
   - `src/database/prisma.ts` - Prisma client singleton

6. **Seed Script** (`src/database/seed.ts`)
   - Creates test users (admin, engineer, viewer)
   - Creates realistic test drifts (critical, warning, info statuses)
   - Populates related alerts and metrics

7. **Documentation**
   - `DATABASE_SCHEMA.md` - Full schema explanation
   - `src/database/README.md` - Setup instructions
   - `.env.example` - Environment variables template

### Key Requirements

- ✅ Strict TypeScript (no `any` types)
- ✅ All UUIDs use PostgreSQL `uuid` type
- ✅ All timestamps use `TIMESTAMP WITH TIME ZONE`
- ✅ All JSON stored in JSONB (queryable & indexed)
- ✅ Proper indexes on filtered columns (status, severity, created_at)
- ✅ Foreign keys with ON DELETE CASCADE/SET NULL
- ✅ Check constraints for enum-like fields
- ✅ Triggers for automatic `updated_at` timestamps
- ✅ All errors caught and logged
- ✅ Repository pattern (no raw Prisma in services)

### Next: Phase 2 Dependencies

- Frontend expects API responses in `docs/backend-integration.md` format
- All endpoints must return typed DriftResponse, AlertResponse, etc.
- All errors must follow ErrorResponse envelope
- Pagination must use offset/limit pattern

---

## PHASE 2: API CONTRACTS & SERVICE LAYER

**Prompt**: Will be created after Phase 1  
**Duration**: 3-4 hours

### What Will Be Implemented

1. **REST Endpoints**
   - `GET /api/v1/drifts` - List with filters, pagination
   - `GET /api/v1/drifts/:id` - Get single drift with related data
   - `POST /api/v1/drifts` - Create drift (internal only)
   - `POST /api/v1/drifts/:id/approve` - Approve drift
   - `POST /api/v1/drifts/:id/reject` - Reject drift
   - `GET /api/v1/alerts` - List alerts
   - `POST /api/v1/alerts/:id/mark-read` - Mark alert as read
   - `GET /api/v1/metrics/summary` - Dashboard summary
   - `GET /api/v1/metrics/cost-trend` - Cost over time

2. **Service Layer**
   - DriftService - Business logic (create, approve, reject, list)
   - AlertService - Alert management
   - MetricsService - Dashboard calculations
   - AuditService - Audit trail logging

3. **Validation & Middleware**
   - Input validation with Zod schemas
   - Error handling middleware
   - Pagination middleware
   - Logging middleware

4. **Response Envelopes**
   ```typescript
   // Success
   {
     success: true,
     data: { ... }
   }
   
   // Error
   {
     success: false,
     error: {
       code: 'VALIDATION_ERROR',
       message: '...',
       details: { ... },
       timestamp: '...'
     }
   }
   ```

### Frontend Integration Points

The frontend already has:
- Mock API endpoints in `src/services/driftApi.ts`
- Service layer hooks in `src/hooks/useDrifts.ts`, etc.
- Type definitions matching backend responses

When Phase 2 is done:
- Set `USE_MOCK = false` in `src/services/driftApi.ts`
- Replace API_BASE_URL with backend server
- No component changes needed (contracts already match)

---

## PHASE 3: AUTHENTICATION & REAL-TIME

**Prompt**: Will be created after Phase 2  
**Duration**: 2-3 hours

### What Will Be Implemented

1. **JWT Authentication**
   - Login endpoint (`POST /api/v1/auth/login`)
   - Refresh token endpoint (`POST /api/v1/auth/refresh`)
   - Logout endpoint (`POST /api/v1/auth/logout`)
   - Token verification middleware

2. **Authorization (RBAC)**
   - Admin - Full access
   - Engineer - Can approve/reject drifts, view all drifts
   - Viewer - Read-only access

3. **WebSocket Real-Time Updates**
   - Socket.io setup
   - Drift event streams (drift:created, drift:approved, etc.)
   - Alert event streams
   - User subscriptions

4. **Session Management**
   - Refresh token rotation
   - Session revocation
   - Logout all devices

---

## PHASE 4: DEPLOYMENT & OPERATIONS

**Prompt**: Will be created after Phase 3  
**Duration**: 2-3 hours

### What Will Be Implemented

1. **Logging & Observability**
   - Structured JSON logging
   - Log levels (debug, info, warn, error)
   - Correlation IDs for request tracing
   - Metrics collection

2. **Error Monitoring**
   - Error aggregation
   - Stack trace preservation
   - Context preservation
   - Retry logic with exponential backoff

3. **Database Migrations**
   - Automated migration running on startup
   - Migration rollback capability
   - Schema versioning

4. **Deployment**
   - Docker setup
   - Environment configuration
   - Database initialization
   - Health checks

---

## EXECUTION INSTRUCTIONS

### For Phase 1 (NOW)

1. Copy `backend-part1-prompt.md` content
2. Share with Antigravity AI
3. Request to implement exactly as specified
4. Verify all deliverables are present
5. Run `npm run type-check` - should pass with 0 errors
6. Run `npm run seed` - should populate test data
7. Check database has all tables and indexes

### For Phase 2 (After Phase 1)

1. I will create `backend-part2-prompt.md`
2. Share with Antigravity
3. Implement REST endpoints
4. Wire repositories to services
5. Test with frontend mock data

### For Phase 3 (After Phase 2)

1. I will create `backend-part3-prompt.md`
2. Implement JWT & WebSocket
3. Test authentication flows

### For Phase 4 (After Phase 3)

1. I will create `backend-part4-prompt.md`
2. Add logging, metrics, monitoring
3. Create Docker configuration
4. Deploy to staging

---

## QUALITY GATES

**Each phase must pass**:

1. ✅ **TypeScript Compilation**
   ```bash
   npm run type-check  # 0 errors, 0 warnings
   ```

2. ✅ **Linting**
   ```bash
   npm run lint  # 0 errors
   ```

3. ✅ **Tests** (if applicable)
   ```bash
   npm run test  # All pass
   ```

4. ✅ **Database Health**
   ```bash
   npm run db:status  # All tables present, migrations applied
   ```

5. ✅ **Seed Successful**
   ```bash
   npm run seed  # Data inserted without errors
   ```

---

## BACKEND TECHNICAL RULES

**All 4 phases must follow** `backend-rules.md`:

### The 5 Pillars
1. **Completeness over Perfection** - No incomplete code
2. **Correctness over Cleverness** - Clear, obvious, auditable
3. **Safety over Speed** - Data consistency first
4. **Observability over Assumptions** - Log everything important
5. **Security by Design** - Assume worst, defend accordingly

### Code Standards
- Strict TypeScript (no `any`)
- Every function has JSDoc
- Every error is caught and logged
- Every async operation has timeout
- Every database query is indexed
- Every mutation is in a transaction
- Every secret is never logged

---

## TIMELINE ESTIMATE

```
Today (Phase 1):        2-3 hours  ← Frontend is done, you start here
Tomorrow (Phase 2):     3-4 hours
Day 3 (Phase 3):        2-3 hours
Day 4 (Phase 4):        2-3 hours
─────────────────────────────────
Total Backend:          ~9-13 hours

Then: Integrate Frontend + Backend, test end-to-end, deploy
```

---

## FILES PROVIDED

1. **backend-rules.md** (162 KB)
   - Complete backend technical decision framework
   - All rules, patterns, anti-patterns
   - Copy to `.cursor/rules/backend-rules.mdc` in your IDE

2. **backend-part1-prompt.md** (45 KB)
   - Exact prompt to give Antigravity for Phase 1
   - All deliverables specified
   - Success criteria defined

3. **This file**: backend-integration-roadmap.md
   - Overview of all 4 phases
   - Timeline and dependencies
   - Quality gates

---

## NEXT STEPS

1. **Now**: Give Antigravity `backend-part1-prompt.md`
2. **Monitor**: Check progress, answer clarifying questions
3. **Verify**: Run quality gate tests
4. **Next**: Create `backend-part2-prompt.md` once Phase 1 is done

---

**Backend Ready!** Let's build a rock-solid data layer. 🚀
