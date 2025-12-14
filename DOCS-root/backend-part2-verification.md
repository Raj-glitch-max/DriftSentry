# 📊 BACKEND PHASE 2: COMPLETE WALKTHROUGH GUIDE
## Comprehensive Implementation Checklist + Vibe-Coding Standards

---

## PHASE 2 OVERVIEW

**What You're Building**: REST API layer connecting frontend to database  
**Duration**: 3-4 hours  
**Status**: Ready for Antigravity implementation  
**Difficulty**: Medium (business logic + HTTP handling)

---

## THE 5 SECTIONS OF PHASE 2

### Section 2.1: Express App Factory (`src/app.ts`)

**What**: Configure Express with middleware stack  
**Why**: Centralized app configuration = easier testing and deployments

**Deliverables**:
- ✅ `createApp()` function that sets up Express
- ✅ Security middleware (helmet, CORS)
- ✅ Parsing middleware (JSON, URL-encoded)
- ✅ Health check endpoints (`/health`, `/health/ready`)
- ✅ Logging middleware on all requests
- ✅ 404 handler for missing routes
- ✅ Global error handler (last middleware)

**Code Structure**:
```
Express → Security → Parsing → Logging → Routes → 404 → Error Handler
                                                           (catches all)
```

**Key Points**:
- Health check must test database connection
- Error handler MUST be last
- All middleware must have proper error boundaries
- Environment-based CORS origin

---

### Section 2.2: Input Validation (`src/schemas/`)

**What**: Zod schemas for request body/query validation  
**Why**: Type-safe, auto-generating error messages, matches TypeScript types

**Deliverables**:
- ✅ `drift.schema.ts` - List, Create, Approve, Reject schemas
- ✅ `alert.schema.ts` - List, MarkAsRead schemas
- ✅ `common.schema.ts` - Pagination, sorting, shared schemas
- ✅ `validateRequest()` helper function
- ✅ Type exports for TypeScript (`z.infer<typeof schema>`)

**Validation Layers**:
1. **Syntax** (Zod) - Is it the right structure?
2. **Semantics** (Service) - Does it make business sense?

Example:
```typescript
// Zod validates: min length, max length, format
// Service validates: no duplicate drift, expected != actual

const input = validateRequest(approveDriftSchema, req.body);
// Throws ValidationError with field-level details

const drift = await driftService.approveDrift(id, input, userId);
// Throws ConflictError if can't approve in current status
```

---

### Section 2.3: Service Layer (`src/services/`)

**What**: Business logic isolated from HTTP concerns  
**Why**: Testable, reusable, clear separation of concerns

**Deliverables**:
- ✅ `drift.service.ts` - List, Get, Create, Approve, Reject
- ✅ `alert.service.ts` - Create, List, MarkAsRead, Count
- ✅ `metrics.service.ts` - Summary, CostTrend calculations
- ✅ `audit.service.ts` - Log all actions immutably

**Service Pattern**:
```
Route → Service ─→ Repository ─→ Database
                 └→ AuditService (log)
                 └→ AlertService (notify)
```

Services:
1. **Validate business rules** (not just schema)
2. **Coordinate multiple repos** (ensure data consistency)
3. **Emit side effects** (audits, alerts, logs)
4. **Never expose raw DB models** (always transform)
5. **Handle all errors gracefully** (descriptive messages)

---

### Section 2.4: REST Endpoints (`src/routes/`)

**What**: HTTP handlers that map to services  
**Why**: Simple, stateless request → response transformation

**Deliverables**:
- ✅ 5 Drift endpoints (list, get, approve, reject)
- ✅ 2 Alert endpoints (list, mark-read)
- ✅ 2 Metrics endpoints (summary, cost-trend)
- ✅ All endpoints validated and error-handled
- ✅ All endpoints logged
- ✅ Proper HTTP status codes (200, 201, 400, 404, 409)

**Endpoint Template** (all follow same pattern):
```typescript
router.get('/', async (req, res, next) => {
  try {
    const startTime = Date.now();
    
    // 1. Validate input
    const input = validateRequest(schema, req.body || req.query);
    
    // 2. Call service
    const result = await service.method(input);
    
    // 3. Log success
    logger.debug('Endpoint completed', {
      duration: Date.now() - startTime,
    });
    
    // 4. Return response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Pass to error middleware
    next(error);
  }
});
```

---

### Section 2.5: Error Handling (`src/middleware/error.middleware.ts`)

**What**: Global error catch-all  
**Why**: Consistent error responses, no API leaks

**Deliverables**:
- ✅ Catches all synchronous errors
- ✅ Catches all async errors (via `next(error)`)
- ✅ Generates trace IDs for debugging
- ✅ Returns consistent error envelope
- ✅ Logs all errors with context
- ✅ Never logs secrets (passwords, tokens)

**Error Envelope**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "errors": [
        { "field": "reason", "message": "Too short" }
      ]
    },
    "traceId": "trace_1702546800000",
    "timestamp": "2025-12-14T02:00:00Z"
  }
}
```

---

## VIBE-CODING VERIFICATION CHECKLIST

### ✅ PRE-IMPLEMENTATION CHECKLIST

Before Antigravity starts coding:

- [ ] Phase 1 database is running (`docker-compose up`)
- [ ] Phase 1 seed data is populated (`npm run seed`)
- [ ] `.env` file has `DATABASE_URL`
- [ ] All Phase 1 types are exported from `src/types/index.ts`
- [ ] All Phase 1 repositories are exported from `src/repositories/index.ts`
- [ ] TypeScript compilation works (`npm run type-check`)

---

### ✅ DURING IMPLEMENTATION

**Code Quality Standards** (non-negotiable):

1. **TypeScript Strictness**
   ```typescript
   // ✅ CORRECT - Explicit types everywhere
   async function approveDrift(
     driftId: string,
     input: ApproveDriftInput,
     userId: string
   ): Promise<Drift> {
     // implementation
   }
   
   // ❌ WRONG - Any types, implicit returns
   async function approveDrift(driftId, input, userId): any {
     // implementation
   }
   ```

2. **Error Handling**
   ```typescript
   // ✅ CORRECT - Try-catch with specific error classes
   try {
     const drift = await driftRepository.getById(id);
     if (!drift) throw new NotFoundError(`Drift ${id} not found`);
     return drift;
   } catch (error) {
     logger.error('Failed to get drift', { id, error });
     throw error;  // Re-throw, let middleware handle
   }
   
   // ❌ WRONG - No error handling
   const drift = await driftRepository.getById(id);
   return drift;  // Could be null, crashes
   ```

3. **Logging Context**
   ```typescript
   // ✅ CORRECT - Contextual logging
   logger.info('Drift approved', {
     driftId: drift.id,
     approvedBy: userId,
     severity: drift.severity,
     duration: Date.now() - startTime,
   });
   
   // ❌ WRONG - Generic messages
   logger.info('Done');
   ```

4. **Function Complexity**
   ```typescript
   // ✅ CORRECT - Single responsibility, <20 lines
   private validateDriftInput(input: CreateDriftInput): void {
     if (expectedState === actualState) {
       throw new ValidationError('No difference detected');
     }
   }
   
   // ❌ WRONG - Too complex, does too much
   private validateAndProcess(input) {
     if (expectedState === actualState) throw new Error();
     const diff = computeDiff(...);
     const metrics = calculateCost(...);
     await database.save(...);
     // ... 50 lines of logic
   }
   ```

5. **Naming Clarity**
   ```typescript
   // ✅ CORRECT - Explicit, searchable names
   const canApprove = ['detected', 'triaged'].includes(drift.status);
   const costImpactMonthly = calculateMonthlyCost(drift);
   
   // ❌ WRONG - Cryptic abbreviations
   const ca = d.s === 'd' || d.s === 't';
   const c = f(d);
   ```

---

### ✅ POST-IMPLEMENTATION VERIFICATION

**Run in this order:**

#### 1. TypeScript Compilation
```bash
npm run type-check

# Expected output:
# ✅ No errors found in your code
# 
# If errors:
# - Fix all type errors (0 allowed)
# - No type: any
# - All function signatures explicit
```

#### 2. Linting
```bash
npm run lint

# Expected output:
# ✅ 0 warnings
#
# If errors:
# - Unused imports removed
# - Consistent spacing
# - No console.log() calls (use logger)
```

#### 3. Build Verification
```bash
npm run build

# Expected output:
# ✅ Successfully compiled src/
# dist/ folder created with .js files
```

#### 4. Server Startup
```bash
npm run dev

# Expected output:
# 🚀 Server started on port 3001
# ✅ Database connected
# 
# If fails:
# - Check DATABASE_URL in .env
# - Ensure PostgreSQL running (docker-compose up)
# - Check Prisma client generated (npx prisma generate)
```

#### 5. Manual Endpoint Testing

**Test all 9 endpoints** with curl:

```bash
# ===== DRIFT ENDPOINTS =====

# 1. List drifts
curl -X GET "http://localhost:3001/api/v1/drifts?page=1&limit=10" \
  -H "Content-Type: application/json"

# Expected: 200 with items array

# 2. Get single drift
curl -X GET "http://localhost:3001/api/v1/drifts/{drift-id}" \
  -H "Content-Type: application/json"

# Expected: 200 with drift details + alertCount + canApprove

# 3. Approve drift
curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/approve" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Cost-benefit analysis shows this change is acceptable"
  }'

# Expected: 200 with updated drift status=approved

# 4. Reject drift
curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/reject" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "This change must not be deployed without review"
  }'

# Expected: 200 with updated drift status=rejected

# ===== ALERT ENDPOINTS =====

# 5. List alerts
curl -X GET "http://localhost:3001/api/v1/alerts?page=1&limit=10" \
  -H "Content-Type: application/json"

# Expected: 200 with alerts array

# 6. Mark alert as read
curl -X POST "http://localhost:3001/api/v1/alerts/{alert-id}/mark-read" \
  -H "Content-Type: application/json"

# Expected: 200 with alert isRead=true

# ===== METRICS ENDPOINTS =====

# 7. Dashboard summary
curl -X GET "http://localhost:3001/api/v1/metrics/summary" \
  -H "Content-Type: application/json"

# Expected: 200 with dashboard metrics (counts, totals)

# 8. Cost trend
curl -X GET "http://localhost:3001/api/v1/metrics/cost-trend?days=30" \
  -H "Content-Type: application/json"

# Expected: 200 with cost data points over time
```

#### 6. Validation Testing

**Test error handling**:

```bash
# Too short reason (validation error)
curl -X POST "http://localhost:3001/api/v1/drifts/{id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"reason": "short"}'

# Expected: 400 with VALIDATION_ERROR code

# Invalid drift ID (not found)
curl -X GET "http://localhost:3001/api/v1/drifts/invalid-uuid"

# Expected: 404 with NOT_FOUND code

# Approve already approved drift (conflict)
curl -X POST "http://localhost:3001/api/v1/drifts/{approved-id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"reason": "This should fail"}'

# Expected: 409 with CONFLICT code
```

#### 7. Database Query Performance

**Check if queries use indexes**:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Run explain plan
EXPLAIN ANALYZE
SELECT * FROM drifts WHERE status = 'detected' ORDER BY created_at DESC LIMIT 20;

# Look for: "Index Scan using idx_drifts_status"
# NOT: "Seq Scan" (bad - full table scan)
```

#### 8. Logging Verification

**Check logs are being written**:

```bash
# Monitor logs in real-time
tail -f logs/application.log  # if file-based
docker logs {container}       # if Docker

# Should see:
# - Request start (method, path)
# - Request end (status, duration)
# - Business logic events (drift created, approved, etc)
# - Errors with full context
```

---

## CRITICAL VIBE-CODING RULES FOR PHASE 2

### 🚫 NEVER DO

```typescript
// ❌ Don't use any
const result: any = await service.method();

// ❌ Don't skip error handling
const drift = await driftRepository.getById(id);
return drift;  // Could be null!

// ❌ Don't log secrets
logger.info('User login', { password: user.password });

// ❌ Don't mutate state outside transaction
await driftRepository.update(...);
await alertService.create(...);  // If this fails, data inconsistent!

// ❌ Don't expose raw Prisma models
return await prisma.drift.findUnique({...});  // Missing transform

// ❌ Don't handle errors silently
try {
  await service.method();
} catch (error) {
  // Silence = bug
}

// ❌ Don't nest more than 2 levels deep
if (condition1) {
  if (condition2) {
    if (condition3) {
      // Too deep! Refactor
    }
  }
}
```

### ✅ ALWAYS DO

```typescript
// ✅ Do use explicit types
const result: Drift = await driftService.getDrift(id);

// ✅ Do check for null/undefined
const drift = await driftRepository.getById(id);
if (!drift) throw new NotFoundError(`Drift ${id} not found`);

// ✅ Do sanitize logs
logger.info('User login', { userId, email });  // No password

// ✅ Do use transactions
try {
  await transaction(async (tx) => {
    await tx.drift.update(...);
    await tx.auditLog.create(...);  // Both or nothing
  });
} catch (error) {
  // Rollback automatic
}

// ✅ Do transform Prisma models
const raw = await prisma.drift.findUnique({...});
return driftRepository.toDomain(raw);

// ✅ Do handle all error paths
try {
  await service.method();
} catch (error) {
  logger.error('Method failed', { error });
  throw error;  // Let middleware handle
}

// ✅ Do extract complex logic to functions
const canApprove = this.canApproveInStatus(drift.status);
const diff = this.computeDifference(expected, actual);
```

---

## PERFORMANCE TARGETS

**Phase 2 endpoints must meet these targets**:

| Endpoint | Latency | Complexity |
|----------|---------|------------|
| GET /drifts | <200ms | List + filter + paginate |
| GET /drifts/:id | <100ms | Single fetch |
| POST /approve | <300ms | Update + audit + alert |
| POST /reject | <300ms | Update + audit |
| GET /alerts | <150ms | List alerts |
| GET /metrics/summary | <250ms | Aggregation query |

**How to measure**:

```typescript
// In route handler
const startTime = Date.now();
const result = await service.method();
const duration = Date.now() - startTime;

logger.debug('Endpoint', { duration, result: result.length });

// Monitor: duration should be <target ms
```

---

## PHASE 2: SUCCESS SIGNALS

You'll know Phase 2 is complete when:

1. ✅ `npm run type-check` - **0 errors**
2. ✅ `npm run lint` - **0 warnings**
3. ✅ `npm run build` - **succeeds**
4. ✅ `npm run dev` - **server starts on 3001**
5. ✅ All 9 endpoints respond with correct data
6. ✅ All error cases return proper error envelope
7. ✅ All endpoints log request details
8. ✅ Database queries use indexes (no seq scans)
9. ✅ No secrets in logs
10. ✅ Frontend can wire to real API

---

## PHASE 2 → PHASE 3 TRANSITION

**Once Phase 2 is done**:

1. Verify all checks pass
2. Commit code to git
3. Document any issues found
4. I create `backend-part3-prompt.md` for authentication

**Phase 3 will add**:
- JWT token generation/verification
- Role-based access control (RBAC)
- WebSocket for real-time updates
- Session management

---

**Phase 2 Ready!** Time to build the API layer. 🎯
