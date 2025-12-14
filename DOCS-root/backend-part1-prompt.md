# 🚀 BACKEND PART 1: DOMAIN MODELING & DATA PERSISTENCE
## Implementation Prompt for Antigravity
**Target**: Complete, production-ready Domain & Data Layer  
**Estimated Duration**: 2-3 hours  
**Stack**: Node.js 20 + TypeScript + PostgreSQL + Prisma ORM

---

## MISSION BRIEFING

You are building the **data foundation** for CloudDrift Guardian backend. This is Part 1 of 4:

```
Part 1: Domain Modeling & Data Persistence (THIS)
        └─ Types, Schemas, Database, Repositories

Part 2: API Contracts & Service Layer
        └─ REST endpoints, handlers, business logic

Part 3: Authentication & Real-Time
        └─ JWT auth, WebSocket, subscriptions

Part 4: Deployment & Operations
        └─ Error handling, logging, monitoring
```

**Success Criteria**:
- ✅ All database tables created with proper indexes
- ✅ Prisma schema is type-safe and matches database exactly
- ✅ All domain types are defined and exported
- ✅ Repository pattern implemented for all entities
- ✅ No TypeScript errors, no warnings
- ✅ Migration files created and documented
- ✅ Database seed script with realistic test data ready
- ✅ README with setup instructions

---

## PART 1: BREAKDOWN

### Section 1.1: Database Setup & Migrations

**Objective**: PostgreSQL schema with all tables, indexes, constraints, and triggers

**Deliverables**:

```
project-root/
├── src/
│   └── database/
│       ├── migrations/
│       │   ├── 001_initial_schema.sql      ← Main tables
│       │   ├── 002_indexes.sql              ← Performance indexes
│       │   └── 003_functions.sql            ← Triggers, procedures
│       ├── seed.ts                          ← Test data generator
│       └── migrations.ts                    ← Run migrations programmatically
│
├── prisma/
│   ├── schema.prisma                        ← Prisma schema (auto from SQL)
│   └── seed.ts                              ← Prisma seed script
│
└── DATABASE_SCHEMA.md                       ← Documentation
```

**Exact SQL Structure to Implement**:

```sql
-- USERS TABLE (with soft delete capability)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',  -- admin, engineer, viewer
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'engineer', 'viewer'))
);

-- DRIFTS TABLE (immutable detection records)
CREATE TABLE drifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  account_id VARCHAR(12),
  
  -- State comparison (JSONB for flexibility)
  expected_state JSONB NOT NULL,
  actual_state JSONB NOT NULL,
  difference JSONB NOT NULL,
  
  -- Severity and cost
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',
  cost_impact_monthly DECIMAL(10, 2) DEFAULT 0,
  
  -- Status lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'detected',
  
  -- Detection metadata
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_by VARCHAR(50) NOT NULL,
  
  -- Approval/Rejection
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  approval_reason TEXT,
  
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_how VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('detected', 'triaged', 'approved', 'rejected', 'resolved')),
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info')),
  CONSTRAINT valid_detected_by CHECK (detected_by IN ('scheduler', 'manual', 'api'))
);

-- ALERTS TABLE
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID NOT NULL REFERENCES drifts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AUDIT_LOGS TABLE (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_email VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  details JSONB,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- COST_METRICS TABLE (time-series data)
CREATE TABLE cost_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE CASCADE,
  cost_usd DECIMAL(10, 2) NOT NULL,
  cost_projected_monthly DECIMAL(10, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SESSIONS TABLE (for refresh tokens)
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

-- INDEXES for common queries
CREATE INDEX idx_drifts_status ON drifts(status);
CREATE INDEX idx_drifts_severity ON drifts(severity);
CREATE INDEX idx_drifts_resource ON drifts(resource_type, region);
CREATE INDEX idx_drifts_detected_at ON drifts(detected_at DESC);
CREATE INDEX idx_drifts_created_at ON drifts(created_at DESC);
CREATE INDEX idx_alerts_drift_id ON alerts(drift_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_cost_metrics_drift_id ON cost_metrics(drift_id);
CREATE INDEX idx_users_email ON users(email);
```

**Requirements**:

1. ✅ Use PostgreSQL (version 14+)
2. ✅ All UUIDs use PostgreSQL native UUID type + gen_random_uuid()
3. ✅ All timestamps use TIMESTAMP WITH TIME ZONE
4. ✅ JSON data stored in JSONB columns (indexed and queryable)
5. ✅ Foreign keys with ON DELETE CASCADE/SET NULL as appropriate
6. ✅ Check constraints for enum-like fields
7. ✅ Indexes on all commonly-filtered columns (status, severity, created_at)
8. ✅ Triggers for automatic updated_at timestamps
9. ✅ No stored procedures (keep logic in application)
10. ✅ All table names SNAKE_CASE, all columns SNAKE_CASE

---

### Section 1.2: Prisma Schema Generation

**Objective**: Generate Prisma schema from database, ensure type safety

**File**: `prisma/schema.prisma`

**Requirements**:

```prisma
// Must include:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Models matching database exactly
model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique
  passwordHash String  @map("password_hash")
  firstName String?   @map("first_name")
  lastName  String?   @map("last_name")
  avatarUrl String?   @map("avatar_url")
  role      String   @default("viewer")  // admin, engineer, viewer
  isActive  Boolean  @default(true)      @map("is_active")
  
  // Relations
  approvedDrifts Drift[] @relation("approvedBy")
  rejectedDrifts Drift[] @relation("rejectedBy")
  readAlerts Alert[] @relation("readBy")
  auditLogs AuditLog[] @relation("actor")
  sessions Session[]
  
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  lastLoginAt DateTime? @map("last_login_at") @db.Timestamptz(6)

  @@map("users")
}

model Drift {
  id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  resourceId String @map("resource_id")
  resourceType String @map("resource_type")
  region String
  accountId String? @map("account_id")
  
  expectedState Json @map("expected_state")
  actualState Json @map("actual_state")
  difference Json
  
  severity String  // critical, warning, info
  costImpactMonthly Decimal @map("cost_impact_monthly")
  
  status String  // detected, triaged, approved, rejected, resolved
  
  detectedAt DateTime @map("detected_at") @db.Timestamptz(6)
  detectedBy String @map("detected_by")
  
  approvedAt DateTime? @map("approved_at") @db.Timestamptz(6)
  approvedBy String? @map("approved_by") @db.Uuid
  approvalReason String? @map("approval_reason")
  approver User? @relation("approvedBy", fields: [approvedBy], references: [id])
  
  rejectedAt DateTime? @map("rejected_at") @db.Timestamptz(6)
  rejectedBy String? @map("rejected_by") @db.Uuid
  rejectionReason String? @map("rejection_reason")
  rejecter User? @relation("rejectedBy", fields: [rejectedBy], references: [id])
  
  resolvedAt DateTime? @map("resolved_at") @db.Timestamptz(6)
  resolvedHow String? @map("resolved_how")
  
  // Relations
  alerts Alert[]
  costMetrics CostMetric[]
  auditLogs AuditLog[]
  
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([status])
  @@index([severity])
  @@index([resourceType, region])
  @@index([detectedAt(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@map("drifts")
}

// ... similar for Alert, AuditLog, CostMetric, Session
```

**Requirements**:

1. ✅ Use `@map()` to match snake_case database names
2. ✅ Use `@db.Uuid` for UUID fields
3. ✅ Use `@db.Timestamptz(6)` for timestamps with timezone
4. ✅ Define all relations clearly
5. ✅ Add all indexes from database
6. ✅ No manual edits to schema after initial generation
7. ✅ Run `npx prisma generate` to create types

---

### Section 1.3: Domain Types

**Objective**: Define all TypeScript types for domain objects

**Files**:
```
src/types/
├── domain/
│   ├── drift.ts          ← Drift entity + request/response types
│   ├── alert.ts          ← Alert types
│   ├── user.ts           ← User types
│   ├── cost.ts           ← Cost metrics types
│   ├── audit.ts          ← Audit log types
│   └── index.ts          ← Export all
│
├── api/
│   ├── responses.ts      ← Standard API response shapes
│   ├── errors.ts         ← Error response types
│   └── index.ts
│
└── index.ts              ← Main export
```

**Example: `src/types/domain/drift.ts`**

```typescript
/**
 * Drift Domain Entity
 * Represents a detected infrastructure divergence
 */
export interface Drift {
  // Identification
  id: string;  // UUID
  resourceId: string;  // AWS resource ID (e.g., "i-0123...")
  resourceType: 'EC2' | 'RDS' | 'S3' | 'IAM_ROLE' | 'SECURITY_GROUP';
  region: string;  // AWS region (e.g., "us-east-1")
  
  // State
  expectedState: Record<string, unknown>;  // From IaC
  actualState: Record<string, unknown>;    // From AWS
  difference: Record<string, unknown>;     // Computed diff
  
  // Severity & Cost
  severity: 'critical' | 'warning' | 'info';
  costImpactMonthly: number;  // USD/month
  
  // Status lifecycle
  status: 'detected' | 'triaged' | 'approved' | 'rejected' | 'resolved';
  
  // Metadata
  detectedAt: Date;
  detectedBy: 'scheduler' | 'manual' | 'api';
  
  // Approval (optional)
  approvedAt?: Date;
  approvedBy?: string;  // User ID
  approvalReason?: string;
  
  // Rejection (optional)
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // Resolution (optional)
  resolvedAt?: Date;
  resolvedHow?: 'auto-remediate' | 'manual-fix' | 'acknowledged';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response DTOs
export interface CreateDriftInput {
  resourceId: string;
  resourceType: Drift['resourceType'];
  region: string;
  expectedState: Record<string, unknown>;
  actualState: Record<string, unknown>;
  severity: Drift['severity'];
  costImpactMonthly: number;
  detectedBy: Drift['detectedBy'];
}

export interface DriftResponse extends Drift {}

export interface ApproveDriftInput {
  reason: string;  // min 10 chars
  approvedBy: string;  // User ID
}

export interface RejectDriftInput {
  reason: string;
  rejectedBy: string;
}
```

**Requirements**:

1. ✅ One type per domain entity
2. ✅ Clear separation: Domain type + DTOs (Request/Response)
3. ✅ All timestamps are `Date` objects (not strings)
4. ✅ All IDs are strings (UUIDs)
5. ✅ Optional fields marked with `?`
6. ✅ Discriminated unions where applicable (e.g., Status)
7. ✅ Strict TypeScript (`strict: true`)
8. ✅ No `any` types
9. ✅ Export barrel from `src/types/index.ts`
10. ✅ JSDoc comments on all public types

---

### Section 1.4: Repository Pattern

**Objective**: Data access layer with clean separation from business logic

**File**: `src/repositories/`

```
src/repositories/
├── base.repository.ts    ← Abstract base with common methods
├── drift.repository.ts   ← Drift-specific queries
├── alert.repository.ts   ← Alert queries
├── user.repository.ts    ← User queries
├── cost.repository.ts    ← Cost metrics queries
└── index.ts              ← Export all
```

**Example: `src/repositories/drift.repository.ts`**

```typescript
import { prisma } from '@/database/prisma';
import type { Drift, CreateDriftInput, DriftResponse } from '@/types/domain/drift';
import { NotFoundError, DatabaseError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * DriftRepository
 * All database access for Drift entity
 * 
 * Contract:
 * - Never returns Prisma models directly
 * - Always transforms to domain types
 * - All methods are async
 * - Always handles errors
 * - Always logs (debug for queries, error for failures)
 */
export class DriftRepository {
  /**
   * Create new drift
   */
  async create(input: CreateDriftInput): Promise<Drift> {
    try {
      const result = await prisma.drift.create({
        data: {
          resourceId: input.resourceId,
          resourceType: input.resourceType,
          region: input.region,
          expectedState: input.expectedState,
          actualState: input.actualState,
          difference: this.computeDifference(input.expectedState, input.actualState),
          severity: input.severity,
          costImpactMonthly: input.costImpactMonthly,
          detectedAt: new Date(),
          detectedBy: input.detectedBy,
          status: 'detected',
        },
      });
      
      logger.debug('Drift created', { driftId: result.id });
      return this.toDomain(result);
    } catch (error) {
      logger.error('Failed to create drift', {
        error: error instanceof Error ? error.message : String(error),
        input,
      });
      throw new DatabaseError(`Failed to create drift: ${error}`);
    }
  }
  
  /**
   * Get drift by ID
   */
  async getById(id: string): Promise<Drift | null> {
    try {
      const result = await prisma.drift.findUnique({
        where: { id },
      });
      
      return result ? this.toDomain(result) : null;
    } catch (error) {
      logger.error('Failed to get drift', { driftId: id, error });
      throw new DatabaseError(`Failed to get drift: ${error}`);
    }
  }
  
  /**
   * List drifts with filters and pagination
   */
  async list(filters: {
    status?: string;
    severity?: string;
    page: number;
    limit: number;
  }): Promise<{
    items: Drift[];
    total: number;
  }> {
    try {
      // Build where clause
      const where: Record<string, any> = {};
      if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      if (filters.severity && filters.severity !== 'all') {
        where.severity = filters.severity;
      }
      
      // Get count
      const total = await prisma.drift.count({ where });
      
      // Get paginated results
      const results = await prisma.drift.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
      });
      
      logger.debug('Drifts listed', {
        count: results.length,
        total,
        filters,
      });
      
      return {
        items: results.map((r) => this.toDomain(r)),
        total,
      };
    } catch (error) {
      logger.error('Failed to list drifts', { error, filters });
      throw new DatabaseError(`Failed to list drifts: ${error}`);
    }
  }
  
  /**
   * Update drift status
   */
  async updateStatus(
    id: string,
    status: Drift['status'],
    metadata: Record<string, any> = {}
  ): Promise<Drift> {
    try {
      const result = await prisma.drift.update({
        where: { id },
        data: {
          status,
          ...metadata,  // approvedAt, approvedBy, etc.
        },
      });
      
      logger.debug('Drift updated', { driftId: id, status });
      return this.toDomain(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw new NotFoundError(`Drift ${id} not found`);
      }
      logger.error('Failed to update drift', { driftId: id, error });
      throw new DatabaseError(`Failed to update drift: ${error}`);
    }
  }
  
  /**
   * Check for duplicate recent drifts
   */
  async findRecentDuplicate(
    resourceId: string,
    resourceType: string,
    { minutes = 60 }: { minutes?: number } = {}
  ): Promise<Drift | null> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      
      const result = await prisma.drift.findFirst({
        where: {
          resourceId,
          resourceType,
          detectedAt: { gte: since },
          status: { in: ['detected', 'triaged'] },
        },
        orderBy: { detectedAt: 'desc' },
      });
      
      return result ? this.toDomain(result) : null;
    } catch (error) {
      logger.error('Failed to find duplicate', { resourceId, error });
      throw new DatabaseError(`Failed to find duplicate: ${error}`);
    }
  }
  
  // ========= PRIVATE METHODS =========
  
  /**
   * Transform Prisma model to domain type
   */
  private toDomain(raw: any): Drift {
    return {
      id: raw.id,
      resourceId: raw.resourceId,
      resourceType: raw.resourceType,
      region: raw.region,
      expectedState: raw.expectedState,
      actualState: raw.actualState,
      difference: raw.difference,
      severity: raw.severity,
      costImpactMonthly: Number(raw.costImpactMonthly),
      status: raw.status,
      detectedAt: raw.detectedAt,
      detectedBy: raw.detectedBy,
      approvedAt: raw.approvedAt || undefined,
      approvedBy: raw.approvedBy || undefined,
      approvalReason: raw.approvalReason || undefined,
      rejectedAt: raw.rejectedAt || undefined,
      rejectedBy: raw.rejectedBy || undefined,
      rejectionReason: raw.rejectionReason || undefined,
      resolvedAt: raw.resolvedAt || undefined,
      resolvedHow: raw.resolvedHow || undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
  
  /**
   * Compute human-readable difference
   */
  private computeDifference(expected: any, actual: any): Record<string, unknown> {
    const diff: Record<string, unknown> = {};
    
    // Simple key-by-key comparison
    Object.keys(expected).forEach((key) => {
      if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) {
        diff[key] = {
          expected: expected[key],
          actual: actual[key],
        };
      }
    });
    
    return diff;
  }
}

// Export singleton
export const driftRepository = new DriftRepository();
```

**Requirements**:

1. ✅ One repository per domain entity
2. ✅ All methods are `async` with proper error handling
3. ✅ Never leak Prisma models - always transform to domain types
4. ✅ All errors wrapped in custom error classes
5. ✅ All queries logged (debug for success, error for failures)
6. ✅ Index queries on commonly-filtered columns
7. ✅ Pagination support with `skip`/`take`
8. ✅ Filter support with WHERE clauses
9. ✅ Type-safe queries with Prisma
10. ✅ Exported as singleton from `src/repositories/index.ts`

---

### Section 1.5: Database Seed Script

**Objective**: Populate database with realistic test data for development/demo

**File**: `src/database/seed.ts`

```typescript
import { prisma } from './prisma';
import { logger } from '@/utils/logger';

/**
 * Seed database with realistic test data
 * Run: npx ts-node src/database/seed.ts
 */
async function main() {
  logger.info('🌱 Seeding database...');
  
  try {
    // Clear existing data
    await prisma.drift.deleteMany({});
    await prisma.user.deleteMany({});
    
    // Create test users
    const admin = await prisma.user.create({
      data: {
        email: 'admin@driftsentry.local',
        passwordHash: 'hashed_password_123',  // Mock, replace with real hash
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      },
    });
    
    const engineer = await prisma.user.create({
      data: {
        email: 'engineer@driftsentry.local',
        passwordHash: 'hashed_password_456',
        firstName: 'John',
        lastName: 'Engineer',
        role: 'engineer',
      },
    });
    
    // Create test drifts
    const drifts = await Promise.all([
      // Critical drift
      prisma.drift.create({
        data: {
          resourceId: 'i-0123456789abcdef0',
          resourceType: 'EC2',
          region: 'us-east-1',
          expectedState: {
            instanceType: 't3.medium',
            vpcId: 'vpc-12345678',
            securityGroups: ['sg-12345678'],
          },
          actualState: {
            instanceType: 't3.large',  // Different!
            vpcId: 'vpc-12345678',
            securityGroups: ['sg-87654321'],  // Different!
          },
          difference: {
            instanceType: { expected: 't3.medium', actual: 't3.large' },
            securityGroups: { expected: ['sg-12345678'], actual: ['sg-87654321'] },
          },
          severity: 'critical',
          costImpactMonthly: 125.50,
          detectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),  // 1 day ago
          detectedBy: 'scheduler',
          status: 'detected',
        },
      }),
      
      // Warning drift
      prisma.drift.create({
        data: {
          resourceId: 'rds-prod-db-01',
          resourceType: 'RDS',
          region: 'eu-west-1',
          expectedState: {
            multiAZ: true,
            dbInstanceClass: 'db.t3.large',
          },
          actualState: {
            multiAZ: false,  // Different!
            dbInstanceClass: 'db.t3.large',
          },
          difference: {
            multiAZ: { expected: true, actual: false },
          },
          severity: 'warning',
          costImpactMonthly: 45.00,
          detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),  // 12 hours ago
          detectedBy: 'scheduler',
          status: 'triaged',
        },
      }),
      
      // Approved drift
      prisma.drift.create({
        data: {
          resourceId: 's3-bucket-logs',
          resourceType: 'S3',
          region: 'us-west-2',
          expectedState: {
            versioning: 'Enabled',
          },
          actualState: {
            versioning: 'Suspended',  // Different
          },
          difference: {
            versioning: { expected: 'Enabled', actual: 'Suspended' },
          },
          severity: 'info',
          costImpactMonthly: 0,
          detectedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),  // 3 days ago
          detectedBy: 'manual',
          status: 'approved',
          approvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
          approvedBy: engineer.id,
          approvalReason: 'Intentional configuration change for cost savings',
        },
      }),
    ]);
    
    // Create alerts
    await prisma.alert.create({
      data: {
        driftId: drifts[0].id,
        type: 'drift_detected',
        severity: 'critical',
        title: 'Critical drift: EC2 instance configuration',
        message: 'Instance type and security groups have changed unexpectedly',
        isRead: false,
      },
    });
    
    logger.info('✅ Seeding complete', {
      users: 2,
      drifts: drifts.length,
      alerts: 1,
    });
  } catch (error) {
    logger.error('❌ Seeding failed', { error });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Requirements**:

1. ✅ Creates at least 3 test users (admin, engineer, viewer)
2. ✅ Creates at least 5 realistic drifts with different statuses
3. ✅ Creates drifts with different severities (critical, warning, info)
4. ✅ Creates related alerts, cost metrics, audit logs
5. ✅ Timestamps are realistic (in past, varied)
6. ✅ All data is valid (matches schema constraints)
7. ✅ Clears old data before seeding
8. ✅ Proper error handling and logging
9. ✅ Can be run multiple times safely
10. ✅ Documented with comments

---

## DELIVERABLES CHECKLIST

**By the end of Part 1, deliver**:

- [ ] PostgreSQL database created with all tables
- [ ] Migration files (001, 002, 003) in `src/database/migrations/`
- [ ] Prisma schema in `prisma/schema.prisma`
- [ ] All domain types in `src/types/domain/`
- [ ] All repositories in `src/repositories/`
- [ ] Seed script in `src/database/seed.ts`
- [ ] `.env.example` with DATABASE_URL template
- [ ] `DATABASE_SCHEMA.md` with SQL documentation
- [ ] `src/database/prisma.ts` - Prisma client initialization
- [ ] `src/utils/errors.ts` - Custom error classes
- [ ] `src/utils/logger.ts` - Logging utility
- [ ] TypeScript compilation: `tsc --noEmit` ✅
- [ ] No console warnings or errors
- [ ] Tests for repositories (optional but recommended)

---

## CRITICAL INSTRUCTIONS FOR ANTIGRAVITY

**Remember the Backend Technical Rules (in backend-rules.md)**:

1. **COMPLETENESS OVER PERFECTION**: Every function is complete, no TODOs
2. **CORRECTNESS OVER CLEVERNESS**: Code is clear, obvious, auditable
3. **SAFETY OVER SPEED**: Transactions, constraints, proper error handling
4. **OBSERVABILITY OVER ASSUMPTIONS**: Log everything important
5. **SECURITY BY DESIGN**: Input validation, secret management, rate limiting ready

**Code Quality Non-Negotiables**:

- ✅ Strict TypeScript (`strict: true`)
- ✅ No `any` types - ever
- ✅ Every function has JSDoc comment
- ✅ Every error is caught and logged
- ✅ Every async operation has timeout
- ✅ Every database query is indexed
- ✅ Every mutation is in a transaction
- ✅ Every sensitive data is never logged

**Before finishing, verify**:

1. `npx prisma generate` produces no errors
2. `npm run type-check` passes
3. `npm run lint` passes (if ESLint configured)
4. Seed script runs successfully: `npm run seed`
5. All types are exported from `src/types/index.ts`
6. All repositories are exported from `src/repositories/index.ts`
7. Database schema matches Prisma schema exactly
8. README.md has clear setup instructions

---

## SUCCESS SIGNAL

When complete, you should be able to:

```bash
# Setup
npm install
npm run db:setup  # Creates database + runs migrations
npm run seed      # Populates test data

# Verify
npm run type-check  # No TS errors
npm run lint        # No lint errors

# Database is ready for Part 2 (API & Services)
```

---

**Next**: Part 2 will build the REST API handlers and service layer on top of this foundation.
