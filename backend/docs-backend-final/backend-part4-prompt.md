# 🚀 BACKEND PHASE 4: LOGGING, MONITORING & DEPLOYMENT
## Implementation Prompt for Antigravity
**Target**: Production-ready observability + Docker deployment  
**Estimated Duration**: 2-3 hours  
**Stack**: Node.js + Pino logging + Prometheus metrics + Docker  
**Status**: Building on Phases 1-3 complete foundation

---

## MISSION BRIEFING

You are building the **final layer** that makes the backend production-ready: structured logging, error monitoring, metrics collection, and Docker deployment. This is Part 4 of 4:

```
Phase 1: Domain Modeling & Data Persistence    ✅ COMPLETE
         (Database, Types, Repositories)

Phase 2: API Contracts & Service Layer         ✅ COMPLETE
         (REST endpoints, Business Logic, Validation)

Phase 3: Authentication & Real-Time            ✅ COMPLETE
         (JWT, RBAC, WebSocket, Sessions)

Phase 4: Deployment & Operations               ← YOU ARE HERE
         (Logging, Metrics, Docker, CI/CD)
```

**Success Criteria**:
- ✅ Structured JSON logging (Pino) on all requests/events
- ✅ Centralized error handling with context preservation
- ✅ Prometheus metrics collection (requests, latency, errors)
- ✅ Health checks (liveness + readiness)
- ✅ Docker containerization with proper configuration
- ✅ Environment-based configuration (dev, staging, prod)
- ✅ Graceful shutdown handling
- ✅ Database connection pooling
- ✅ Request correlation IDs for tracing
- ✅ Zero downtime deployment support

---

## PART 4: BREAKDOWN

### Section 4.1: Structured Logging with Pino

**Objective**: JSON logging that's machine-parseable and searchable

**Files to Create**:

```
src/utils/
├── logger.ts                    ← Pino configuration (updated)
└── request-logger.ts           ← Request/response logging middleware

src/middleware/
├── correlation-id.middleware.ts ← Add trace IDs to requests
└── timing.middleware.ts         ← Measure request duration
```

**Code Example: `src/utils/logger.ts`** (Updated from Phase 1)

```typescript
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Create Pino logger with proper configuration
 */
function createLogger() {
  if (isProduction) {
    // Production: JSON logs for centralized logging (ELK, Datadog, etc.)
    return pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      transport: {
        target: 'pino/file',
        options: {
          destination: '/var/log/app/app.log',
          mkdir: true,
        },
      },
    });
  } else {
    // Development: Pretty-printed logs for readability
    return pino({
      level: process.env.LOG_LEVEL || 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    });
  }
}

export const logger = createLogger();

/**
 * Extend with child loggers for context
 */
export function createChildLogger(context: {
  userId?: string;
  requestId?: string;
  module?: string;
}) {
  return logger.child(context);
}

/**
 * Log levels:
 * trace   - Detailed debugging
 * debug   - Development information
 * info    - Important events (logins, approvals)
 * warn    - Warning conditions (retry, fallback)
 * error   - Error conditions (failure, exception)
 * fatal   - System is unusable (crash, abort)
 */
```

**Code Example: `src/middleware/correlation-id.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add correlation ID to request for distributed tracing
 * Every log entry includes this ID for request tracking
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use header if provided, or generate new ID
  const correlationId =
    (req.headers['x-correlation-id'] as string) || uuidv4();

  // Attach to request
  (req as any).correlationId = correlationId;

  // Add to response header
  res.setHeader('x-correlation-id', correlationId);

  next();
}

/**
 * Add request logger to all requests
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const correlationId = (req as any).correlationId;
  const userId = (req as any).user?.id;

  // Log request start
  logger.info(
    {
      correlationId,
      userId,
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.get('user-agent'),
    },
    'Request started'
  );

  // Capture response
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log level based on status
    const logLevel =
      statusCode >= 500 ? 'error' :
      statusCode >= 400 ? 'warn' :
      'info';

    logger[logLevel](
      {
        correlationId,
        userId,
        method: req.method,
        path: req.path,
        status: statusCode,
        duration,
        contentLength: res.get('content-length'),
      },
      'Request completed'
    );

    return originalEnd.apply(res, args);
  };

  next();
}
```

**Code Example: `src/middleware/timing.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Track operation timing for performance monitoring
 */
export function timingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationMs = durationNs / 1_000_000;

    // Log slow requests (>1 second)
    if (durationMs > 1000) {
      logger.warn(
        {
          path: req.path,
          method: req.method,
          duration: Math.round(durationMs),
        },
        'Slow request detected'
      );
    }
  });

  next();
}
```

**Requirements**:

1. ✅ JSON logging in production
2. ✅ Pretty-printed logs in development
3. ✅ Correlation IDs on all requests
4. ✅ Request/response logging
5. ✅ Duration tracking
6. ✅ Slow request detection (>1s)
7. ✅ Proper log levels (trace, debug, info, warn, error, fatal)
8. ✅ Contextual information (userId, path, status, duration)
9. ✅ No secrets in logs (sanitize passwords, tokens)
10. ✅ Centralized logger singleton

---

### Section 4.2: Error Monitoring & Tracking

**Objective**: Capture all errors with context for debugging

**Files to Create**:

```
src/middleware/
└── error-handler.middleware.ts  ← Global error handler (updated from Phase 2)

src/services/
└── error-tracker.service.ts     ← Error aggregation & reporting
```

**Code Example: `src/middleware/error-handler.middleware.ts`** (Updated)

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '@/utils/errors';

/**
 * Global error handler - catches all errors
 * MUST be last middleware
 */
export function errorHandlerMiddleware(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = (req as any).correlationId;
  const userId = (req as any).user?.id;

  // Map error to response
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = null;

  if (error instanceof ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof AuthError) {
    statusCode = 401;
    code = 'AUTH_ERROR';
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    code = 'CONFLICT';
    message = error.message;
  } else if (error instanceof InternalServerError) {
    statusCode = 500;
    code = 'INTERNAL_SERVER_ERROR';
    message = error.message;
  }

  // Log error with full context
  logger.error(
    {
      correlationId,
      userId,
      statusCode,
      code,
      errorMessage: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      query: req.query,
      body: sanitizeBody(req.body),
    },
    'Request error'
  );

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      traceId: correlationId,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Sanitize request body (remove sensitive fields)
 */
function sanitizeBody(body: any): any {
  if (!body) return null;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Wrap async handlers to catch errors
 * Usage: router.get('/', asyncHandler(handler))
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
```

**Code Example: `src/services/error-tracker.service.ts`**

```typescript
import { logger } from '@/utils/logger';

/**
 * Error tracking and aggregation
 * Can be extended to send errors to external service (Sentry, Rollbar, etc.)
 */
export class ErrorTrackerService {
  /**
   * Track error with context
   */
  static trackError(error: Error, context: {
    userId?: string;
    requestId?: string;
    action?: string;
    metadata?: any;
  }): void {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    };

    // Log error
    logger.error(errorData, 'Error tracked');

    // TODO: Send to external error tracking service
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { contexts: context });
    // }
  }

  /**
   * Track warning condition
   */
  static trackWarning(message: string, context?: any): void {
    logger.warn(
      { context, timestamp: new Date().toISOString() },
      message
    );
  }

  /**
   * Get error statistics (in-memory for now)
   */
  static getErrorStats(): {
    totalErrors: number;
    recentErrors: any[];
  } {
    // TODO: Implement error statistics
    // Could fetch from database or external service
    return {
      totalErrors: 0,
      recentErrors: [],
    };
  }
}

export const errorTrackerService = new ErrorTrackerService();
```

**Requirements**:

1. ✅ Catch all errors globally
2. ✅ Log errors with full context
3. ✅ Map error types to HTTP status codes
4. ✅ Sanitize logs (no passwords, tokens)
5. ✅ Include correlation ID in error response
6. ✅ Proper error envelope format
7. ✅ Async error handling (asyncHandler wrapper)
8. ✅ Error aggregation service
9. ✅ Ready for external error tracking (Sentry, Rollbar)
10. ✅ Stack trace preservation

---

### Section 4.3: Metrics Collection

**Objective**: Prometheus-compatible metrics for monitoring

**Files to Create**:

```
src/middleware/
└── metrics.middleware.ts        ← Metrics collection

src/services/
└── metrics.service.ts           ← Prometheus metrics
```

**Code Example: `src/services/metrics.service.ts`**

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

/**
 * Prometheus metrics for monitoring
 */
export class MetricsService {
  // Request metrics
  static requestTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status'],
  });

  static requestDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
  });

  // Error metrics
  static errorTotal = new Counter({
    name: 'errors_total',
    help: 'Total errors',
    labelNames: ['code', 'path'],
  });

  // Database metrics
  static databaseQueryDuration = new Histogram({
    name: 'database_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  });

  static databaseConnectionPoolSize = new Gauge({
    name: 'database_connection_pool_size',
    help: 'Database connection pool size',
  });

  // Cache metrics
  static cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total cache hits',
    labelNames: ['cache_name'],
  });

  static cacheMisses = new Counter({
    name: 'cache_misses_total',
    help: 'Total cache misses',
    labelNames: ['cache_name'],
  });

  /**
   * Record request metric
   */
  static recordRequest(
    method: string,
    path: string,
    status: number,
    duration: number
  ): void {
    this.requestTotal.labels(method, path, String(status)).inc();
    this.requestDuration.labels(method, path, String(status)).observe(duration);
  }

  /**
   * Record error metric
   */
  static recordError(code: string, path: string): void {
    this.errorTotal.labels(code, path).inc();
  }

  /**
   * Record database query
   */
  static recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number
  ): void {
    this.databaseQueryDuration
      .labels(operation, table)
      .observe(duration);
  }

  /**
   * Record cache hit
   */
  static recordCacheHit(cacheName: string): void {
    this.cacheHits.labels(cacheName).inc();
  }

  /**
   * Record cache miss
   */
  static recordCacheMiss(cacheName: string): void {
    this.cacheMisses.labels(cacheName).inc();
  }
}
```

**Code Example: `src/middleware/metrics.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '@/services/metrics.service';
import { register } from 'prom-client';

/**
 * Collect metrics on all requests
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    MetricsService.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      durationMs
    );

    if (res.statusCode >= 400) {
      MetricsService.recordError(
        `${res.statusCode}`,
        req.path
      );
    }
  });

  next();
}

/**
 * Metrics endpoint - Prometheus scraping
 * GET /metrics returns Prometheus-format metrics
 */
export async function metricsEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
}
```

**Requirements**:

1. ✅ Prometheus-compatible metrics
2. ✅ Request metrics (count, duration)
3. ✅ Error metrics (by code, by path)
4. ✅ Database metrics (query duration, pool size)
5. ✅ Cache metrics (hits, misses)
6. ✅ Histogram buckets for latency distribution
7. ✅ /metrics endpoint for scraping
8. ✅ Ready for Prometheus integration
9. ✅ Ready for Grafana dashboards
10. ✅ Performance-optimized (minimal overhead)

---

### Section 4.4: Health Checks

**Objective**: Readiness and liveness probes for orchestration

**Files to Create**:

```
src/routes/
└── health.routes.ts            ← Health check endpoints
```

**Code Example: `src/routes/health.routes.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { logger } from '@/utils/logger';

export const healthRouter = Router();

/**
 * Liveness probe - is the app running?
 * GET /health/live
 * 
 * Used by: Kubernetes, Docker, load balancers
 * Response: 200 OK if process is alive
 */
healthRouter.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - can the app handle requests?
 * GET /health/ready
 * 
 * Used by: Kubernetes, load balancers
 * Checks: Database connection, external dependencies
 * Response: 200 OK if ready, 503 Service Unavailable if not
 */
healthRouter.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    logger.debug('Health check passed');
    
    res.status(200).json({
      status: 'ready',
      checks: {
        database: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    
    res.status(503).json({
      status: 'not_ready',
      checks: {
        database: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * Deep health check
 * GET /health/detailed
 * 
 * Returns comprehensive system status
 */
healthRouter.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = process.hrtime.bigint();
    
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check memory
    const memUsage = process.memoryUsage();
    
    // Check uptime
    const uptime = process.uptime();
    
    const endTime = process.hrtime.bigint();
    const queryDurationMs = Number(endTime - startTime) / 1_000_000;
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      checks: {
        database: {
          status: 'ok',
          queryDurationMs: Math.round(queryDurationMs),
        },
      },
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        externalMB: Math.round(memUsage.external / 1024 / 1024),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Detailed health check failed');
    
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default healthRouter;
```

**Requirements**:

1. ✅ Liveness probe (/health/live)
2. ✅ Readiness probe (/health/ready)
3. ✅ Database connectivity check
4. ✅ Proper HTTP status codes (200, 503)
5. ✅ JSON response format
6. ✅ Kubernetes-compatible probes
7. ✅ Detailed health endpoint (/health/detailed)
8. ✅ Memory usage reporting
9. ✅ Uptime tracking
10. ✅ Query duration measurement

---

### Section 4.5: Docker Containerization

**Objective**: Production-ready Docker image

**Files to Create**:

```
├── Dockerfile                   ← Multi-stage build
├── .dockerignore                ← Exclude unnecessary files
├── docker-compose.prod.yml      ← Production compose
└── kubernetes/
    ├── deployment.yaml          ← K8s deployment (optional)
    └── service.yaml             ← K8s service (optional)
```

**Code Example: `Dockerfile`**

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy package files
COPY --from=builder /build/package*.json ./

# Copy built code
COPY --from=builder /build/dist ./dist

# Create log directory
RUN mkdir -p /var/log/app && \
    chown -R node:node /var/log/app

# Use non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health/live', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/server.js"]
```

**Code Example: `.dockerignore`**

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
dist
.next
.DS_Store
coverage
.vscode
.idea
*.log
```

**Code Example: `docker-compose.prod.yml`**

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: driftsentry-api
    restart: unless-stopped
    
    environment:
      NODE_ENV: production
      LOG_LEVEL: info
      DATABASE_URL: postgresql://user:password@db:5432/driftsentry
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: https://app.driftsentry.com
    
    ports:
      - "3001:3001"
    
    depends_on:
      db:
        condition: service_healthy
    
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health/ready"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
    
    networks:
      - driftsentry
    
    volumes:
      - ./logs:/var/log/app

  db:
    image: postgres:15-alpine
    container_name: driftsentry-db
    restart: unless-stopped
    
    environment:
      POSTGRES_DB: driftsentry
      POSTGRES_USER: user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    
    ports:
      - "5432:5432"
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
    networks:
      - driftsentry

volumes:
  postgres_data:

networks:
  driftsentry:
    driver: bridge
```

**Code Example: `src/server.ts`** (Updated)

```typescript
import http from 'http';
import { createApp } from './app';
import { setupWebSocket, setIO } from '@/websocket/socket';
import { logger } from '@/utils/logger';
import { prisma } from '@/database/prisma';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    // Create Express app
    const app = createApp();
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Setup WebSocket
    const io = setupWebSocket(httpServer);
    setIO(io);
    
    // Start listening
    const server = httpServer.listen(PORT, HOST, () => {
      logger.info(
        { port: PORT, host: HOST, env: process.env.NODE_ENV },
        '🚀 Server started'
      );
      logger.info('📡 WebSocket ready');
      logger.info('✅ Health check: /health/live, /health/ready');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => shutdown(server, 'SIGTERM'));
    process.on('SIGINT', () => shutdown(server, 'SIGINT'));
    
  } catch (error) {
    logger.error({ error }, '❌ Server startup failed');
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(server: http.Server, signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down gracefully');
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connections
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting database');
    }
    
    logger.info('Shutdown complete');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30_000);
}

// Start server
startServer();
```

**Requirements**:

1. ✅ Multi-stage Docker build (smaller image)
2. ✅ Non-root user (security)
3. ✅ Health check in Dockerfile
4. ✅ Proper signal handling (dumb-init)
5. ✅ Log directory creation
6. ✅ .dockerignore for clean builds
7. ✅ Production docker-compose with PostgreSQL
8. ✅ Environment-based configuration
9. ✅ Health check services
10. ✅ Graceful shutdown handling

---

### Section 4.6: Environment Configuration

**Objective**: Safe configuration management

**Files to Create**:

```
src/config/
├── config.ts                    ← Configuration loader
└── validators.ts                ← Config validation

├── .env.example                 ← Template
├── .env.production              ← Prod secrets (git-ignored)
└── .env.staging                 ← Staging secrets (git-ignored)
```

**Code Example: `src/config/config.ts`**

```typescript
import { logger } from '@/utils/logger';

/**
 * Load and validate configuration
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: (process.env.NODE_ENV || 'development') as
    | 'development'
    | 'staging'
    | 'production',
  
  // Database
  databaseUrl: process.env.DATABASE_URL ||
    'postgresql://localhost:5432/driftsentry',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Monitoring
  enableMetrics: process.env.ENABLE_METRICS !== 'false',
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  
  // Feature flags
  enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false',
  
  // Timeouts
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  gracefulShutdownTimeout: parseInt(
    process.env.GRACEFUL_SHUTDOWN_TIMEOUT || '30000',
    10
  ),
} as const;

/**
 * Validate critical config at startup
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is required');
  }

  if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-secret-change-in-prod') {
    errors.push('JWT_SECRET must be changed in production');
  }

  if (!config.corsOrigin) {
    errors.push('CORS_ORIGIN is required');
  }

  if (errors.length > 0) {
    logger.error({ errors }, 'Configuration validation failed');
    process.exit(1);
  }

  logger.info({ env: config.nodeEnv }, 'Configuration validated');
}
```

**Code Example: `.env.example`**

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/driftsentry

# Security
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=15m

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# WebSocket
ENABLE_WEBSOCKET=true

# Timeouts
REQUEST_TIMEOUT=30000
GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

**Requirements**:

1. ✅ Environment-based configuration
2. ✅ Default values for all settings
3. ✅ Validation at startup
4. ✅ Secrets never in code
5. ✅ .env.example as template
6. ✅ Type-safe config object
7. ✅ Development/staging/production modes
8. ✅ Error on missing critical config
9. ✅ Log configuration at startup
10. ✅ Security best practices

---

## DELIVERABLES CHECKLIST

**By the end of Phase 4, deliver**:

- [ ] Logger configuration with Pino (`src/utils/logger.ts`)
- [ ] Request/response logging middleware (`src/middleware/request-logger.ts`)
- [ ] Correlation ID middleware (`src/middleware/correlation-id.middleware.ts`)
- [ ] Error handler with context (`src/middleware/error-handler.middleware.ts`)
- [ ] Error tracker service (`src/services/error-tracker.service.ts`)
- [ ] Metrics service with Prometheus (`src/services/metrics.service.ts`)
- [ ] Metrics middleware (`src/middleware/metrics.middleware.ts`)
- [ ] Health check routes (`src/routes/health.routes.ts`)
- [ ] Docker multi-stage build (`Dockerfile`)
- [ ] Docker ignore file (`.dockerignore`)
- [ ] Production docker-compose (`docker-compose.prod.yml`)
- [ ] Configuration loader (`src/config/config.ts`)
- [ ] Configuration validation (`src/config/validators.ts`)
- [ ] Updated server startup (`src/server.ts`)
- [ ] Environment template (`.env.example`)
- [ ] Graceful shutdown handling
- [ ] Zero TypeScript errors

---

## PHASE 4: VIBE-CODING VERIFICATION CHECKLIST

### ✅ Logging Standards (Critical)

```typescript
// ✅ CORRECT - JSON structured logging
logger.info(
  {
    userId: user.id,
    action: 'drift_approved',
    driftId: drift.id,
    duration: 150,
    timestamp: new Date().toISOString(),
  },
  'Drift approved successfully'
);

// ❌ WRONG - Unstructured string logs
logger.info('User ' + userId + ' approved drift');

// ✅ CORRECT - Error with context
logger.error(
  {
    error: error.message,
    stack: error.stack,
    userId: user.id,
    action: 'drift_approval',
  },
  'Failed to approve drift'
);

// ✅ CORRECT - Never log secrets
logger.info('User login', { userId: user.id, email: user.email });
// NOT: password, token, apiKey

// ❌ WRONG - Logging sensitive data
logger.info('Login', { password: input.password });
```

### ✅ Error Handling (Critical)

```typescript
// ✅ CORRECT - Comprehensive error handling
try {
  await driftService.approve(id, input, userId);
  res.status(200).json({ success: true, data: result });
} catch (error) {
  // Error handler middleware catches
  next(error);
}

// ✅ CORRECT - Proper HTTP status codes
if (!drift) {
  throw new NotFoundError(`Drift ${id} not found`);  // 404
}
if (user.role !== 'admin') {
  throw new ForbiddenError('Not authorized');  // 403
}

// ❌ WRONG - Generic errors
throw new Error('Something went wrong');

// ❌ WRONG - No error handling
const drift = await driftRepository.getById(id);
return drift;  // Could be null!
```

### ✅ Metrics Recording (Critical)

```typescript
// ✅ CORRECT - Record all significant operations
MetricsService.recordRequest(method, path, status, duration);
MetricsService.recordDatabaseQuery('SELECT', 'drifts', queryTime);
MetricsService.recordError(code, path);

// ❌ WRONG - Selective metrics
// Only recording some requests leads to incomplete data

// ✅ CORRECT - Proper histogram usage
requestDuration.observe(duration);  // Not just tracking success
errorRate.inc();  // All errors counted
```

### ✅ Configuration (Critical)

```typescript
// ✅ CORRECT - All config from environment
const port = parseInt(process.env.PORT || '3001', 10);
const secret = process.env.JWT_SECRET;  // Required in production

if (!secret) {
  throw new Error('JWT_SECRET is required');
}

// ❌ WRONG - Secrets hardcoded
const secret = 'dev-secret-hardcoded';

// ❌ WRONG - Config in code
const port = 3001;  // Not configurable
```

### ✅ Health Checks (Critical)

```typescript
// ✅ CORRECT - Comprehensive readiness check
router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;  // Check DB
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

// ❌ WRONG - No dependency checks
router.get('/health', (req, res) => {
  res.status(200).json({ ok: true });  // Doesn't verify DB
});
```

---

## POST-IMPLEMENTATION VERIFICATION

### Step 1: Build & Startup

```bash
npm run type-check   # 0 errors required
npm run build        # Must succeed
npm run dev          # Server starts

# Expected:
# 🚀 Server started on port 3001
# 📡 WebSocket ready
# ✅ Health check: /health/live, /health/ready
```

### Step 2: Health Checks

```bash
# Liveness
curl http://localhost:3001/health/live
# Response: 200 with { status: 'alive' }

# Readiness
curl http://localhost:3001/health/ready
# Response: 200 with { status: 'ready' }

# Detailed
curl http://localhost:3001/health/detailed
# Response: 200 with memory, uptime, checks
```

### Step 3: Metrics Endpoint

```bash
# Get Prometheus metrics
curl http://localhost:3001/metrics

# Should return Prometheus format:
# http_requests_total{method="GET",path="/drifts",status="200"} 5
# http_request_duration_ms_bucket{...} 1
```

### Step 4: Logging Verification

```bash
# Make requests and check logs
curl http://localhost:3001/api/v1/drifts

# Check logs contain:
# ✅ Correlation ID on all logs
# ✅ Request method, path, status, duration
# ✅ Structured JSON format
# ✅ No passwords, tokens, secrets
```

### Step 5: Error Handling

```bash
# Test invalid request
curl -X POST http://localhost:3001/api/v1/drifts/invalid/approve \
  -H "Authorization: Bearer invalid-token" \
  -d '{}'

# Check logs for:
# ✅ Error code (AUTH_ERROR)
# ✅ Correlation ID
# ✅ Path, method, status
# ✅ No sensitive data
```

### Step 6: Docker Build

```bash
# Build image
docker build -t driftsentry:latest .

# Expected:
# Successfully built driftsentry:latest
# Image size < 500MB

# Run container
docker run --rm \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -p 3001:3001 \
  driftsentry:latest

# Should start without errors
```

### Step 7: Docker Compose

```bash
# Production startup
docker-compose -f docker-compose.prod.yml up

# Expected:
# ✅ App service starts
# ✅ Database service starts
# ✅ Health checks pass
# ✅ No errors in logs
```

---

## PHASE 4: SUCCESS SIGNALS

You'll know Phase 4 is complete when:

1. ✅ `npm run type-check` → 0 errors
2. ✅ `npm run build` → succeeds
3. ✅ `npm run dev` → starts cleanly
4. ✅ `/health/live` → 200 OK
5. ✅ `/health/ready` → 200 OK (DB connected)
6. ✅ `/metrics` → Prometheus format
7. ✅ Logs are JSON structured
8. ✅ Correlation IDs on all logs
9. ✅ No secrets in logs
10. ✅ Docker image builds (<500MB)
11. ✅ Docker container starts
12. ✅ Error metrics recorded
13. ✅ Request metrics recorded
14. ✅ Graceful shutdown works
15. ✅ Configuration validates at startup

---

**Phase 4 Complete! Production-ready backend.** 🚀
