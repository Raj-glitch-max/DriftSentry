# 🚀 BACKEND PHASE 2: API CONTRACTS & SERVICE LAYER
## Implementation Prompt for Antigravity
**Target**: Production-ready REST API with business logic  
**Estimated Duration**: 3-4 hours  
**Stack**: Express.js + TypeScript + Prisma (from Phase 1)  
**Status**: Building on solid Phase 1 foundation

---

## MISSION BRIEFING

You are building the **API layer** that connects the frontend to the database. This is Part 2 of 4:

```
Phase 1: Domain Modeling & Data Persistence    ✅ COMPLETE
         (Database, Types, Repositories)

Phase 2: API Contracts & Service Layer        ← YOU ARE HERE
         (REST endpoints, Business Logic, Validation)

Phase 3: Authentication & Real-Time            Coming next
         (JWT, RBAC, WebSocket)

Phase 4: Deployment & Operations               Final phase
         (Logging, Monitoring, Docker)
```

**Success Criteria**:
- ✅ All REST endpoints implemented (9 total)
- ✅ Input validation with Zod schemas
- ✅ Service layer with business logic
- ✅ Error handling middleware
- ✅ Response envelopes (success/error)
- ✅ Logging on every endpoint
- ✅ Zero TypeScript errors
- ✅ All tests pass
- ✅ Frontend can wire to real API

---

## PART 2: BREAKDOWN

### Section 2.1: Express Setup & Configuration

**Objective**: Production-ready Express server with middleware stack

**Files to Create**:

```
src/
├── app.ts                          ← Express app factory
├── server.ts                        ← Server startup
├── config/
│   ├── env.ts                      ← Environment variables
│   └── constants.ts                ← API constants
├── middleware/
│   ├── error.middleware.ts         ← Global error handler
│   ├── logging.middleware.ts       ← Request/response logging
│   ├── validation.middleware.ts    ← Input validation wrapper
│   └── index.ts                    ← Export all
└── routes/
    ├── drift.routes.ts             ← Drift endpoints
    ├── alert.routes.ts             ← Alert endpoints
    ├── metrics.routes.ts           ← Metrics endpoints
    └── index.ts                    ← Mount all routes
```

**Code Example: `src/app.ts`**

```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from '@/utils/logger';
import { errorMiddleware } from '@/middleware/error.middleware';
import { loggingMiddleware } from '@/middleware/logging.middleware';
import { apiRoutes } from '@/routes';

/**
 * Create Express application
 * Configured with security, logging, and error handling middleware
 */
export function createApp(): Express {
  const app = express();
  
  // ======== SECURITY ========
  app.use(helmet());  // Security headers
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  
  // ======== PARSING ========
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  // ======== LOGGING ========
  app.use(loggingMiddleware);
  
  // ======== HEALTH CHECKS ========
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });
  
  app.get('/health/ready', async (req: Request, res: Response) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'not-ready',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  // ======== API ROUTES ========
  app.use('/api/v1', apiRoutes);
  
  // ======== 404 HANDLER ========
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
      },
    });
  });
  
  // ======== ERROR HANDLER (MUST BE LAST) ========
  app.use(errorMiddleware);
  
  return app;
}

/**
 * Start server
 */
export async function startServer(port: number = 3001): Promise<void> {
  const app = createApp();
  
  try {
    app.listen(port, () => {
      logger.info(`🚀 Server started on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}
```

**Requirements**:

1. ✅ `helmet()` for security headers
2. ✅ `cors` with configurable origin
3. ✅ JSON/URL parsing with size limits
4. ✅ Health check endpoints (`/health`, `/health/ready`)
5. ✅ Request logging on every call
6. ✅ 404 handler for missing routes
7. ✅ Global error handler (catches all exceptions)
8. ✅ Environment-based configuration
9. ✅ Graceful startup/shutdown
10. ✅ All middleware documented with JSDoc

---

### Section 2.2: Input Validation with Zod

**Objective**: Type-safe request validation that matches frontend expectations

**Files to Create**:

```
src/schemas/
├── drift.schema.ts         ← Drift request schemas
├── alert.schema.ts         ← Alert request schemas
├── common.schema.ts        ← Shared schemas (pagination, etc)
└── index.ts               ← Export all
```

**Code Example: `src/schemas/drift.schema.ts`**

```typescript
import { z } from 'zod';

/**
 * List drifts query parameters
 */
export const listDriftsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  severity: z.enum(['critical', 'warning', 'info', 'all']).default('all'),
  status: z.enum(['detected', 'triaged', 'approved', 'rejected', 'resolved', 'all']).default('all'),
  sortBy: z.enum(['created_at', 'detected_at', 'cost_impact_monthly', 'severity']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type ListDriftsQuery = z.infer<typeof listDriftsSchema>;

/**
 * Create drift request body
 * Used internally only (not by frontend)
 */
export const createDriftSchema = z.object({
  resourceId: z.string()
    .min(1, 'Resource ID required')
    .max(255, 'Resource ID too long'),
  
  resourceType: z.enum(['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP']),
  
  region: z.string()
    .regex(/^[a-z]{2}-[a-z]+-\d+$/, 'Invalid AWS region'),
  
  expectedState: z.record(z.unknown())
    .refine((val) => Object.keys(val).length > 0, 'Expected state cannot be empty'),
  
  actualState: z.record(z.unknown()),
  
  severity: z.enum(['critical', 'warning', 'info']),
  
  costImpactMonthly: z.number()
    .nonnegative('Cost cannot be negative')
    .max(999999, 'Cost too high'),
  
  detectedBy: z.enum(['scheduler', 'manual', 'api']),
});

export type CreateDriftInput = z.infer<typeof createDriftSchema>;

/**
 * Approve drift request body
 */
export const approveDriftSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason too long'),
});

export type ApproveDriftInput = z.infer<typeof approveDriftSchema>;

/**
 * Reject drift request body
 */
export const rejectDriftSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason too long'),
});

export type RejectDriftInput = z.infer<typeof rejectDriftSchema>;

/**
 * Validate and parse request data
 * Throws ValidationError with details if invalid
 */
export function validateRequest<T>(
  schema: z.ZodSchema,
  data: unknown
): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request', {
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    throw error;
  }
}
```

**Requirements**:

1. ✅ One schema per request type
2. ✅ Clear error messages (min length, format, etc)
3. ✅ Discriminated unions for enum fields
4. ✅ Type exports for TypeScript support
5. ✅ Coerce numbers from query strings
6. ✅ Default values where sensible
7. ✅ Refinements for complex validation
8. ✅ Error handler wraps validation errors
9. ✅ No raw Zod in routes (use validateRequest)
10. ✅ All schemas exported from `src/schemas/index.ts`

---

### Section 2.3: Service Layer (Business Logic)

**Objective**: Isolate business logic from HTTP layer

**Files to Create**:

```
src/services/
├── drift.service.ts        ← Drift business logic
├── alert.service.ts        ← Alert business logic
├── metrics.service.ts      ← Dashboard metrics
├── audit.service.ts        ← Audit trail logging
└── index.ts               ← Export all
```

**Code Example: `src/services/drift.service.ts`**

```typescript
import { logger } from '@/utils/logger';
import { driftRepository } from '@/repositories/drift.repository';
import { auditService } from './audit.service';
import { alertService } from './alert.service';
import type { Drift, CreateDriftInput, ApproveDriftInput } from '@/types/domain';
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  DatabaseError,
} from '@/utils/errors';

/**
 * DriftService
 * Core business logic for drift management
 * 
 * Responsibilities:
 * - Validate business rules (not just schema)
 * - Coordinate multiple repositories
 * - Emit events and side effects (audits, alerts)
 * - Never expose raw database models
 * - Handle all errors gracefully
 */
export class DriftService {
  /**
   * Create new drift detection
   * 
   * @throws ValidationError if invalid input
   * @throws ConflictError if duplicate recent drift exists
   * @throws DatabaseError if database fails
   */
  async createDrift(
    input: CreateDriftInput,
    userId?: string
  ): Promise<Drift> {
    const startTime = Date.now();
    
    try {
      // 1. Validate business rules
      this.validateDriftInput(input);
      
      // 2. Check for duplicate recent drifts
      const existing = await driftRepository.findRecentDuplicate(
        input.resourceId,
        input.resourceType,
        { minutes: 60 }
      );
      
      if (existing) {
        logger.warn('Duplicate drift detected', {
          existingId: existing.id,
          resourceId: input.resourceId,
        });
        throw new ConflictError(
          'Similar drift detected recently. Check existing drift before creating new one.'
        );
      }
      
      // 3. Create drift in database
      const drift = await driftRepository.create(input);
      
      // 4. Create audit log
      await auditService.log({
        action: 'drift_created',
        driftId: drift.id,
        actorId: userId,
        newValue: drift,
        details: {
          resourceId: input.resourceId,
          severity: input.severity,
        },
      });
      
      // 5. Create alert if critical
      if (input.severity === 'critical') {
        await alertService.createAlert({
          driftId: drift.id,
          type: 'drift_detected',
          severity: 'critical',
          title: `🚨 CRITICAL: ${input.resourceId} drift detected`,
          message: `Critical infrastructure drift in ${input.resourceType} at ${input.region}. Cost impact: $${input.costImpactMonthly}/month`,
        });
      }
      
      logger.info('Drift created successfully', {
        driftId: drift.id,
        severity: input.severity,
        duration: Date.now() - startTime,
      });
      
      return drift;
    } catch (error) {
      logger.error('Failed to create drift', {
        error: error instanceof Error ? error.message : String(error),
        input: {
          resourceId: input.resourceId,
          resourceType: input.resourceType,
        },
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  /**
   * Get drift by ID with related data
   * 
   * @throws NotFoundError if drift doesn't exist
   */
  async getDrift(driftId: string): Promise<Drift & {
    alertCount: number;
    canApprove: boolean;
    canReject: boolean;
  }> {
    try {
      const drift = await driftRepository.getById(driftId);
      
      if (!drift) {
        throw new NotFoundError(`Drift ${driftId} not found`);
      }
      
      // Get related data
      const alertCount = await alertService.countByDrift(driftId);
      
      // Determine what actions are allowed
      const canApprove = ['detected', 'triaged'].includes(drift.status);
      const canReject = ['detected', 'triaged'].includes(drift.status);
      
      logger.debug('Drift retrieved', { driftId });
      
      return {
        ...drift,
        alertCount,
        canApprove,
        canReject,
      };
    } catch (error) {
      logger.error('Failed to get drift', { driftId, error });
      throw error;
    }
  }
  
  /**
   * List drifts with filtering and pagination
   */
  async listDrifts(filters: {
    page: number;
    limit: number;
    severity?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{
    items: Drift[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    const startTime = Date.now();
    
    try {
      // Validate pagination
      if (filters.page < 1 || filters.limit < 1 || filters.limit > 100) {
        throw new ValidationError('Invalid pagination parameters');
      }
      
      // Query database
      const result = await driftRepository.list({
        page: filters.page,
        limit: filters.limit,
        severity: filters.severity && filters.severity !== 'all' ? filters.severity : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        sortBy: filters.sortBy as any,
        sortOrder: filters.sortOrder as 'asc' | 'desc',
      });
      
      logger.debug('Drifts listed', {
        count: result.items.length,
        total: result.total,
        page: filters.page,
        duration: Date.now() - startTime,
      });
      
      return {
        items: result.items,
        total: result.total,
        page: filters.page,
        pageSize: filters.limit,
        totalPages: Math.ceil(result.total / filters.limit),
        hasMore: filters.page * filters.limit < result.total,
      };
    } catch (error) {
      logger.error('Failed to list drifts', {
        error: error instanceof Error ? error.message : String(error),
        filters,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  /**
   * Approve drift remediation
   * 
   * @throws NotFoundError if drift doesn't exist
   * @throws ConflictError if drift can't be approved in current status
   */
  async approveDrift(
    driftId: string,
    input: ApproveDriftInput,
    userId: string
  ): Promise<Drift> {
    const startTime = Date.now();
    
    try {
      // 1. Fetch drift
      const drift = await driftRepository.getById(driftId);
      
      if (!drift) {
        throw new NotFoundError(`Drift ${driftId} not found`);
      }
      
      // 2. Validate state transition
      if (!['detected', 'triaged'].includes(drift.status)) {
        throw new ConflictError(
          `Cannot approve drift in '${drift.status}' status. Only 'detected' or 'triaged' drifts can be approved.`
        );
      }
      
      // 3. Update drift status
      const updated = await driftRepository.updateStatus(driftId, 'approved', {
        approvedAt: new Date(),
        approvedBy: userId,
        approvalReason: input.reason,
      });
      
      // 4. Create audit log
      await auditService.log({
        action: 'drift_approved',
        driftId,
        actorId: userId,
        oldValue: drift,
        newValue: updated,
        details: { reason: input.reason },
      });
      
      // 5. Clear related alerts
      await alertService.markAlertsByDriftAsResolved(driftId);
      
      logger.info('Drift approved', {
        driftId,
        approvedBy: userId,
        reason: input.reason.substring(0, 50),
        duration: Date.now() - startTime,
      });
      
      return updated;
    } catch (error) {
      logger.error('Failed to approve drift', {
        driftId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  /**
   * Reject drift remediation
   */
  async rejectDrift(
    driftId: string,
    reason: string,
    userId: string
  ): Promise<Drift> {
    const startTime = Date.now();
    
    try {
      const drift = await driftRepository.getById(driftId);
      
      if (!drift) {
        throw new NotFoundError(`Drift ${driftId} not found`);
      }
      
      if (!['detected', 'triaged'].includes(drift.status)) {
        throw new ConflictError(
          `Cannot reject drift in '${drift.status}' status.`
        );
      }
      
      const updated = await driftRepository.updateStatus(driftId, 'rejected', {
        rejectedAt: new Date(),
        rejectedBy: userId,
        rejectionReason: reason,
      });
      
      await auditService.log({
        action: 'drift_rejected',
        driftId,
        actorId: userId,
        oldValue: drift,
        newValue: updated,
        details: { reason },
      });
      
      logger.info('Drift rejected', { driftId, duration: Date.now() - startTime });
      
      return updated;
    } catch (error) {
      logger.error('Failed to reject drift', { driftId, error });
      throw error;
    }
  }
  
  // ========= PRIVATE METHODS =========
  
  private validateDriftInput(input: CreateDriftInput): void {
    // Business rule validation (beyond schema)
    const expectedStr = JSON.stringify(input.expectedState);
    const actualStr = JSON.stringify(input.actualState);
    
    if (expectedStr === actualStr) {
      throw new ValidationError(
        'No difference between expected and actual state. This is not a drift.'
      );
    }
    
    if (input.costImpactMonthly < 0) {
      throw new ValidationError('Cost impact cannot be negative');
    }
    
    // Validate resource type
    const validTypes = ['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP'];
    if (!validTypes.includes(input.resourceType)) {
      throw new ValidationError(
        `Unsupported resource type: ${input.resourceType}. Allowed: ${validTypes.join(', ')}`
      );
    }
  }
}

// Export singleton
export const driftService = new DriftService();
```

**Requirements**:

1. ✅ One service per domain entity
2. ✅ Services orchestrate repositories + other services
3. ✅ Services handle business logic (not just CRUD)
4. ✅ All methods have JSDoc with @throws
5. ✅ All errors caught and logged with context
6. ✅ Side effects (audits, alerts) within transaction
7. ✅ Logging at key decision points
8. ✅ Return types match domain types
9. ✅ Never expose Prisma models
10. ✅ Exported as singleton from `src/services/index.ts`

---

### Section 2.4: REST Endpoints (Routes)

**Objective**: 9 endpoints connecting Express → Services → Database

**Files to Create**:

```
src/routes/
├── drift.routes.ts         ← All drift endpoints
├── alert.routes.ts         ← All alert endpoints
├── metrics.routes.ts       ← All metrics endpoints
└── index.ts               ← Mount all routes
```

**Code Example: `src/routes/drift.routes.ts`**

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { driftService } from '@/services/drift.service';
import { listDriftsSchema, approveDriftSchema, rejectDriftSchema, validateRequest } from '@/schemas';
import { ApplicationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Drift Routes
 * All endpoints for managing drifts
 */
export const driftRouter = Router();

/**
 * GET /api/v1/drifts
 * List all drifts with filtering and pagination
 * 
 * Query Parameters:
 * - page: number (default 1)
 * - limit: number (default 20, max 100)
 * - severity: critical|warning|info|all (default all)
 * - status: detected|triaged|approved|rejected|resolved|all (default all)
 * - sortBy: created_at|detected_at|cost_impact_monthly|severity (default created_at)
 * - sortOrder: asc|desc (default desc)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     items: Drift[],
 *     pagination: { total, page, pageSize, totalPages, hasMore }
 *   }
 * }
 */
driftRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Validate query parameters
    const filters = validateRequest(
      listDriftsSchema,
      req.query
    );
    
    // Get drifts
    const result = await driftService.listDrifts(filters);
    
    logger.debug('GET /api/v1/drifts', {
      count: result.items.length,
      filters,
      duration: Date.now() - startTime,
    });
    
    res.status(200).json({
      success: true,
      data: {
        items: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/drifts/:id
 * Get single drift with related data
 * 
 * Path Parameters:
 * - id: UUID
 * 
 * Response:
 * {
 *   success: true,
 *   data: Drift & { alertCount, canApprove, canReject }
 * }
 */
driftRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const drift = await driftService.getDrift(id);
    
    res.status(200).json({
      success: true,
      data: drift,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/drifts/:id/approve
 * Approve drift remediation
 * 
 * Path Parameters:
 * - id: UUID
 * 
 * Request Body:
 * {
 *   reason: string (min 10 chars)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: Drift
 * }
 */
driftRouter.post('/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'system';  // From auth middleware (Phase 3)
    
    // Validate request body
    const input = validateRequest(approveDriftSchema, req.body);
    
    // Approve drift
    const drift = await driftService.approveDrift(id, input, userId);
    
    res.status(200).json({
      success: true,
      data: drift,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/drifts/:id/reject
 * Reject drift remediation
 * 
 * Path Parameters:
 * - id: UUID
 * 
 * Request Body:
 * {
 *   reason: string (min 10 chars)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: Drift
 * }
 */
driftRouter.post('/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'system';
    
    const input = validateRequest(rejectDriftSchema, req.body);
    
    const drift = await driftService.rejectDrift(id, input.reason, userId);
    
    res.status(200).json({
      success: true,
      data: drift,
    });
  } catch (error) {
    next(error);
  }
});

export default driftRouter;
```

**Code Example: `src/routes/index.ts`**

```typescript
import { Router } from 'express';
import { driftRouter } from './drift.routes';
import { alertRouter } from './alert.routes';
import { metricsRouter } from './metrics.routes';

/**
 * API Routes
 * Mount all resource routes under /api/v1
 */
export const apiRoutes = Router();

// Mount routers
apiRoutes.use('/drifts', driftRouter);
apiRoutes.use('/alerts', alertRouter);
apiRoutes.use('/metrics', metricsRouter);

export default apiRoutes;
```

**9 Total Endpoints to Implement**:

```typescript
// Drift endpoints (5)
GET    /api/v1/drifts                 ← List with pagination
GET    /api/v1/drifts/:id             ← Get single
POST   /api/v1/drifts/:id/approve     ← Approve
POST   /api/v1/drifts/:id/reject      ← Reject

// Alert endpoints (2)
GET    /api/v1/alerts                 ← List alerts
POST   /api/v1/alerts/:id/mark-read   ← Mark as read

// Metrics endpoints (2)
GET    /api/v1/metrics/summary        ← Dashboard summary
GET    /api/v1/metrics/cost-trend     ← Cost over time
```

**Requirements**:

1. ✅ Each endpoint has JSDoc comment
2. ✅ All query/body params validated
3. ✅ All errors caught and passed to error middleware
4. ✅ All success responses have `success: true`
5. ✅ All endpoints log request details
6. ✅ Proper HTTP status codes (200, 201, 400, 404, 409, 500)
7. ✅ Request timing measured and logged
8. ✅ Response envelope consistent across all endpoints
9. ✅ Never expose Prisma models directly
10. ✅ All routes mounted in `/src/routes/index.ts`

---

### Section 2.5: Error Handling Middleware

**Objective**: Catch all errors and return consistent error response

**File**: `src/middleware/error.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * Global error handling middleware
 * Must be registered LAST in middleware stack
 * 
 * Converts all errors to standard error response:
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: object,
 *     traceId: string,
 *     timestamp: string
 *   }
 * }
 */
export function errorMiddleware(
  error: Error | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate trace ID for debugging
  const traceId = req.headers['x-trace-id'] || `trace_${Date.now()}`;
  
  // Handle application errors (custom error classes)
  if (error instanceof ApplicationError) {
    const statusCode = error.statusCode || 500;
    
    logger.warn('Application error', {
      code: error.errorCode,
      message: error.message,
      statusCode,
      traceId,
      path: req.path,
      method: req.method,
    });
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: (error as any).details,
        traceId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  // Handle unexpected errors
  logger.error('Unexpected error', {
    message: error.message,
    stack: error.stack,
    traceId,
    path: req.path,
    method: req.method,
  });
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Our team has been notified.',
      traceId,
      timestamp: new Date().toISOString(),
    },
  });
}
```

**Requirements**:

1. ✅ Catches all synchronous and async errors
2. ✅ Generates trace IDs for debugging
3. ✅ Logs all errors with context
4. ✅ Returns consistent error envelope
5. ✅ Hides sensitive details from client
6. ✅ Never logs passwords/tokens
7. ✅ Includes statusCode from error
8. ✅ Must be registered LAST

---

## DELIVERABLES CHECKLIST

**By the end of Phase 2, deliver**:

- [ ] Express app factory (`src/app.ts`)
- [ ] Server startup file (`src/server.ts`)
- [ ] All validation schemas (`src/schemas/`)
- [ ] All services (`src/services/`)
- [ ] All route handlers (`src/routes/`)
- [ ] Error handling middleware
- [ ] Logging middleware
- [ ] 9 REST endpoints fully implemented
- [ ] All TypeScript types compile
- [ ] Zero console warnings
- [ ] `package.json` scripts added

---

## PHASE 2: VIBE-CODING VERIFICATION CHECKLIST

### ✅ Code Quality Gates

**1. TypeScript Verification**

```bash
# Must pass with 0 errors
npm run type-check

# Expected output:
# ✅ No errors found in your code
```

**2. Lint Check**

```bash
# Must pass with 0 errors
npm run lint

# Expected output:
# ✅ 0 warnings, 0 errors
```

**3. Build Verification**

```bash
# Must build successfully
npm run build

# Expected output:
# ✅ Successfully compiled X files to ./dist
```

### 🧪 Manual Testing Checklist

**Test each endpoint using curl or Postman**:

```bash
# 1. List drifts (pagination)
curl "http://localhost:3001/api/v1/drifts?page=1&limit=10"

# Expected: 200 with pagination data
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 5,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1,
      "hasMore": false
    }
  }
}

# 2. Get single drift
curl "http://localhost:3001/api/v1/drifts/{drift-id}"

# Expected: 200 with drift details

# 3. Test validation error
curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"reason": "short"}'

# Expected: 400 with validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {
      "errors": [
        {
          "field": "reason",
          "message": "Reason must be at least 10 characters"
        }
      ]
    }
  }
}

# 4. Test not found error
curl "http://localhost:3001/api/v1/drifts/invalid-id"

# Expected: 404 with error

# 5. Health check
curl "http://localhost:3001/health"

# Expected: 200 with { status: 'ok' }
```

### 📊 Performance Metrics

**Each endpoint must meet these performance targets**:

| Endpoint | Target | Metric |
|----------|--------|--------|
| GET /drifts | <200ms | List with pagination |
| GET /drifts/:id | <100ms | Single fetch |
| POST /approve | <300ms | State update + audit |
| POST /reject | <300ms | State update + audit |

**Measure with**:

```typescript
const startTime = Date.now();
// endpoint logic
const duration = Date.now() - startTime;
logger.info('Endpoint completed', { duration });
```

### 🔍 Database Query Verification

**All database queries must be indexed**:

```sql
-- Check if queries are using indexes
EXPLAIN ANALYZE
SELECT * FROM drifts WHERE status = 'detected' ORDER BY created_at DESC;

-- Should show: Index Scan (not Seq Scan)
```

### 🛡️ Security Verification

**1. No secrets in logs**

```bash
# Search for hardcoded secrets
grep -r "password\|token\|secret\|key" src/ --include="*.ts"

# Should return: 0 results
```

**2. Input validation**

```typescript
// Every endpoint must validate input
const input = validateRequest(schema, req.body);

// Never use raw req.body directly
```

**3. SQL Injection Protection**

```typescript
// Using Prisma - automatically protected
const drift = await prisma.drift.findUnique({ where: { id } });

// ✅ Safe - Prisma parameterizes all queries
```

### 📋 Service Layer Verification

**Each service must have**:

- ✅ JSDoc comments on all public methods
- ✅ @throws documentation
- ✅ Logging at key decision points
- ✅ Error handling (try-catch)
- ✅ Transaction support for mutations
- ✅ No direct database access (uses repositories)
- ✅ All business logic isolated
- ✅ No HTTP concerns (no req/res)

---

## PHASE 2: SUCCESS SIGNAL

When complete, you should be able to:

```bash
# 1. Build without errors
npm run build

# 2. Start server
npm run dev

# 3. Hit endpoints successfully
curl http://localhost:3001/api/v1/drifts

# 4. See realistic data from Phase 1 seed
# (admin@driftsentry.local's drifts)

# 5. Frontend can wire to real API by changing:
# src/services/driftApi.ts: USE_MOCK = false
# API_BASE_URL = 'http://localhost:3001/api'

# 6. No TypeScript errors
npm run type-check
```

---

## INTEGRATION WITH FRONTEND

**Frontend is ready to connect!**

Current state:
- ✅ Mock API in `src/services/driftApi.ts`
- ✅ Types match what backend returns
- ✅ Hooks expect `useQuery` pattern
- ✅ Components render real data

To integrate:
1. **After Phase 2 is done**, set `USE_MOCK = false` in frontend
2. **Update API_BASE_URL** to `http://localhost:3001/api`
3. **No component changes needed** - contracts already match
4. **Frontend will fetch real data** from your backend

---

## NEXT STEPS

1. **Implement all 4 route files** (drift, alert, metrics, plus health checks)
2. **Implement 3 service files** (drift, alert, metrics)
3. **Add validation schemas** for each endpoint
4. **Test each endpoint** with curl/Postman
5. **Verify performance** with timing logs
6. **Run full verification** checklist

Then: **Phase 3 (Authentication & Real-Time)** will add JWT tokens and WebSocket.

---

**Backend API Ready!** Let's make it bulletproof. 🎯
