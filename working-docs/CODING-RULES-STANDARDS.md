# 🔧 ENTERPRISE CODING RULES & STANDARDS
## Mandatory Guidelines for DriftSentry Development (All Phases)

**Last Updated**: December 14, 2025  
**Applies To**: All team members, all phases, backend & frontend  
**Enforcement**: Code review mandatory, violations block PR merge

---

## 📋 TABLE OF CONTENTS

1. [Core Principles](#core-principles)
2. [Code Quality Standards](#code-quality-standards)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Error Handling](#error-handling)
5. [Security Requirements](#security-requirements)
6. [Performance Standards](#performance-standards)
7. [Testing Requirements](#testing-requirements)
8. [Git & Version Control](#git--version-control)
9. [Documentation Requirements](#documentation-requirements)
10. [Code Review Checklist](#code-review-checklist)

---

## 🎯 CORE PRINCIPLES

### Principle 1: Simplicity Over Complexity
- **Rule**: Always choose the simplest solution that solves the problem
- **Anti-pattern**: Over-engineering, premature optimization, unnecessary abstraction
- **Example**:
  ```javascript
  // ✅ GOOD - Simple and clear
  const isActive = user.status === 'active';
  
  // ❌ BAD - Over-engineered
  const isActive = Object.entries(user).reduce((acc, [key, val]) => {
    return key === 'status' ? val === 'active' : acc;
  }, false);
  ```

### Principle 2: DRY (Don't Repeat Yourself)
- **Rule**: Never write the same logic twice. Extract to reusable function/service
- **Enforcement**: Code review will reject duplicated logic
- **Example**:
  ```javascript
  // ❌ BAD - Duplicated validation logic
  if (!email.includes('@')) throw new Error('Invalid email');
  // ... 10 lines later ...
  if (!email.includes('@')) throw new Error('Invalid email');
  
  // ✅ GOOD - Extracted to utility
  function validateEmail(email) {
    if (!email.includes('@')) throw new Error('Invalid email');
  }
  validateEmail(newUserEmail);
  validateEmail(updateEmail);
  ```

### Principle 3: Code Organization
- **Rule**: Keep files under 300 lines. Refactor if larger.
- **Enforcement**: Automatic file size check in CI
- **Structure**:
  ```
  backend/src/
  ├── routes/          (express routes, 50-100 lines each)
  ├── services/        (business logic, <300 lines each)
  ├── repositories/    (data access, <200 lines each)
  ├── middleware/      (express middleware, <100 lines each)
  ├── types/           (TypeScript interfaces, <50 lines each)
  ├── utils/           (helpers, <100 lines each)
  └── index.ts         (main file)
  ```

### Principle 4: Environment Awareness
- **Rule**: Code must work in dev, test, AND prod environments
- **Enforcement**: Environment variables, feature flags, conditional logic
- **Example**:
  ```javascript
  // ✅ GOOD - Environment-aware
  const dbUrl = process.env.DATABASE_URL;
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isCors = !process.env.NODE_ENV?.includes('prod');
  
  // ❌ BAD - Hardcoded values
  const dbUrl = 'postgresql://localhost:5432/clouddrift';
  const logLevel = 'debug'; // Always debug!
  const isCors = true;      // Always enabled!
  ```

### Principle 5: Careful Changes
- **Rule**: Only make changes directly requested or well-understood
- **Enforcement**: PR description must explain every change
- **Forbidden**: "Drive-by refactoring" - changing unrelated code in same PR

---

## 💎 CODE QUALITY STANDARDS

### Standard 1: Naming Conventions

**Variables & Functions**:
- ✅ Descriptive names (camelCase for variables/functions)
- ✅ Boolean variables prefixed with `is` or `has` or `should`
- ✅ Avoid single-letter variables (except `i`, `j` in loops)

```typescript
// ✅ GOOD
const isEmailValid = validateEmail(email);
const hasActiveSubscription = user.status === 'active';
const shouldSendNotification = !user.quietMode && hasAlert;

// ❌ BAD
const valid = validateEmail(email);
const s = true;
const n = canSendNotification();
```

**Classes & Types**:
- ✅ PascalCase for classes and interfaces
- ✅ Descriptive names, no abbreviations

```typescript
// ✅ GOOD
interface DriftTimelineEntry { }
class AuditLogService { }

// ❌ BAD
interface DTE { }
class ALS { }
```

**Constants**:
- ✅ UPPER_SNAKE_CASE for constants
- ✅ Grouped logically

```typescript
// ✅ GOOD
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const RATE_LIMIT_WINDOW = 60; // seconds

// ❌ BAD
const maxRetry = 3;
const timeout = 5000;
const w = 60;
```

### Standard 2: Function Design

**Size & Responsibility**:
- ✅ Single Responsibility Principle - one thing per function
- ✅ Max 20-30 lines per function (excluding comments)
- ✅ Max 3 parameters (use object destructuring for more)

```typescript
// ✅ GOOD - Single responsibility, clear inputs
function calculateDriftCost(drift: Drift, hourlyRate: number): number {
  return drift.estimatedHours * hourlyRate;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ❌ BAD - Too many responsibilities
function processDriftAndCalculateAndFormatCostAndLogAnalytics(
  drift, hourlyRate, timezone, userId, timestamp, logger
) {
  // 50+ lines doing everything
}
```

**Parameter Handling**:
```typescript
// ✅ GOOD - Object destructuring for multiple params
interface CreateDriftRequest {
  resourceId: string;
  expectedState: Record<string, unknown>;
  actualState: Record<string, unknown>;
  severity: 'critical' | 'warning' | 'info';
}

async function createDrift({ 
  resourceId, expectedState, actualState, severity 
}: CreateDriftRequest): Promise<Drift> {
  // logic
}

// ❌ BAD - Too many parameters
async function createDrift(
  resourceId: string,
  expectedState: any,
  actualState: any,
  severity: string,
  tags?: Record<string, string>,
  notes?: string,
  userId?: string
) { }
```

### Standard 3: Type Safety

**TypeScript Enforcement**:
- ✅ `strict: true` in tsconfig (no implicit any)
- ✅ Explicit return types on all functions
- ✅ No `any` type (use `unknown` if needed)
- ✅ Null/undefined handling with optional chaining

```typescript
// ✅ GOOD - Explicit types, safe
function getUserName(user: User | null): string {
  return user?.name ?? 'Anonymous';
}

async function saveDrift(drift: Drift): Promise<Drift> {
  return await db.drift.create(drift);
}

// ❌ BAD - Implicit any, no return type
function getUserName(user) {
  return user.name || 'Anonymous';
}

async function saveDrift(drift) {
  return db.drift.create(drift);
}
```

### Standard 4: Comments & Documentation

**Rule**: Code should be self-documenting. Comments explain WHY, not WHAT.

```typescript
// ✅ GOOD - Explains business logic
// We retry 3 times because AWS Config API has eventual consistency delays
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ✅ GOOD - JSDoc for public functions
/**
 * Calculates the cost impact of a drift in dollars
 * @param drift - The drift to analyze
 * @param hourlyRate - Cost per hour in cents
 * @returns Total cost impact in cents
 * @throws {Error} If hourlyRate is negative
 */
export function calculateCostImpact(drift: Drift, hourlyRate: number): number {
  return drift.estimatedHours * hourlyRate;
}

// ❌ BAD - Obvious comments
const x = 5; // Set x to 5
const isValid = validateEmail(email); // Validate email

// ❌ BAD - No documentation
export function calculateCostImpact(drift, hourlyRate) {
  return drift.estimatedHours * hourlyRate;
}
```

### Standard 5: File Organization

**Rule**: Each file has one clear responsibility. Structure consistently.

```typescript
// ✅ GOOD - Clear structure
// src/services/drift.service.ts

import { Drift, DriftStatus } from '@/types/drift';
import { driftRepository } from '@/repositories/drift.repository';
import { auditService } from './audit.service';

/**
 * Service for managing drifts
 */
export class DriftService {
  /**
   * Get drift by ID
   */
  async getDrift(id: string): Promise<Drift | null> {
    return await driftRepository.findById(id);
  }

  /**
   * Approve a drift for remediation
   */
  async approveDrift(id: string, userId: string): Promise<Drift> {
    const drift = await this.getDrift(id);
    if (!drift) throw new Error('Drift not found');
    
    drift.status = 'approved';
    const updated = await driftRepository.update(id, drift);
    await auditService.log(id, 'approved', userId);
    
    return updated;
  }
}

export const driftService = new DriftService();
```

---

## 🏗️ ARCHITECTURE & DESIGN PATTERNS

### Pattern 1: Service Layer Architecture

**Rule**: Business logic lives in services, not routes or controllers.

```typescript
// ❌ BAD - Logic in route handler
app.post('/drifts/:id/approve', async (req, res) => {
  const drift = await db.drift.findById(req.params.id);
  if (!drift) return res.status(404).json({ error: 'Not found' });
  
  drift.status = 'approved';
  drift.approvedAt = new Date();
  drift.approvedBy = req.user.id;
  
  await db.drift.update(drift);
  await db.auditLog.create({...});
  
  // More logic...
  res.json(drift);
});

// ✅ GOOD - Logic in service
// src/services/drift.service.ts
async approveDrift(id: string, userId: string): Promise<Drift> {
  const drift = await driftRepository.findById(id);
  if (!drift) throw new NotFoundError('Drift not found');
  
  drift.status = 'approved';
  drift.approvedAt = new Date();
  drift.approvedBy = userId;
  
  const updated = await driftRepository.update(id, drift);
  await auditService.log(id, 'approved', userId);
  
  return updated;
}

// src/routes/drift.routes.ts
router.post('/:id/approve', authMiddleware, async (req, res, next) => {
  try {
    const drift = await driftService.approveDrift(req.params.id, req.user.id);
    res.json(drift);
  } catch (error) {
    next(error);
  }
});
```

### Pattern 2: Repository Pattern (Data Access)

**Rule**: All database queries go through repositories, not directly in services.

```typescript
// ✅ GOOD - Repository abstraction
interface IDriftRepository {
  findById(id: string): Promise<Drift | null>;
  findByAccountId(accountId: string): Promise<Drift[]>;
  update(id: string, drift: Drift): Promise<Drift>;
  delete(id: string): Promise<void>;
}

export class DriftRepository implements IDriftRepository {
  async findById(id: string): Promise<Drift | null> {
    return await prisma.drift.findUnique({ where: { id } });
  }

  async findByAccountId(accountId: string): Promise<Drift[]> {
    return await prisma.drift.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
  // ... more methods
}

// Service uses repository, not database directly
class DriftService {
  constructor(private repo: IDriftRepository) {}
  
  async getDrift(id: string) {
    return await this.repo.findById(id);
  }
}
```

### Pattern 3: Dependency Injection

**Rule**: Inject dependencies, don't create them inside functions.

```typescript
// ❌ BAD - Creates dependencies internally
class DriftService {
  async approveDrift(id: string) {
    const db = new Database(); // Creates new instance each time!
    const logger = new Logger(); // Creates new instance!
    
    const drift = await db.drift.findById(id);
    logger.info('Drift approved');
  }
}

// ✅ GOOD - Dependencies injected
class DriftService {
  constructor(
    private db: Database,
    private logger: Logger,
    private auditService: AuditService
  ) {}
  
  async approveDrift(id: string) {
    const drift = await this.db.drift.findById(id);
    await this.auditService.log(id, 'approved');
    this.logger.info('Drift approved');
  }
}

// Usage
const db = new Database();
const logger = new Logger();
const auditService = new AuditService();
const driftService = new DriftService(db, logger, auditService);
```

---

## 🚨 ERROR HANDLING

### Rule 1: Never Swallow Errors Silently

```typescript
// ❌ BAD - Silent failure
try {
  await sendNotification(user.email);
} catch (error) {
  // Silently ignored - user never knows
}

// ✅ GOOD - Log and handle explicitly
try {
  await sendNotification(user.email);
} catch (error) {
  logger.error('Failed to send notification', { 
    userId: user.id, 
    error: error.message 
  });
  // Still allows app to continue if notification fails
}

// ✅ EVEN BETTER - Throw on critical errors
try {
  const result = await criticalDatabaseOperation();
} catch (error) {
  logger.error('Critical database operation failed', error);
  throw new DatabaseError('Operation failed', error);
}
```

### Rule 2: Use Typed Error Classes

```typescript
// ✅ GOOD - Custom error classes
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

// Usage in service
async function approveDrift(id: string, userId: string) {
  const drift = await driftRepository.findById(id);
  if (!drift) throw new NotFoundError('Drift', id);
  
  const user = await userRepository.findById(userId);
  if (!user) throw new UnauthorizedError();
  
  if (!user.roles.includes('admin')) {
    throw new ForbiddenError('Only admins can approve drifts');
  }
}
```

### Rule 3: Global Error Handler (Backend)

```typescript
// ✅ GOOD - Centralized error handling
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  
  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack,
    path: req.path 
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: error.name,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});
```

### Rule 4: Frontend Error Boundaries

```typescript
// ✅ GOOD - React Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>Please refresh the page or contact support</p>
          <button onClick={() => window.location.href = '/'}>
            Go Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🔐 SECURITY REQUIREMENTS

### Requirement 1: Never Commit Secrets

```typescript
// ❌ BAD - Secrets in code
const DATABASE_URL = 'postgresql://admin:password123@localhost:5432/db';
const JWT_SECRET = 'my-super-secret-key-1234';
const API_KEY = 'sk_live_abc123xyz789';

// ✅ GOOD - Environment variables only
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const API_KEY = process.env.API_KEY;

// .env (local dev only, not committed)
DATABASE_URL=postgresql://admin:dev-password@localhost:5432/clouddrift
JWT_SECRET=dev-secret-change-in-production
API_KEY=sk_test_dev_key

// .env.example (safe to commit, shows structure)
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=your-secret-here
API_KEY=your-api-key-here
```

### Requirement 2: Input Validation

```typescript
// ❌ BAD - No validation
router.post('/users', async (req, res) => {
  const user = await User.create(req.body);
  res.json(user);
});

// ✅ GOOD - Zod validation
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name required').max(100),
  password: z.string().min(8, 'Password must be 8+ chars'),
  role: z.enum(['admin', 'engineer', 'viewer']),
});

router.post('/users', async (req, res, next) => {
  try {
    const validated = CreateUserSchema.parse(req.body);
    const user = await userService.createUser(validated);
    res.json(user);
  } catch (error) {
    next(error); // Validation error handler
  }
});
```

### Requirement 3: API Authentication & Authorization

```typescript
// ✅ GOOD - Auth middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage on protected routes
router.post('/drifts/:id/approve', authMiddleware, async (req, res) => {
  // Protected endpoint
});
```

### Requirement 4: Data Encryption

```typescript
// ✅ GOOD - Hash sensitive data (like API keys)
import bcrypt from 'bcrypt';

async function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(key, 10);
  
  // Store hash in database
  await User.update({ apiKeyHash: hash });
  
  // Return key once (user must save it)
  return `sk_${key}`;
}

// Verify API key on request
async function verifyApiKey(providedKey: string, storedHash: string) {
  return await bcrypt.compare(providedKey, storedHash);
}
```

---

## ⚡ PERFORMANCE STANDARDS

### Standard 1: Database Query Optimization

```typescript
// ❌ BAD - N+1 queries
const drifts = await db.drift.findMany({ where: { accountId } });
for (const drift of drifts) {
  const user = await db.user.findUnique({ where: { id: drift.userId } });
  drift.userName = user.name; // 1 + n queries!
}

// ✅ GOOD - Join relationships
const drifts = await db.drift.findMany({
  where: { accountId },
  include: { user: true }, // Single query with join
});

// Or use query builder
const drifts = await db.drift.findMany({
  where: { accountId },
  select: {
    id: true,
    status: true,
    user: { select: { id: true, name: true } }
  }
});
```

### Standard 2: Caching Strategy

```typescript
// ✅ GOOD - Cache frequently accessed data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);
const CACHE_TTL = 5 * 60; // 5 minutes

async function getMetrics(accountId: string) {
  const cacheKey = `metrics:${accountId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Compute if not cached
  const metrics = await computeMetrics(accountId);
  
  // Store in cache
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
  
  return metrics;
}

// Invalidate cache on changes
async function approveDrift(id: string) {
  const drift = await driftService.approveDrift(id);
  
  // Invalidate related caches
  await redis.del(`metrics:${drift.accountId}`);
  await redis.del(`drifts:${drift.accountId}`);
  
  return drift;
}
```

### Standard 3: API Response Time Targets

| Endpoint | Target | Acceptable |
|----------|--------|------------|
| GET /metrics | <500ms | <1s |
| GET /drifts | <800ms | <2s |
| POST /drifts/:id/approve | <1s | <2s |
| Dashboard (full load) | <2s | <3s |

If endpoints exceed targets, profile and optimize before merge.

---

## 🧪 TESTING REQUIREMENTS

### Requirement 1: Unit Tests for Services

```typescript
// ✅ GOOD - Service unit test
import { DriftService } from '@/services/drift.service';
import { Mock } from 'jest';

describe('DriftService', () => {
  let service: DriftService;
  let mockRepository: Mock;
  let mockAuditService: Mock;

  beforeEach(() => {
    mockRepository = jest.fn();
    mockAuditService = jest.fn();
    service = new DriftService(mockRepository, mockAuditService);
  });

  describe('approveDrift', () => {
    it('should approve a drift and log audit', async () => {
      const drift = { id: '123', status: 'detected' };
      mockRepository.findById.mockResolvedValue(drift);
      mockRepository.update.mockResolvedValue({ ...drift, status: 'approved' });

      const result = await service.approveDrift('123', 'user-1');

      expect(result.status).toBe('approved');
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError if drift not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.approveDrift('invalid', 'user-1'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

### Requirement 2: Integration Tests (Critical Paths)

```typescript
// ✅ GOOD - E2E integration test
describe('Login Flow', () => {
  it('should login user and persist session', async () => {
    // 1. Register user
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(registerRes.status).toBe(201);

    // 2. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // 3. Use token to access protected endpoint
    const token = loginRes.body.token;
    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('test@example.com');
  });
});
```

### Requirement 3: Frontend Component Tests

```typescript
// ✅ GOOD - React component test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DriftApprovalButton } from '@/components/DriftApprovalButton';

describe('DriftApprovalButton', () => {
  it('should show loading state while approving', async () => {
    const onApprove = jest.fn();
    render(<DriftApprovalButton driftId="123" onApprove={onApprove} />);

    const button = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    const onApprove = jest.fn().mockRejectedValue(new Error('Approval failed'));
    render(<DriftApprovalButton driftId="123" onApprove={onApprove} />);

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(() => {
      expect(screen.getByText(/approval failed/i)).toBeInTheDocument();
    });
  });
});
```

---

## 📝 GIT & VERSION CONTROL

### Rule 1: Conventional Commits

All commits must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Valid types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring (no behavior change)
- `perf` - Performance improvement
- `test` - Adding/modifying tests
- `chore` - Build process, dependencies, etc.
- `ci` - CI/CD changes
- `style` - Code style (formatting, semicolons, etc.)

**Examples**:
```
feat(auth): add JWT token refresh endpoint

Implement automatic token refresh when token is about to expire.
This prevents users from being logged out unexpectedly.

Closes #123
```

```
fix(drift): handle null state in timeline
```

```
refactor(api): extract validation logic to Zod schemas
```

### Rule 2: PR Requirements

Every PR must have:

1. **Clear title** (conventional commit format)
2. **Description**:
   - What changed and why
   - Related issue number (#123)
   - Manual test steps
3. **No merge conflicts**
4. **All CI checks passing**
5. **Code review approval** (at least 1)

**Example PR description**:
```markdown
## Description
Implement API key security with bcrypt hashing instead of plaintext storage.

## Changes
- Add bcrypt package to package.json
- Create hash-based API key storage in User model
- Implement generateApiKey() service method
- Add verifyApiKey() authentication middleware
- Update API key regeneration endpoint

## Testing
```bash
curl -X POST http://localhost:3002/api/v1/users/me/api-key/regenerate \
  -H "Authorization: Bearer <token>"
```

Expected response: `{ success: true, data: { apiKey: "sk_xxxx...xxxx" } }`

## Related
Closes #456
```

### Rule 3: Branch Naming

```
feature/auth-jwt-refresh
feature/multi-tenancy-account-model
fix/drift-timeline-null-error
docs/aws-setup-guide
refactor/error-handling
```

### Rule 4: Commit Size

- ✅ 1 logical change per commit
- ✅ Commits <= 400 lines changed (per commit)
- ✅ Small, reviewable commits
- ❌ Don't squash unrelated changes into 1 commit
- ❌ Don't make 100-line commits

---

## 📚 DOCUMENTATION REQUIREMENTS

### Requirement 1: Code Documentation

Every module needs:
- **File comment** - What does this file do?
- **Function documentation** - JSDoc for public functions
- **Complex logic comments** - Explain WHY

```typescript
/**
 * User authentication and session management
 * Handles login, logout, token refresh, and session validation
 */

import jwt from 'jsonwebtoken';

/**
 * Generate a JWT access token for a user
 * @param userId - The user's ID
 * @param expiresIn - Token expiry time (default: 15 minutes)
 * @returns JWT token string
 * @throws {Error} If userId is invalid
 */
export function generateAccessToken(
  userId: string,
  expiresIn = '15m'
): string {
  if (!userId) throw new Error('userId required');
  
  return jwt.sign(
    { sub: userId }, // subject = userId
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}
```

### Requirement 2: README Files

Each major component needs a README:

```markdown
# Drift Service

## Overview
Service for managing infrastructure drifts, including detection, approval, and remediation.

## Key Functions
- `getDrift(id)` - Retrieve a drift by ID
- `approveDrift(id, userId)` - Approve drift for remediation
- `rejectDrift(id, reason)` - Reject a drift

## Usage
\`\`\`typescript
const driftService = new DriftService(repository, auditService);
const drift = await driftService.getDrift('drift-123');
await driftService.approveDrift('drift-123', 'user-456');
\`\`\`

## Testing
\`\`\`bash
npm run test -- src/services/drift.service.test.ts
\`\`\`

## Error Handling
Throws `NotFoundError` (404) if drift doesn't exist.
Throws `ForbiddenError` (403) if user doesn't have permission.
```

### Requirement 3: API Documentation (OpenAPI/Swagger)

Document all endpoints:

```typescript
/**
 * @route POST /api/v1/drifts/:id/approve
 * @authentication Bearer token (JWT)
 * @param {string} id - Drift ID (path parameter)
 * @param {ApproveDriftRequest} req.body - Request body
 * @returns {DriftResponse} 200 - Approved drift
 * @returns {ErrorResponse} 404 - Drift not found
 * @returns {ErrorResponse} 401 - Unauthorized
 * @returns {ErrorResponse} 403 - Forbidden (not admin)
 */
```

---

## ✅ CODE REVIEW CHECKLIST

Every PR must pass this checklist:

```
FUNCTIONALITY:
  ☐ Code does what PR description says
  ☐ Acceptance criteria met
  ☐ No unrelated changes
  ☐ Tests passing (100%)
  ☐ CI checks green

CODE QUALITY:
  ☐ No duplicate code (DRY principle)
  ☐ Functions < 30 lines
  ☐ Files < 300 lines
  ☐ Naming is clear and descriptive
  ☐ Single Responsibility Principle followed
  ☐ No hardcoded values
  ☐ No console.log() (except logger.*)

SECURITY:
  ☐ No secrets in code
  ☐ Input validation present
  ☐ SQL injection protection
  ☐ XSS protection (frontend)
  ☐ Auth checks on protected endpoints
  ☐ CORS properly configured

PERFORMANCE:
  ☐ No N+1 queries
  ☐ Caching used where appropriate
  ☐ Response times meet targets
  ☐ No infinite loops or memory leaks

ERROR HANDLING:
  ☐ No silent failures
  ☐ Proper HTTP status codes
  ☐ User-friendly error messages
  ☐ Errors logged with context

TESTING:
  ☐ Unit tests for logic
  ☐ Integration tests for flow
  ☐ Manual tests documented
  ☐ Edge cases handled

DOCUMENTATION:
  ☐ Functions documented (JSDoc)
  ☐ Complex logic explained
  ☐ README updated if needed
  ☐ API changes documented

GIT:
  ☐ Commits use conventional format
  ☐ Commit messages clear
  ☐ Logical commit grouping
  ☐ No merge conflicts
  ☐ Rebased on latest develop

STATUS:
  ☐ Ready to merge
```

---

## 🚀 ENFORCEMENT

### What Blocks PR Merge
- ❌ Failing tests
- ❌ Security issues
- ❌ Duplicate code
- ❌ Files > 300 lines
- ❌ Secrets in code
- ❌ Invalid commit messages
- ❌ Hardcoded environment values
- ❌ Missing documentation

### What Requires Changes (Requested)
- ⚠️ Performance below targets
- ⚠️ Insufficient test coverage
- ⚠️ Unclear variable names
- ⚠️ Missing error handling

### What Can Be Approved (Minor)
- ✅ Style improvements (with approval)
- ✅ Additional comments
- ✅ README enhancements

---

## 📞 QUESTIONS?

Before you start coding, ask:

1. **Architecture**: "Is this pattern consistent with codebase?"
2. **Scope**: "Does this change stay focused?"
3. **Testing**: "How should this be tested?"
4. **Performance**: "Will this meet response time targets?"
5. **Security**: "Have I considered security implications?"

**Better to ask before coding than refactor after!**

---

## 🎓 RESOURCES

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **Clean Code**: "Clean Code" by Robert C. Martin
- **Design Patterns**: "Head First Design Patterns"
- **Testing**: Jest Documentation (https://jestjs.io/)

---

**Remember**: Clean code is maintainable code. Maintainable code is profitable code. 💰

Every rule here exists because it saves time and money in the long run.

**Make your commits perfect. Your future self will thank you.** 🚀

