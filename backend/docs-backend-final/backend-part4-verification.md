# 📊 BACKEND PHASE 4: VERIFICATION & VIBE-CODING GUIDE
## Logging, Monitoring & Deployment Checklist

---

## PHASE 4 OVERVIEW

**What You're Building**: Production observability + Docker deployment  
**Duration**: 2-3 hours  
**Status**: Building on Phases 1-3 ✅ foundation  
**Difficulty**: Medium (operations, Docker, monitoring)

---

## CRITICAL PHASE 4 CONCEPTS

### Structured Logging (JSON)

```
Development (pretty-printed):
  INFO Request started {method: GET, path: /api/v1/drifts}
  INFO Request completed {status: 200, duration: 45ms}

Production (JSON, machine-parseable):
  {"level":"info","msg":"Request started","method":"GET","path":"/api/v1/drifts","timestamp":"..."}
  {"level":"info","msg":"Request completed","status":200,"duration":45,"timestamp":"..."}
  
Benefits:
  ✅ Parseable by ELK, Datadog, Cloudflare, etc.
  ✅ Searchable by fields (userId, status, duration)
  ✅ Correlatable with trace IDs
  ✅ Aggregatable for metrics
```

### Correlation ID (Request Tracing)

```
Request 1:
  ├─ correlationId: "abc123"
  ├─ GET /drifts
  ├─ Service call
  ├─ DB query 1
  ├─ DB query 2
  └─ Response: ALL logs have "abc123"

Benefit: Follow entire request flow through logs
```

### Prometheus Metrics

```
Types:
  Counter    ← Monotonically increasing (total requests)
  Histogram  ← Distribution over time (request latency)
  Gauge      ← Current value (connections, memory)

Collection:
  ✅ Request metrics (total, duration by status)
  ✅ Error metrics (by code, by path)
  ✅ Database metrics (query duration)
  ✅ Custom business metrics
  
Scraping:
  Prometheus → GET /metrics → Prometheus format
```

### Health Checks (Orchestration)

```
Liveness Probe (/health/live):
  ✅ Is process running?
  ✅ Simple, fast check
  ✅ Restart if fails

Readiness Probe (/health/ready):
  ✅ Can handle requests?
  ✅ Check dependencies (DB, cache, etc.)
  ✅ Remove from load balancer if fails
  ✅ Used during rolling deployments
```

### Docker Multi-Stage Build

```
Stage 1: Build
  ├─ Large Node image
  ├─ Install dependencies
  ├─ Compile TypeScript
  └─ Result: ~1GB layer

Stage 2: Runtime
  ├─ Fresh alpine Node
  ├─ Copy only dist + node_modules
  ├─ No source code
  ├─ No dev dependencies
  └─ Result: ~200MB final image
  
Result: Final image is small & secure
```

---

## PRE-IMPLEMENTATION CHECKLIST

**Before Antigravity starts**:

- [ ] Phase 3 API endpoints fully working
- [ ] WebSocket real-time events working
- [ ] `npm run type-check` → 0 errors
- [ ] Database running with seed data
- [ ] Dependencies installed:
  ```bash
  npm install pino pino-pretty uuid prometheus
  npm install --save-dev @types/uuid
  ```
- [ ] Docker installed locally
- [ ] Understanding of JSON logging, metrics, health checks

---

## VIBE-CODING STANDARDS FOR PHASE 4

### Logging Standards (Critical)

```typescript
// ✅ CORRECT - Structured JSON logs
logger.info(
  {
    userId: user.id,
    driftId: drift.id,
    action: 'drift_approved',
    duration: 150,
  },
  'Drift approved'
);

// ✅ CORRECT - Error with full context
logger.error(
  {
    error: error.message,
    stack: error.stack,
    userId: user.id,
    driftId: drift.id,
    correlationId: req.correlationId,
  },
  'Failed to approve drift'
);

// ✅ CORRECT - Never log secrets
logger.info('User login', {
  userId: user.id,
  email: user.email,
  // NOT password, token, apiKey
});

// ❌ WRONG - Unstructured logs
logger.info('User ' + userId + ' approved drift ' + driftId);

// ❌ WRONG - Logging secrets
logger.info('Token created', { token: accessToken });

// ❌ WRONG - console.log instead of logger
console.log('Something happened');  // NO! Use logger

// ❌ WRONG - Too verbose in production
logger.debug('Inside loop iteration ' + i);  // Too much in prod
```

### Metrics Recording (Critical)

```typescript
// ✅ CORRECT - Record all operations
MetricsService.recordRequest(method, path, status, duration);
MetricsService.recordDatabaseQuery('SELECT', 'drifts', 25);
MetricsService.recordError(code, path);

// ✅ CORRECT - Observe all durations (not just success)
requestDuration.observe(150);  // Even slow requests
errorCounter.inc();  // All errors tracked

// ❌ WRONG - Only successful requests
if (success) {
  MetricsService.recordRequest(...);  // Missing failures!
}

// ❌ WRONG - Skipping error tracking
// Error happens but no metric recorded
```

### Configuration (Critical)

```typescript
// ✅ CORRECT - All config from environment
const port = parseInt(process.env.PORT || '3001', 10);
const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET required in production');
}

// ✅ CORRECT - Validate config at startup
validateConfig();  // Fail fast if config invalid

// ❌ WRONG - Hardcoded config
const port = 3001;
const secret = 'dev-secret';

// ❌ WRONG - Missing required config
const secret = process.env.JWT_SECRET;  // Could be undefined!
```

### Health Checks (Critical)

```typescript
// ✅ CORRECT - Comprehensive readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready',
      error: error.message 
    });
  }
});

// ✅ CORRECT - Simple liveness check
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// ❌ WRONG - No dependency checks
router.get('/health', (req, res) => {
  res.status(200).json({ ok: true });  // Doesn't verify DB!
});

// ❌ WRONG - Readiness doesn't check DB
router.get('/ready', (req, res) => {
  res.status(200).json({ ready: true });  // Always true!
});
```

### Docker Standards (Critical)

```dockerfile
# ✅ CORRECT - Multi-stage build
FROM node:20-alpine AS builder
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
USER node
HEALTHCHECK --interval=30s ...
CMD ["node", "dist/server.js"]

# ✅ CORRECT - Non-root user
USER node  # Security: not root

# ✅ CORRECT - Proper signal handling
ENTRYPOINT ["dumb-init", "--"]  # Handles SIGTERM

# ❌ WRONG - Single stage build (huge image)
FROM node:20
COPY . .
CMD ["npm", "start"]  # 1GB+ image!

# ❌ WRONG - Running as root
# No USER directive → runs as root

# ❌ WRONG - No health check
# Docker doesn't know if app is healthy
```

### Graceful Shutdown (Critical)

```typescript
// ✅ CORRECT - Handle shutdown signals
process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully');
  
  // Stop accepting new requests
  server.close();
  
  // Close database connections
  await prisma.$disconnect();
  
  // Close WebSocket connections
  io.close();
  
  logger.info('Shutdown complete');
  process.exit(0);
});

// ❌ WRONG - No shutdown handling
// App force-kills, connections don't close
// In-flight requests get killed
// Database connections leak
```

---

## POST-IMPLEMENTATION VERIFICATION

### Step 1: TypeScript & Build

```bash
npm run type-check  # 0 errors
npm run build       # success
npm run dev         # server starts

# Expected in console:
# 🚀 Server started on port 3001
# 📡 WebSocket ready
# ✅ Health check: /health/live, /health/ready
```

### Step 2: Health Checks

```bash
# Liveness (should always return 200)
curl http://localhost:3001/health/live
# { "status": "alive", "timestamp": "..." }

# Readiness (returns 503 if DB down)
curl http://localhost:3001/health/ready
# { "status": "ready", "checks": { "database": "ok" } }

# Detailed (includes memory, uptime)
curl http://localhost:3001/health/detailed
# { "status": "ok", "memory": {...}, "uptime": 120 }
```

### Step 3: Logging Verification

```bash
# Make a request
curl http://localhost:3001/api/v1/drifts

# Check logs for:
# ✅ JSON format (not string logs)
# ✅ "Request started" message
# ✅ "Request completed" message
# ✅ Correlation ID (x-correlation-id)
# ✅ Duration in milliseconds
# ✅ HTTP status code
```

### Step 4: Metrics Endpoint

```bash
# Get Prometheus metrics
curl http://localhost:3001/metrics

# Should contain:
# ✅ http_requests_total (counter)
# ✅ http_request_duration_ms (histogram)
# ✅ errors_total (counter)
# ✅ Prometheus format (not JSON)

# Example line:
# http_requests_total{method="GET",path="/drifts",status="200"} 5
```

### Step 5: Error Logging

```bash
# Trigger an error
curl -X POST http://localhost:3001/api/v1/drifts/invalid/approve \
  -H "Authorization: Bearer invalid" \
  -d '{}'

# Check logs for:
# ✅ Error level (not info)
# ✅ Error code (AUTH_ERROR, NOT_FOUND, etc.)
# ✅ Error message (without secrets)
# ✅ Stack trace
# ✅ Correlation ID
# ✅ Path, method, status
# ✅ No passwords, tokens, API keys logged
```

### Step 6: Docker Build

```bash
# Build image
docker build -t driftsentry:latest .

# Check:
# ✅ Build succeeds
# ✅ Image size < 500MB
# ✅ No source code in image
# ✅ No dev dependencies in image

# Check image size
docker images | grep driftsentry
# driftsentry latest ... ~300MB (good)
```

### Step 7: Docker Run

```bash
# Start container
docker run --rm \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/driftsentry" \
  -e JWT_SECRET="your-secret" \
  -p 3001:3001 \
  driftsentry:latest

# Expected:
# ✅ Container starts
# ✅ Server listens on port 3001
# ✅ No errors in logs
# ✅ Health check passes

# Test from another terminal
curl http://localhost:3001/health/live
# { "status": "alive" }
```

### Step 8: Docker Compose (Dev + Prod)

```bash
# Production stack
docker-compose -f docker-compose.prod.yml up

# Expected:
# ✅ App service starts
# ✅ PostgreSQL service starts
# ✅ Services connected to network
# ✅ App can reach database
# ✅ Logs are JSON structured

# Test
curl http://localhost:3001/api/v1/drifts
# Returns paginated drifts (connected to DB)
```

### Step 9: Configuration Validation

```bash
# Test missing critical config
docker run --rm \
  -e NODE_ENV=production \
  driftsentry:latest

# Expected:
# ❌ Exit with error
# "JWT_SECRET is required in production"

# Test with all config
docker run --rm \
  -e NODE_ENV=production \
  -e DATABASE_URL="..." \
  -e JWT_SECRET="secret" \
  driftsentry:latest

# Expected:
# ✅ Server starts
# ✅ Logs show "Configuration validated"
```

### Step 10: Graceful Shutdown

```bash
# Start server
npm run dev

# In another terminal, send SIGTERM
kill -TERM $(pgrep -f "node.*dist/server.js")

# Expected in logs:
# ✅ "Shutting down gracefully"
# ✅ "HTTP server closed"
# ✅ "Database disconnected"
# ✅ "Shutdown complete"
# ✅ Exit code 0

# Test timeout (kill -9 after 30s)
# If shutdown takes >30s, process force-kills
```

---

## SECURITY CHECKLIST

**Verify all 10 security requirements**:

- [ ] No secrets in Dockerfile
- [ ] Non-root user in container
- [ ] Proper signal handling (dumb-init)
- [ ] Health checks enabled
- [ ] Configuration validated at startup
- [ ] No hardcoded values
- [ ] Logs sanitized (no passwords, tokens)
- [ ] Error messages safe (no stack traces to clients)
- [ ] Correlation IDs for tracing
- [ ] HTTPS ready (X-Forwarded-Proto header handling)

---

## LOGGING VERIFICATION

**Check logs contain**:

```
✅ Request started: method, path, query, user-agent
✅ Request completed: method, path, status, duration
✅ Correlation ID on every log entry
✅ User ID (if authenticated)
✅ Module/service name
✅ Timestamp (ISO format)

✅ Error logs with: stack trace, context, correlation ID
✅ Database queries: operation, duration, table
✅ Business events: what happened, who, when

❌ No passwords, tokens, API keys
❌ No sensitive PII
❌ No internal implementation details exposed to client
```

---

## METRICS VERIFICATION

**Verify metrics are recorded**:

```
✅ http_requests_total (counter by method, path, status)
✅ http_request_duration_ms (histogram with buckets)
✅ errors_total (counter by code, path)
✅ database_query_duration_ms (by operation, table)
✅ Cache hits/misses (by cache name)

Performance:
✅ Metrics collection has <1ms overhead
✅ Prometheus scraping completes in <1s
```

---

## PERFORMANCE TARGETS

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Log write | <1ms | Per log entry |
| Metrics record | <0.1ms | Per metric |
| Health check | <100ms | Database query included |
| Graceful shutdown | <30s | Full cleanup |
| Docker build | <2min | Multi-stage build |
| Docker image | <500MB | Size on disk |

---

## INTEGRATION WITH MONITORING

**After Phase 4, you can integrate**:

```
Prometheus Scraping:
  scrape_configs:
    - job_name: 'driftsentry'
      static_configs:
        - targets: ['localhost:3001']
      metrics_path: '/metrics'

Grafana Dashboards:
  ✅ Request rate (requests/sec)
  ✅ Response time (p50, p95, p99)
  ✅ Error rate (errors/sec)
  ✅ Database performance
  ✅ Memory usage

Alerting:
  ✅ High error rate (>5%)
  ✅ Slow requests (>1s)
  ✅ Database unavailable
  ✅ Pod restart loop
```

---

## PHASE 4: SUCCESS SIGNALS

You'll know Phase 4 is complete when:

```
Build & Startup:
  ✅ npm run type-check → 0 errors
  ✅ npm run build → succeeds
  ✅ npm run dev → starts cleanly

Health Checks:
  ✅ /health/live → 200 OK (always)
  ✅ /health/ready → 200 OK (DB connected)
  ✅ /health/detailed → 200 with memory, uptime

Logging:
  ✅ JSON format (not strings)
  ✅ Correlation IDs present
  ✅ All requests logged
  ✅ All errors logged
  ✅ No secrets logged

Metrics:
  ✅ /metrics endpoint returns data
  ✅ Prometheus format (text)
  ✅ Request metrics recorded
  ✅ Error metrics recorded
  ✅ Database metrics recorded

Docker:
  ✅ Dockerfile builds
  ✅ Image size <500MB
  ✅ Container runs
  ✅ App accessible on port 3001
  ✅ Health checks pass
  ✅ Logs are JSON
  ✅ Configuration validates

Shutdown:
  ✅ SIGTERM handled gracefully
  ✅ Database connections closed
  ✅ Server closes cleanly
  ✅ Exit code 0

Production Ready:
  ✅ Can be deployed to Kubernetes
  ✅ Can be deployed to Docker
  ✅ Can be monitored with Prometheus
  ✅ Can be debugged with correlation IDs
  ✅ Can scale horizontally
```

---

**Phase 4 Verified! Production-ready backend complete!** 🚀
