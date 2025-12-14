# 🔧 BACKEND TECHNICAL RULES ENGINE
## CloudDrift Guardian - Complete Backend Decision Framework
**Version**: 1.0.0  
**Date**: December 2025  
**Stack**: Node.js + Express/Fastify + PostgreSQL + AWS SDK  
**Quality Level**: Enterprise Production-Ready

---

## TABLE OF CONTENTS

1. [Core Philosophy & Mindset](#core-philosophy--mindset)
2. [TypeScript & Type Safety Rules](#typescript--type-safety-rules)
3. [Database Schema & Migrations](#database-schema--migrations)
4. [API Design & REST Conventions](#api-design--rest-conventions)
5. [Service Layer Architecture](#service-layer-architecture)
6. [Error Handling & Logging](#error-handling--logging)
7. [Authentication & Authorization](#authentication--authorization)
8. [Validation & Input Sanitization](#validation--input-sanitization)
9. [Performance & Scaling](#performance--scaling)
10. [Testing & Quality Assurance](#testing--quality-assurance)
11. [AWS Integration Strategy](#aws-integration-strategy)
12. [Real-Time & WebSocket](#real-time--websocket)
13. [Deployment & Operations](#deployment--operations)
14. [Security & Data Protection](#security--data-protection)
15. [Common Patterns & Solutions](#common-patterns--solutions)
16. [Anti-Patterns & Trap Prevention](#anti-patterns--trap-prevention)

---

## CORE PHILOSOPHY & MINDSET

### 🎯 THE FIVE PILLARS OF BACKEND EXCELLENCE

**PILLAR 1: COMPLETENESS OVER PERFECTION**
```
Rule: Every endpoint is production-ready, fully functional.
      No TODOs, no "implement later", no incomplete flows.
      
When: 
- All error paths handled (validation, auth, db, network)
- All dependencies checked before returning
- All side effects (logs, metrics, events) in place
- All edge cases covered (empty results, concurrent requests, race conditions)
```

**PILLAR 2: CORRECTNESS OVER CLEVERNESS**
```
Rule: Code is clear, obvious, and auditable.
      If database query is clever, document it heavily.
      If algorithm is non-standard, explain why.
      
When:
- SQL is simple and readable (avoid CTEs unless needed)
- Error messages are actionable (not cryptic)
- Response shapes are predictable
- Function logic is linear, not nested 3+ levels
```

**PILLAR 3: SAFETY OVER SPEED**
```
Rule: Data consistency trumps optimization.
      Transactions before stored procedures.
      Explicit locking before optimistic concurrency.
      
When:
- Database writes use transactions
- Concurrent requests don't corrupt state
- Sensitive operations are logged and auditable
- Failures leave data in consistent state
```

**PILLAR 4: OBSERVABILITY OVER ASSUMPTIONS**
```
Rule: If something can go wrong, log it.
      If something is slow, measure it.
      If someone needs to debug, give them context.
      
When:
- Every API call logs request/response (without secrets)
- Every database operation logs execution time
- Every error includes context (userId, driftId, etc)
- Every async operation has timeout and retry logic
```

**PILLAR 5: SECURITY BY DESIGN, NOT AFTERTHOUGHT**
```
Rule: Assume user input is malicious by default.
      Assume network is unreliable.
      Assume someone will try to break your API.
      
When:
- Every input is validated against schema
- Every output is sanitized
- Every secret never hits logs
- Every external API has timeout + rate limit
```

---

## TYPESCRIPT & TYPE SAFETY RULES

### 🔒 RULE 1.1: STRICT COMPILATION

```typescript
// tsconfig.json - NO EXCEPTIONS
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  }
}
```

---

### 🔒 RULE 1.2: DOMAIN TYPES FIRST

```typescript
// src/types/domain/drift.ts
/**
 * Core drift domain entity
 * Represents detected configuration divergence from expected state
 */
export interface Drift {
  id: string;  // UUID, immutable
  resourceId: string;  // AWS resource identifier
  resourceType: 'EC2' | 'RDS' | 'S3' | 'IAM_ROLE' | 'SECURITY_GROUP';
  region: string;  // AWS region code
  
  // Expected vs Actual
  expectedState: Record<string, any>;  // What we defined
  actualState: Record<string, any>;    // What AWS has
  difference: Record<string, string>;  // Human-readable diff
  
  // Severity
  severity: 'critical' | 'warning' | 'info';
  
  // Cost impact (in USD/month)
  costImpact: number;
  
  // Status lifecycle
  status: 'detected' | 'triaged' | 'approved' | 'rejected' | 'resolved';
  
  // Audit trail
  detectedAt: Date;
  detectedBy: 'scheduler' | 'manual' | 'api';
  
  approvedAt?: Date;
  approvedBy?: string;  // userId
  approvalReason?: string;
  
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  
  resolvedAt?: Date;
  resolvedHow?: 'auto-remediate' | 'manual-fix' | 'acknowledged';
}

// Request/Response types (API layer)
export interface CreateDriftRequest {
  resourceId: string;
  resourceType: Drift['resourceType'];
  region: string;
  expectedState: Record<string, any>;
  actualState: Record<string, any>;
  severity: Drift['severity'];
  costImpact: number;
  detectedBy: Drift['detectedBy'];
}

export interface DriftResponse extends Drift {
  createdAt: Date;
  updatedAt: Date;
}

export interface ApproveDriftRequest {
  reason: string;
  approvedBy: string;
}

export interface RejectDriftRequest {
  reason: string;
  rejectedBy: string;
}
```

---

### 🔒 RULE 1.3: API RESPONSE ENVELOPE

```typescript
// src/types/api.ts
export interface ApiResponse<T = null> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'SERVER_ERROR' | 'RATE_LIMIT';
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    traceId: string;  // For debugging
  };
}
```

---

## DATABASE SCHEMA & MIGRATIONS

### 📊 RULE 2.1: SCHEMA DESIGN PRINCIPLES

```sql
-- src/database/migrations/001_initial_schema.sql

-- ============================================
-- USERS & AUTH
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  
  -- Profile
  avatar_url VARCHAR(500),
  bio TEXT,
  
  -- Permissions
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',  -- admin, engineer, viewer
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'engineer', 'viewer'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- DRIFTS (Core entity)
-- ============================================

CREATE TABLE drifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resource identification
  resource_id VARCHAR(255) NOT NULL,  -- e.g., "i-0123456789abcdef0"
  resource_type VARCHAR(50) NOT NULL,  -- EC2, RDS, S3, etc
  region VARCHAR(50) NOT NULL,  -- us-east-1, eu-west-1, etc
  account_id VARCHAR(12),  -- AWS account ID
  
  -- State comparison
  expected_state JSONB NOT NULL,  -- IaC definition
  actual_state JSONB NOT NULL,    -- Current AWS state
  difference JSONB NOT NULL,      -- Computed diff
  
  -- Severity & Impact
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',  -- critical, warning, info
  cost_impact_monthly DECIMAL(10, 2) DEFAULT 0,  -- USD/month
  
  -- Status lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'detected',
  -- detected -> triaged -> approved/rejected -> resolved
  
  -- Detection metadata
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_by VARCHAR(50) NOT NULL,  -- scheduler, manual, api
  
  -- Approval/Rejection (optional)
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  approval_reason TEXT,
  
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_how VARCHAR(50),  -- auto-remediate, manual-fix, acknowledged
  
  -- System timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('detected', 'triaged', 'approved', 'rejected', 'resolved')),
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info')),
  CONSTRAINT valid_detected_by CHECK (detected_by IN ('scheduler', 'manual', 'api')),
  CONSTRAINT valid_resolved_how CHECK (resolved_how IS NULL OR resolved_how IN ('auto-remediate', 'manual-fix', 'acknowledged'))
);

-- Indexes for common queries
CREATE INDEX idx_drifts_status ON drifts(status);
CREATE INDEX idx_drifts_severity ON drifts(severity);
CREATE INDEX idx_drifts_resource ON drifts(resource_type, region);
CREATE INDEX idx_drifts_detected_at ON drifts(detected_at DESC);
CREATE INDEX idx_drifts_created_at ON drifts(created_at DESC);
CREATE INDEX idx_drifts_approved_by ON drifts(approved_by) WHERE approved_at IS NOT NULL;

-- ============================================
-- ALERTS
-- ============================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID NOT NULL REFERENCES drifts(id) ON DELETE CASCADE,
  
  -- Alert properties
  type VARCHAR(50) NOT NULL,  -- drift_detected, approval_needed, remediation_failed
  severity VARCHAR(20) NOT NULL,  -- critical, warning, info
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES users(id),
  
  -- Notification channels
  notified_slack BOOLEAN DEFAULT false,
  notified_email BOOLEAN DEFAULT false,
  notified_pagerduty BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_alert_type CHECK (type IN ('drift_detected', 'approval_needed', 'remediation_failed')),
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info'))
);

CREATE INDEX idx_alerts_drift_id ON alerts(drift_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================
-- AUDIT LOG (immutable)
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE SET NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL,  -- drift_created, drift_approved, drift_rejected, etc
  actor_id UUID REFERENCES users(id),
  actor_email VARCHAR(255),  -- denormalized for deleted users
  
  -- Before/After state
  old_value JSONB,
  new_value JSONB,
  
  -- Details
  details JSONB,
  ip_address INET,
  user_agent VARCHAR(500),
  
  -- Timestamp (immutable)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_action CHECK (action IN ('drift_created', 'drift_approved', 'drift_rejected', 'drift_resolved'))
);

CREATE INDEX idx_audit_logs_drift_id ON audit_logs(drift_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================
-- COST METRICS (time-series)
-- ============================================

CREATE TABLE cost_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE CASCADE,
  
  -- Cost data
  cost_usd DECIMAL(10, 2) NOT NULL,
  cost_projected_monthly DECIMAL(10, 2),
  
  -- Time period
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cost_metrics_drift_id ON cost_metrics(drift_id);
CREATE INDEX idx_cost_metrics_recorded_at ON cost_metrics(recorded_at DESC);

-- ============================================
-- SESSIONS (for JWT refresh tokens)
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address INET,
  user_agent VARCHAR(500),
  
  is_revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);

-- ============================================
-- TRIGGERS for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_drifts_timestamp BEFORE UPDATE ON drifts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_alerts_timestamp BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## API DESIGN & REST CONVENTIONS

### 🌐 RULE 3.1: ENDPOINT PATTERNS

```typescript
// Drift endpoints - RESTful resource pattern

GET    /api/v1/drifts                      // List all drifts
GET    /api/v1/drifts?severity=critical&page=1&limit=20  // Filtered + paginated
GET    /api/v1/drifts/:id                  // Get single drift
POST   /api/v1/drifts                      // Create drift (internal)
PUT    /api/v1/drifts/:id                  // Update drift (internal)
DELETE /api/v1/drifts/:id                  // Soft delete drift

// Actions (verb-based for operations)
POST   /api/v1/drifts/:id/approve          // Approve drift
POST   /api/v1/drifts/:id/reject           // Reject drift
POST   /api/v1/drifts/:id/resolve          // Mark as resolved

// Metrics & Analytics
GET    /api/v1/metrics/summary              // Dashboard summary
GET    /api/v1/metrics/cost-trend           // Cost over time
GET    /api/v1/metrics/drift-timeline       // Timeline view

// Alerts
GET    /api/v1/alerts                       // List alerts
POST   /api/v1/alerts/:id/mark-read         // Mark alert as read

// Health & System
GET    /api/v1/health                       // Health check
GET    /api/v1/health/ready                 // Readiness probe
```

---

### 🌐 RULE 3.2: REQUEST/RESPONSE SHAPES

```typescript
// src/types/api/drift.ts

// ========== LIST DRIFTS ==========
export interface ListDriftsRequest {
  // Query parameters
  page?: number;  // 1-indexed, default 1
  limit?: number;  // 1-100, default 20
  
  // Filters
  severity?: 'critical' | 'warning' | 'info' | 'all';
  status?: 'detected' | 'triaged' | 'approved' | 'rejected' | 'resolved' | 'all';
  resourceType?: string;
  region?: string;
  
  // Sorting
  sortBy?: 'created_at' | 'detected_at' | 'cost_impact' | 'severity';
  sortOrder?: 'asc' | 'desc';
  
  // Search
  search?: string;  // Full-text search
}

export interface ListDriftsResponse {
  success: true;
  data: {
    items: DriftResponse[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

// ========== GET SINGLE DRIFT ==========
export interface GetDriftRequest {
  // Path parameter
  // :id - UUID
}

export interface GetDriftResponse {
  success: true;
  data: DriftResponse & {
    // Include related data
    alertCount: number;
    costHistory: CostMetricResponse[];
    auditTrail: AuditLogResponse[];
  };
}

// ========== APPROVE DRIFT ==========
export interface ApproveDriftRequest {
  reason: string;  // Required, min 10 chars
  approvedBy: string;  // From JWT token, optional in request
}

export interface ApproveDriftResponse {
  success: true;
  data: {
    id: string;
    status: 'approved';
    approvedAt: string;
    approvedBy: string;
  };
}

// ========== REJECT DRIFT ==========
export interface RejectDriftRequest {
  reason: string;  // Required, min 10 chars
  rejectedBy?: string;  // From JWT token
}

export interface RejectDriftResponse {
  success: true;
  data: {
    id: string;
    status: 'rejected';
    rejectedAt: string;
    rejectedBy: string;
  };
}
```

---

## SERVICE LAYER ARCHITECTURE

### 🏗️ RULE 4.1: SERVICE STRUCTURE

```typescript
// src/services/drift.service.ts
import { logger } from '@/utils/logger';
import { driftRepository } from '@/repositories/drift.repository';
import { auditService } from './audit.service';
import { alertService } from './alert.service';
import type { Drift, CreateDriftRequest } from '@/types/domain';

/**
 * DriftService - Core business logic for drift management
 * Orchestrates repositories, external services, and side effects
 * 
 * Responsibility:
 * - Validate business rules (not just input validation)
 * - Coordinate multiple repositories/services
 * - Emit events and side effects (logs, alerts, audits)
 * - Never expose raw database models to API
 */
export class DriftService {
  /**
   * Create new drift detection
   * @throws ValidationError if invalid input
   * @throws DatabaseError if db fails
   */
  async createDrift(input: CreateDriftRequest, userId: string): Promise<Drift> {
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
          newInput: input.resourceId,
        });
        throw new ConflictError('Similar drift detected recently');
      }
      
      // 3. Create drift
      const drift = await driftRepository.create({
        ...input,
        detectedAt: new Date(),
        status: 'detected',
      });
      
      // 4. Create audit log
      await auditService.log({
        action: 'drift_created',
        driftId: drift.id,
        actorId: userId,
        newValue: drift,
      });
      
      // 5. Create alert if critical
      if (input.severity === 'critical') {
        await alertService.createAlert({
          driftId: drift.id,
          type: 'drift_detected',
          severity: 'critical',
          title: `Critical drift detected: ${input.resourceId}`,
          message: `A critical infrastructure drift has been detected...`,
        });
      }
      
      // 6. Log metrics
      const duration = Date.now() - startTime;
      logger.info('Drift created', {
        driftId: drift.id,
        duration,
        severity: input.severity,
      });
      
      return drift;
    } catch (error) {
      logger.error('Failed to create drift', {
        error: error instanceof Error ? error.message : String(error),
        input,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  /**
   * Approve drift remediation
   * Updates drift status and creates audit trail
   */
  async approveDrift(
    driftId: string,
    reason: string,
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
          `Cannot approve drift in ${drift.status} status. Only detected/triaged allowed.`
        );
      }
      
      // 3. Update drift
      const updated = await driftRepository.update(driftId, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
        approvalReason: reason,
      });
      
      // 4. Audit log
      await auditService.log({
        action: 'drift_approved',
        driftId,
        actorId: userId,
        oldValue: drift,
        newValue: updated,
        details: { reason },
      });
      
      // 5. Clear related alerts
      await alertService.markAlertsByDriftAsResolved(driftId);
      
      logger.info('Drift approved', {
        driftId,
        approvedBy: userId,
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
   * Get paginated list of drifts with filtering
   */
  async listDrifts(filters: ListDriftsFilters): Promise<PaginatedResult<Drift>> {
    const startTime = Date.now();
    
    try {
      // Validate pagination
      if (filters.page < 1 || filters.limit < 1 || filters.limit > 100) {
        throw new ValidationError('Invalid pagination parameters');
      }
      
      // Query database
      const result = await driftRepository.list({
        ...filters,
        offset: (filters.page - 1) * filters.limit,
      });
      
      logger.debug('Drifts listed', {
        count: result.items.length,
        total: result.total,
        filters,
        duration: Date.now() - startTime,
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to list drifts', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  // ======= PRIVATE METHODS =======
  
  private validateDriftInput(input: CreateDriftRequest): void {
    // Business rule validation (not just schema)
    if (input.expectedState === input.actualState) {
      throw new ValidationError('No difference between expected and actual state');
    }
    
    if (input.costImpact < 0) {
      throw new ValidationError('Cost impact cannot be negative');
    }
    
    if (!['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP'].includes(input.resourceType)) {
      throw new ValidationError(`Unsupported resource type: ${input.resourceType}`);
    }
  }
}

// Export singleton
export const driftService = new DriftService();
```

---

## ERROR HANDLING & LOGGING

### ⚠️ RULE 5.1: CUSTOM ERROR CLASSES

```typescript
// src/utils/errors.ts

/**
 * Base error class for all application errors
 */
export abstract class ApplicationError extends Error {
  abstract statusCode: number;
  abstract errorCode: string;
  
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

export class ValidationError extends ApplicationError {
  statusCode = 400;
  errorCode = 'VALIDATION_ERROR';
  
  constructor(message: string, public details?: Record<string, any>) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends ApplicationError {
  statusCode = 401;
  errorCode = 'AUTH_ERROR';
}

export class ForbiddenError extends ApplicationError {
  statusCode = 403;
  errorCode = 'FORBIDDEN';
}

export class NotFoundError extends ApplicationError {
  statusCode = 404;
  errorCode = 'NOT_FOUND';
}

export class ConflictError extends ApplicationError {
  statusCode = 409;
  errorCode = 'CONFLICT';
}

export class RateLimitError extends ApplicationError {
  statusCode = 429;
  errorCode = 'RATE_LIMIT';
  
  constructor(public retryAfter: number = 60) {
    super('Too many requests. Please try again later.');
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class DatabaseError extends ApplicationError {
  statusCode = 500;
  errorCode = 'DATABASE_ERROR';
}

export class ExternalServiceError extends ApplicationError {
  statusCode = 502;
  errorCode = 'EXTERNAL_SERVICE_ERROR';
  
  constructor(
    public service: string,
    message: string,
    public retryable: boolean = true
  ) {
    super(`${service}: ${message}`);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class ServerError extends ApplicationError {
  statusCode = 500;
  errorCode = 'INTERNAL_SERVER_ERROR';
}
```

---

### ⚠️ RULE 5.2: STRUCTURED LOGGING

```typescript
// src/utils/logger.ts

interface LogContext {
  [key: string]: any;
  userId?: string;
  driftId?: string;
  duration?: number;
  error?: string;
}

export const logger = {
  /**
   * Debug - development debugging
   * No sensitive data
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL !== 'debug') return;
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      ...context,
    }));
  },
  
  /**
   * Info - important business events
   * Approval, rejection, creation
   */
  info(message: string, context?: LogContext): void {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...context,
    }));
  },
  
  /**
   * Warn - potential issues
   * Retries, slow operations, unusual patterns
   */
  warn(message: string, context?: LogContext): void {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context,
    }));
  },
  
  /**
   * Error - application errors
   * Never log passwords, tokens, secrets
   */
  error(message: string, context?: LogContext): void {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      ...sanitizeContext(context),
    }));
  },
};

/**
 * Remove sensitive data from logs
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return;
  
  const sanitized = { ...context };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
  
  sensitiveKeys.forEach((key) => {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}
```

---

## AUTHENTICATION & AUTHORIZATION

### 🔐 RULE 6.1: JWT STRATEGY

```typescript
// src/middleware/auth.middleware.ts

export interface JwtPayload {
  sub: string;  // User ID
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
  iat: number;  // Issued at
  exp: number;  // Expiration
  aud: 'api';
}

/**
 * Verify JWT token and attach user to request
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new AuthError('Missing authorization token');
    }
    
    const payload = verifyToken(token) as JwtPayload;
    
    // Attach to request
    (req as any).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    next();
  };
}
```

---

## VALIDATION & INPUT SANITIZATION

### ✔️ RULE 7.1: ZOD SCHEMA VALIDATION

```typescript
// src/schemas/drift.schema.ts
import { z } from 'zod';

export const createDriftSchema = z.object({
  resourceId: z.string().min(1).max(255),
  resourceType: z.enum(['EC2', 'RDS', 'S3', 'IAM_ROLE', 'SECURITY_GROUP']),
  region: z.string().regex(/^[a-z]{2}-[a-z]+-\d+$/),
  
  expectedState: z.record(z.unknown()).refine(
    (val) => Object.keys(val).length > 0,
    'Expected state cannot be empty'
  ),
  
  actualState: z.record(z.unknown()),
  
  severity: z.enum(['critical', 'warning', 'info']),
  costImpact: z.number().nonnegative().max(999999),
  detectedBy: z.enum(['scheduler', 'manual', 'api']),
});

export type CreateDriftInput = z.infer<typeof createDriftSchema>;

/**
 * Validate and parse request body
 */
export function validateRequest<T>(schema: z.ZodSchema, data: unknown): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request', {
        errors: error.errors,
      });
    }
    throw error;
  }
}
```

---

## PERFORMANCE & SCALING

### ⚡ RULE 8.1: DATABASE QUERY OPTIMIZATION

```typescript
// src/repositories/drift.repository.ts

export class DriftRepository {
  /**
   * List with efficient pagination
   * - Uses OFFSET/LIMIT (avoid cursor for now)
   * - Indexes support sorting
   * - Minimal SELECT columns
   */
  async list(filters: ListFilters): Promise<PaginatedResult<Drift>> {
    const { limit, offset, severity, status, sortBy, sortOrder } = filters;
    
    // Build query dynamically
    let query = this.db.select([
      'id',
      'resource_id',
      'resource_type',
      'region',
      'severity',
      'status',
      'cost_impact_monthly',
      'detected_at',
      'created_at',
    ]).from('drifts');
    
    // Apply filters
    if (severity && severity !== 'all') {
      query = query.where('severity', '=', severity);
    }
    
    if (status && status !== 'all') {
      query = query.where('status', '=', status);
    }
    
    // Sort
    const validSortCols = ['created_at', 'detected_at', 'cost_impact_monthly', 'severity'];
    if (validSortCols.includes(sortBy)) {
      query = query.orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc');
    }
    
    // Get total count (separate fast query)
    const countResult = await this.db
      .count('* as count')
      .from('drifts')
      .where(/* same filters as above */);
    
    const total = countResult[0]?.count || 0;
    
    // Get paginated results
    const items = await query.limit(limit).offset(offset);
    
    return {
      items,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    };
  }
  
  /**
   * Batch operations to reduce round-trips
   */
  async markMultipleAsApproved(driftIds: string[], userId: string): Promise<void> {
    const now = new Date();
    
    await this.db('drifts')
      .whereIn('id', driftIds)
      .update({
        status: 'approved',
        approved_at: now,
        approved_by: userId,
      });
  }
}
```

---

## TESTING & QUALITY ASSURANCE

### ✅ RULE 9.1: UNIT TEST PATTERN

```typescript
// src/services/__tests__/drift.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriftService } from '../drift.service';
import * as driftRepository from '@/repositories/drift.repository';
import * as auditService from '../audit.service';

describe('DriftService', () => {
  let service: DriftService;
  
  beforeEach(() => {
    // Mock dependencies
    vi.mocked(driftRepository.create).mockResolvedValue(driftMock);
    vi.mocked(auditService.log).mockResolvedValue(undefined);
    
    service = new DriftService();
  });
  
  describe('createDrift', () => {
    it('should create drift and log audit trail', async () => {
      const result = await service.createDrift(validInput, userId);
      
      expect(result.id).toBeDefined();
      expect(driftRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(validInput)
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'drift_created' })
      );
    });
    
    it('should reject duplicate drifts within 1 hour', async () => {
      vi.mocked(driftRepository.findRecentDuplicate).mockResolvedValue(existingDrift);
      
      await expect(
        service.createDrift(validInput, userId)
      ).rejects.toThrow('Similar drift detected recently');
    });
    
    it('should validate business rules', async () => {
      const invalidInput = { ...validInput, costImpact: -100 };
      
      await expect(
        service.createDrift(invalidInput, userId)
      ).rejects.toThrow('Cost impact cannot be negative');
    });
  });
});
```

---

## AWS INTEGRATION STRATEGY

### ☁️ RULE 10.1: AWS SDK PATTERN

```typescript
// src/services/aws.service.ts
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

/**
 * AWS SDK v3 for efficiency (smaller bundle, modular)
 * Never hardcode credentials - use IAM roles
 */
export class AWSService {
  private ec2Client: EC2Client;
  
  constructor() {
    // Uses AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY env vars
    this.ec2Client = new EC2Client({
      region: process.env.AWS_REGION || 'us-east-1',
      maxAttempts: 3,
      // Use IAM role credentials in production
    });
  }
  
  /**
   * Fetch EC2 instance config from AWS
   * Used to detect drift
   */
  async describeInstance(instanceId: string): Promise<InstanceConfig> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      
      const response = await this.ec2Client.send(command);
      
      if (!response.Reservations?.[0]?.Instances?.[0]) {
        throw new NotFoundError(`Instance ${instanceId} not found`);
      }
      
      return this.parseInstanceConfig(response.Reservations[0].Instances[0]);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      
      throw new ExternalServiceError(
        'AWS EC2',
        error instanceof Error ? error.message : 'Unknown error',
        true  // Retryable
      );
    }
  }
  
  private parseInstanceConfig(instance: EC2Instance): InstanceConfig {
    return {
      instanceType: instance.InstanceType,
      state: instance.State?.Name,
      vpcId: instance.VpcId,
      securityGroups: instance.SecurityGroups?.map((g) => g.GroupId) || [],
      // ... more fields
    };
  }
}

export const awsService = new AWSService();
```

---

## REAL-TIME & WEBSOCKET

### 📡 RULE 11.1: WEBSOCKET EVENT PATTERN

```typescript
// src/websocket/events.ts
import { Server as SocketIO } from 'socket.io';

/**
 * WebSocket events for real-time drift updates
 */
export function setupWebSocketEvents(io: SocketIO): void {
  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });
    
    // Subscribe to drift updates
    socket.on('subscribe:drifts', (data: { userId: string }) => {
      socket.join(`drifts:${data.userId}`);
      logger.debug('User subscribed to drifts', {
        userId: data.userId,
        socketId: socket.id,
      });
    });
    
    // Unsubscribe
    socket.on('unsubscribe:drifts', (data: { userId: string }) => {
      socket.leave(`drifts:${data.userId}`);
    });
    
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });
}

/**
 * Emit events from services
 */
export function emitDriftCreated(drift: Drift, io: SocketIO): void {
  io.to(`drifts:${drift.accountId}`).emit('drift:created', {
    id: drift.id,
    resourceId: drift.resourceId,
    severity: drift.severity,
    costImpact: drift.costImpactMonthly,
    detectedAt: drift.detectedAt,
  });
}
```

---

This is Part 1 of the Backend Rules - **Database, APIs, Services, and Core Architecture**.
