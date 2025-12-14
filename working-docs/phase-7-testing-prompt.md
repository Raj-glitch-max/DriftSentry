# 🧪 PHASE 7: COMPREHENSIVE TESTING & QUALITY ASSURANCE
## Complete Detailed Prompt for Cursor/Claude/Google Antigravity

---

## 📋 MASTER CONTEXT - READ THIS FIRST

**Project**: CloudDrift Guardian (DriftSentry)  
**Current State**: Backend (100% done) + Frontend (100% done)  
**Phase**: 7 of 12 (Testing & Quality)  
**Duration**: 10 days (concurrent work possible)  
**Goal**: 95%+ code coverage, 100% test pass rate, zero vulnerabilities  

**What You're Testing**:
- ✅ Backend: Express.js REST API (9 endpoints)
- ✅ Frontend: React 18 + TypeScript UI (5 pages)
- ✅ Integration: API calls + WebSocket real-time
- ✅ Performance: Lighthouse > 90, API < 500ms p99
- ✅ Security: OWASP top 10, no vulnerabilities

---

## ⚙️ TESTING ARCHITECTURE OVERVIEW

```
Test Pyramid:
           ▲
          /\
         /  \  E2E Tests (10% - User workflows)
        /    \
       /______\
      /        \  Integration Tests (30% - API + WebSocket)
     /          \
    /____________\
   /              \  Unit Tests (60% - Components, Services)
  /                \
 /_________________ \

Total Tests: 200+
├─ Unit Tests: 120+
├─ Integration Tests: 50+
└─ E2E Tests: 30+

Test Execution Time: < 30 minutes (total)
Code Coverage Target: 95%+
```

---

## 📂 FOLDER STRUCTURE FOR TESTS

### **Backend Tests Structure**
```
backend/
├── src/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   └── utils/
├── tests/                    # NEW
│   ├── unit/
│   │   ├── services/         # Service layer tests
│   │   │   ├── auth.service.test.ts
│   │   │   ├── drift.service.test.ts
│   │   │   ├── alert.service.test.ts
│   │   │   └── cost.service.test.ts
│   │   ├── repositories/     # Data access tests
│   │   │   ├── drift.repository.test.ts
│   │   │   ├── user.repository.test.ts
│   │   │   └── alert.repository.test.ts
│   │   ├── utils/            # Utility function tests
│   │   │   ├── validators.test.ts
│   │   │   ├── formatters.test.ts
│   │   │   └── helpers.test.ts
│   │   └── middleware/       # Middleware tests
│   │       ├── auth.middleware.test.ts
│   │       ├── error.middleware.test.ts
│   │       └── logger.middleware.test.ts
│   ├── integration/
│   │   ├── auth.routes.test.ts       # Login, refresh, logout
│   │   ├── drifts.routes.test.ts     # Get, approve, reject
│   │   ├── alerts.routes.test.ts     # Get, mark-read
│   │   ├── metrics.routes.test.ts    # Summary, cost-trend
│   │   ├── health.routes.test.ts     # Health checks
│   │   ├── websocket.integration.test.ts
│   │   └── error-handling.test.ts    # Error scenarios
│   ├── fixtures/             # Test data
│   │   ├── users.fixture.ts
│   │   ├── drifts.fixture.ts
│   │   ├── alerts.fixture.ts
│   │   └── tokens.fixture.ts
│   ├── setup.ts              # Test configuration
│   └── teardown.ts           # Cleanup after tests
├── jest.config.js            # Jest configuration
└── .env.test                 # Test environment variables
```

### **Frontend Tests Structure**
```
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
├── tests/                    # NEW
│   ├── unit/
│   │   ├── components/       # Component tests
│   │   │   ├── LoginPage.test.tsx
│   │   │   ├── DashboardPage.test.tsx
│   │   │   ├── DriftsList.test.tsx
│   │   │   ├── DriftDetail.test.tsx
│   │   │   ├── AlertsList.test.tsx
│   │   │   ├── Header.test.tsx
│   │   │   ├── Sidebar.test.tsx
│   │   │   └── Button.test.tsx (base components)
│   │   ├── hooks/            # Hook tests
│   │   │   ├── useDrifts.test.ts
│   │   │   ├── useAuth.test.ts
│   │   │   ├── useAlerts.test.ts
│   │   │   ├── useCostTrend.test.ts
│   │   │   └── useWebSocket.test.ts
│   │   ├── services/         # Service tests
│   │   │   ├── api.test.ts
│   │   │   ├── auth.test.ts
│   │   │   └── websocket.test.ts
│   │   └── utils/            # Utility tests
│   │       ├── formatters.test.ts
│   │       ├── validators.test.ts
│   │       └── storage.test.ts
│   ├── integration/
│   │   ├── login-flow.test.tsx      # Full login flow
│   │   ├── dashboard.test.tsx        # Dashboard data loading
│   │   ├── drift-approval.test.tsx   # Drift approval workflow
│   │   ├── real-time.test.tsx        # WebSocket real-time
│   │   └── error-handling.test.tsx   # Error scenarios
│   ├── e2e/                  # End-to-End tests (Playwright)
│   │   ├── login.spec.ts
│   │   ├── dashboard.spec.ts
│   │   ├── drifts.spec.ts
│   │   ├── alerts.spec.ts
│   │   ├── real-time.spec.ts
│   │   └── performance.spec.ts
│   ├── fixtures/             # Test data
│   │   ├── auth.fixture.ts
│   │   ├── drifts.fixture.ts
│   │   └── api-responses.fixture.ts
│   ├── setup.ts              # Test configuration
│   └── teardown.ts           # Cleanup
├── vitest.config.ts          # Vitest configuration
├── playwright.config.ts      # Playwright configuration
└── .env.test                 # Test environment
```

---

## 🧪 DETAILED TEST SPECIFICATIONS

### **PART 1: BACKEND UNIT TESTS**

#### **1.1 Auth Service Tests** (auth.service.test.ts)
```typescript
describe('AuthService', () => {
  describe('login()', () => {
    // TEST CASE 1: Valid credentials
    it('should return tokens for valid email and password', async () => {
      // Input: { email: 'admin@driftsentry.local', password: 'admin123' }
      // Expected: { accessToken, refreshToken, user: { id, email, role } }
      // Verify: tokens are JWT format, role is one of [admin, engineer, viewer]
    });

    // TEST CASE 2: Invalid email
    it('should throw error for non-existent email', async () => {
      // Input: { email: 'nonexistent@driftsentry.local', password: 'admin123' }
      // Expected: throw ValidationError('Email not found')
      // Verify: error message is user-friendly, not leaking info
    });

    // TEST CASE 3: Invalid password
    it('should throw error for wrong password', async () => {
      // Input: { email: 'admin@driftsentry.local', password: 'wrongpass' }
      // Expected: throw ValidationError('Invalid password')
      // Verify: password never logged, comparison is time-constant
    });

    // TEST CASE 4: Empty fields
    it('should validate required fields', async () => {
      // Input: { email: '', password: '' }
      // Expected: throw ValidationError('Email is required')
      // Verify: validation happens before DB query
    });
  });

  describe('refreshToken()', () => {
    // TEST CASE 5: Valid refresh token
    it('should issue new access token for valid refresh token', async () => {
      // Input: { refreshToken: 'valid-7day-token' }
      // Expected: { accessToken: 'new-15min-token', refreshToken: 'same-token' }
      // Verify: new token has fresh expiry, old refresh token still valid
    });

    // TEST CASE 6: Expired refresh token
    it('should reject expired refresh token', async () => {
      // Input: { refreshToken: 'expired-token' }
      // Expected: throw AuthError('Refresh token expired')
      // Verify: user must re-login
    });

    // TEST CASE 7: Invalid signature
    it('should reject tampered refresh token', async () => {
      // Input: { refreshToken: 'valid-token-with-modified-signature' }
      // Expected: throw AuthError('Invalid token signature')
      // Verify: token integrity checked via JWT verify
    });
  });

  describe('logout()', () => {
    // TEST CASE 8: Valid logout
    it('should invalidate token on logout', async () => {
      // Input: { userId: 'user-123' }
      // Expected: { success: true }
      // Verify: token blacklist updated (if using), or just return success
      // Side effect: stored tokens should be deleted on frontend
    });
  });

  describe('password hashing', () => {
    // TEST CASE 9: Password hashed with bcrypt
    it('should hash password with bcrypt (salt rounds: 12)', async () => {
      // Input: password = 'admin123'
      // Expected: hashed password starts with '$2b$12$' (bcrypt format)
      // Verify: plain password never stored, can't reverse hash
    });

    // TEST CASE 10: Different salts produce different hashes
    it('should produce different hashes for same password', async () => {
      // Input: password = 'admin123' (called twice)
      // Expected: hash1 !== hash2 (both correct due to salt)
      // Verify: rainbow table attacks prevented
    });
  });
});
```

#### **1.2 Drift Service Tests** (drift.service.test.ts)
```typescript
describe('DriftService', () => {
  describe('getDrifts()', () => {
    // TEST CASE 11: Get all drifts with pagination
    it('should return paginated drifts with correct metadata', async () => {
      // Input: { page: 1, limit: 10, status: 'PENDING' }
      // Expected: {
      //   data: [drift1, drift2, ...],
      //   pagination: { page: 1, limit: 10, total: 47, totalPages: 5 }
      // }
      // Verify: only PENDING drifts returned, count matches
    });

    // TEST CASE 12: Filter by severity
    it('should filter drifts by severity', async () => {
      // Input: { severity: 'CRITICAL' }
      // Expected: only drifts with severity=CRITICAL
      // Verify: SQL query has WHERE severity = 'CRITICAL'
    });

    // TEST CASE 13: Sort by date descending
    it('should sort drifts by detectedAt descending', async () => {
      // Input: { sortBy: 'detectedAt', order: 'DESC' }
      // Expected: drifts ordered newest first
      // Verify: first drift.detectedAt > second drift.detectedAt
    });

    // TEST CASE 14: Empty result
    it('should return empty array when no drifts match filters', async () => {
      // Input: { status: 'REJECTED', severity: 'CRITICAL' }
      // Expected: { data: [], pagination: { total: 0, totalPages: 0 } }
      // Verify: no error thrown, empty array returned
    });
  });

  describe('approveDrift()', () => {
    // TEST CASE 15: Approve drift
    it('should update drift status to APPROVED', async () => {
      // Input: { driftId: 'drift-123', approvedBy: 'user-456' }
      // Expected: {
      //   id: 'drift-123',
      //   status: 'APPROVED',
      //   approvedAt: timestamp,
      //   approvedBy: 'user-456'
      // }
      // Verify: database updated, event emitted via WebSocket
    });

    // TEST CASE 16: Cannot approve already-approved drift
    it('should reject approval of already-approved drift', async () => {
      // Input: { driftId: 'drift-already-approved' }
      // Expected: throw ConflictError('Drift already approved')
      // Verify: idempotency, no double-approval
    });

    // TEST CASE 17: Check authorization (only engineer+)
    it('should reject approval if user is viewer role', async () => {
      // Input: { driftId: 'drift-123', userId: 'viewer-user' }
      // Expected: throw ForbiddenError('Insufficient permissions')
      // Verify: RBAC enforced at service level
    });
  });

  describe('rejectDrift()', () => {
    // TEST CASE 18: Reject drift
    it('should update drift status to REJECTED', async () => {
      // Input: { driftId: 'drift-123', reason: 'Not applicable', rejectedBy: 'user-456' }
      // Expected: { status: 'REJECTED', reason: '...', rejectedAt: timestamp }
      // Verify: reason stored for audit trail
    });

    // TEST CASE 19: Reject with missing reason
    it('should require reason for rejection', async () => {
      // Input: { driftId: 'drift-123', rejectedBy: 'user-456' }
      // Expected: throw ValidationError('Reason is required')
      // Verify: validation catches before DB update
    });
  });

  describe('analyzeDriftCost()', () => {
    // TEST CASE 20: Calculate cost impact
    it('should calculate cost savings for resolved drift', async () => {
      // Input: { driftId: 'drift-123' }
      // Expected: { estimatedMonthlySaving: 700, confidence: 0.89 }
      // Verify: cost calculation based on drift type & resource
    });

    // TEST CASE 21: ML cost prediction
    it('should predict cost trend using Prophet/ARIMA', async () => {
      // Input: last 30 days of cost data
      // Expected: predicted cost for next 30 days
      // Verify: prediction within 20% accuracy
    });
  });
});
```

#### **1.3 Repository Tests** (drift.repository.test.ts)
```typescript
describe('DriftRepository', () => {
  describe('findById()', () => {
    // TEST CASE 22: Find drift by ID
    it('should return drift with all relations loaded', async () => {
      // Input: driftId = 'drift-123'
      // Expected: { id, resourceId, driftType, history: [...], alerts: [...] }
      // Verify: all related records included (history, alerts)
    });

    // TEST CASE 23: Non-existent drift
    it('should return null for non-existent drift', async () => {
      // Input: driftId = 'nonexistent-id'
      // Expected: null (not error)
      // Verify: service handles null gracefully
    });
  });

  describe('findByStatus()', () => {
    // TEST CASE 24: Query with pagination
    it('should return paginated results with total count', async () => {
      // Input: { status: 'PENDING', skip: 0, take: 10 }
      // Expected: { data: [...], count: 47 }
      // Verify: SQL LIMIT and OFFSET used correctly
    });

    // TEST CASE 25: Database query optimization
    it('should use index on status column', async () => {
      // Input: findByStatus('PENDING') called 100 times
      // Expected: consistent query time (< 100ms)
      // Verify: index exists on status column
    });
  });

  describe('create()', () => {
    // TEST CASE 26: Insert new drift
    it('should create drift with auto-generated ID', async () => {
      // Input: { resourceId: 'i-123', driftType: 'TAG_CHANGE', severity: 'HIGH' }
      // Expected: { id: 'uuid', resourceId: '...', createdAt: timestamp }
      // Verify: ID is unique UUID, createdAt set automatically
    });

    // TEST CASE 27: Unique constraint
    it('should prevent duplicate drifts for same resource', async () => {
      // Input: same drift created twice
      // Expected: second create throws UniqueConstraintError
      // Verify: database constraint enforced
    });
  });

  describe('update()', () => {
    // TEST CASE 28: Update drift status
    it('should update status and track update time', async () => {
      // Input: { id: 'drift-123', status: 'APPROVED', updatedBy: 'user-456' }
      // Expected: updatedAt = current timestamp
      // Verify: audit trail recorded
    });
  });

  describe('delete()', () => {
    // TEST CASE 29: Soft delete (if implemented)
    it('should mark drift as deleted without removing from DB', async () => {
      // Input: driftId = 'drift-123'
      // Expected: drift.deletedAt = timestamp
      // Verify: findById returns null, but data preserved
    });
  });
});
```

#### **1.4 Utility Function Tests** (validators.test.ts)
```typescript
describe('Validators', () => {
  describe('validateEmail()', () => {
    // TEST CASE 30-35: Email validation
    it('should validate correct email', () => {
      expect(validateEmail('admin@driftsentry.local')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(() => validateEmail('invalidemail')).toThrow();
    });

    it('should reject empty email', () => {
      expect(() => validateEmail('')).toThrow();
    });

    // More cases: special chars, unicode, etc.
  });

  describe('validateDriftInput()', () => {
    // TEST CASE 36-40: Drift input validation
    it('should validate required fields', () => {
      const input = {
        resourceId: 'i-123',
        driftType: 'TAG_CHANGE',
        severity: 'HIGH'
      };
      expect(validateDriftInput(input)).toBe(true);
    });

    it('should reject unknown drift type', () => {
      const input = { driftType: 'INVALID_TYPE' };
      expect(() => validateDriftInput(input)).toThrow('Unknown drift type');
    });

    it('should coerce severity to uppercase', () => {
      const input = { severity: 'high' };
      const result = validateDriftInput(input);
      expect(result.severity).toBe('HIGH');
    });
  });
});
```

---

### **PART 2: BACKEND INTEGRATION TESTS**

#### **2.1 Auth Routes Integration** (auth.routes.test.ts)
```typescript
describe('POST /api/v1/auth/login (Integration)', () => {
  // Setup: Start test server, clear database, insert test user

  // TEST CASE 41: Full login flow
  it('should login and return tokens', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'admin123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('role');
  });

  // TEST CASE 42: JWT validation
  it('should return valid JWT tokens', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'admin123' });

    const decoded = jwt.verify(response.body.accessToken, process.env.JWT_SECRET);
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('role');
    expect(decoded.role).toBe('admin');
  });

  // TEST CASE 43: Token expiry
  it('should issue 15-minute access token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'admin123' });

    const decoded = jwt.decode(response.body.accessToken);
    const expiresIn = decoded.exp - decoded.iat;
    expect(expiresIn).toBe(15 * 60); // 15 minutes in seconds
  });

  // TEST CASE 44: Bad request (no body)
  it('should return 400 for missing body', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  // TEST CASE 45: Invalid credentials
  it('should return 401 for invalid password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toContain('Invalid');
  });

  // TEST CASE 46: Rate limiting
  it('should rate limit failed login attempts', async () => {
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@driftsentry.local', password: 'wrong' });
    }

    // 6th attempt should be rate-limited
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'wrong' });

    expect(response.status).toBe(429); // Too Many Requests
  });
});

describe('POST /api/v1/auth/refresh (Integration)', () => {
  // TEST CASE 47: Refresh access token
  it('should issue new access token with valid refresh token', async () => {
    // 1. Login to get tokens
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'admin123' });

    // 2. Wait for access token to "expire" (in test, skip this)
    // 3. Refresh
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginResponse.body.refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toHaveProperty('accessToken');
    expect(refreshResponse.body.accessToken).not.toBe(loginResponse.body.accessToken);
  });

  // TEST CASE 48: Expired refresh token
  it('should reject expired refresh token', async () => {
    const expiredToken = jwt.sign(
      { userId: 'user-123', type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // Already expired
    );

    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout (Integration)', () => {
  // TEST CASE 49: Logout success
  it('should return 200 on logout', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@driftsentry.local', password: 'admin123' });

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

    expect(logoutResponse.status).toBe(200);
  });

  // TEST CASE 50: Logout without token
  it('should return 401 when logging out without token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout');

    expect(response.status).toBe(401);
  });
});
```

#### **2.2 Drift Routes Integration** (drifts.routes.test.ts)
```typescript
describe('GET /api/v1/drifts (Integration)', () => {
  // TEST CASE 51: Get all drifts with auth
  it('should return drifts for authenticated user', async () => {
    const token = await getTestToken('admin');

    const response = await request(app)
      .get('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('pagination');
  });

  // TEST CASE 52: Unauthorized access
  it('should return 401 without token', async () => {
    const response = await request(app)
      .get('/api/v1/drifts');

    expect(response.status).toBe(401);
  });

  // TEST CASE 53: Pagination
  it('should respect page and limit parameters', async () => {
    const token = await getTestToken('engineer');

    const response = await request(app)
      .get('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 2, limit: 5 });

    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.limit).toBe(5);
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });

  // TEST CASE 54: Filter by status
  it('should filter drifts by status', async () => {
    const token = await getTestToken('viewer');

    const response = await request(app)
      .get('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'PENDING' });

    response.body.data.forEach(drift => {
      expect(drift.status).toBe('PENDING');
    });
  });
});

describe('POST /api/v1/drifts/:id/approve (Integration)', () => {
  // TEST CASE 55: Approve drift
  it('should approve drift for engineer role', async () => {
    const token = await getTestToken('engineer');
    const driftId = await createTestDrift({ status: 'PENDING' });

    const response = await request(app)
      .post(`/api/v1/drifts/${driftId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Approved as per policy' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('APPROVED');
    expect(response.body.approvedBy).toBeDefined();
  });

  // TEST CASE 56: Viewer cannot approve
  it('should reject approval from viewer role', async () => {
    const token = await getTestToken('viewer');
    const driftId = await createTestDrift({ status: 'PENDING' });

    const response = await request(app)
      .post(`/api/v1/drifts/${driftId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  // TEST CASE 57: Cannot approve non-existent drift
  it('should return 404 for non-existent drift', async () => {
    const token = await getTestToken('admin');

    const response = await request(app)
      .post('/api/v1/drifts/nonexistent-id/approve')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  // TEST CASE 58: WebSocket event emitted
  it('should emit drift:approved WebSocket event', async () => {
    // Setup WebSocket listener
    const wsListener = new Promise(resolve => {
      io.once('drift:approved', (data) => resolve(data));
    });

    const token = await getTestToken('admin');
    const driftId = await createTestDrift({ status: 'PENDING' });

    await request(app)
      .post(`/api/v1/drifts/${driftId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    const wsData = await wsListener;
    expect(wsData.driftId).toBe(driftId);
    expect(wsData.status).toBe('APPROVED');
  });
});

describe('POST /api/v1/drifts/:id/reject (Integration)', () => {
  // TEST CASE 59: Reject drift
  it('should reject drift with reason', async () => {
    const token = await getTestToken('engineer');
    const driftId = await createTestDrift({ status: 'PENDING' });

    const response = await request(app)
      .post(`/api/v1/drifts/${driftId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Not applicable' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('REJECTED');
    expect(response.body.reason).toBe('Not applicable');
  });

  // TEST CASE 60: Validation - reason required
  it('should require reason for rejection', async () => {
    const token = await getTestToken('admin');
    const driftId = await createTestDrift({ status: 'PENDING' });

    const response = await request(app)
      .post(`/api/v1/drifts/${driftId}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});
```

#### **2.3 WebSocket Integration Tests** (websocket.integration.test.ts)
```typescript
describe('WebSocket Events (Integration)', () => {
  // TEST CASE 61: drift:created event
  it('should broadcast drift:created to all connected clients', async () => {
    const client1 = io.connect('http://localhost:3002');
    const client2 = io.connect('http://localhost:3002');

    const event1 = new Promise(resolve => {
      client1.on('drift:created', resolve);
    });
    const event2 = new Promise(resolve => {
      client2.on('drift:created', resolve);
    });

    // Create drift via API
    const token = await getTestToken('engineer');
    await request(app)
      .post('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`)
      .send({ resourceId: 'i-123', driftType: 'TAG_CHANGE' });

    const data1 = await event1;
    const data2 = await event2;

    expect(data1.resourceId).toBe('i-123');
    expect(data2.resourceId).toBe('i-123');

    client1.close();
    client2.close();
  });

  // TEST CASE 62: drift:approved event
  it('should emit drift:approved when approved', async () => {
    const client = io.connect('http://localhost:3002');

    const event = new Promise(resolve => {
      client.on('drift:approved', resolve);
    });

    const token = await getTestToken('admin');
    const driftId = await createTestDrift();

    await request(app)
      .post(`/api/v1/drifts/${driftId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    const data = await event;
    expect(data.driftId).toBe(driftId);
    expect(data.status).toBe('APPROVED');

    client.close();
  });

  // TEST CASE 63: alert:created event
  it('should emit alert:created when new alert detected', async () => {
    const client = io.connect('http://localhost:3002');

    const event = new Promise(resolve => {
      client.on('alert:created', resolve);
    });

    // Trigger alert creation (via API or test trigger)
    const token = await getTestToken('admin');
    await request(app)
      .post('/api/v1/alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ severity: 'CRITICAL', message: 'Test alert' });

    const data = await event;
    expect(data.severity).toBe('CRITICAL');

    client.close();
  });

  // TEST CASE 64: Reconnection handling
  it('should handle client reconnection gracefully', async () => {
    const client = io.connect('http://localhost:3002');

    // Disconnect and reconnect
    client.disconnect();
    await new Promise(r => setTimeout(r, 1000));
    client.connect();

    const connected = new Promise(resolve => {
      client.on('connect', resolve);
    });

    await connected;
    expect(client.connected).toBe(true);

    client.close();
  });

  // TEST CASE 65: Multiple namespaces
  it('should isolate events to correct namespaces', async () => {
    const driftClient = io.connect('http://localhost:3002/drifts');
    const alertClient = io.connect('http://localhost:3002/alerts');

    // Event on driftClient should not be received by alertClient
    // Create drift - should be received by driftClient only

    driftClient.close();
    alertClient.close();
  });
});
```

#### **2.4 Error Handling Integration Tests** (error-handling.test.ts)
```typescript
describe('Error Handling (Integration)', () => {
  // TEST CASE 66: 500 Internal Server Error
  it('should return 500 for unhandled errors', async () => {
    // Mock a service to throw unexpected error
    jest.spyOn(driftService, 'getDrifts').mockRejectedValueOnce(
      new Error('Unexpected DB error')
    );

    const token = await getTestToken('admin');
    const response = await request(app)
      .get('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    // Error details should NOT be exposed to client
    expect(response.body.error.message).not.toContain('Unexpected DB error');
  });

  // TEST CASE 67: Request timeout
  it('should handle request timeout', async () => {
    // Mock slow service
    jest.spyOn(driftService, 'getDrifts').mockImplementationOnce(
      () => new Promise(r => setTimeout(r, 10000))
    );

    const token = await getTestToken('admin');
    const response = await request(app)
      .get('/api/v1/drifts')
      .timeout(1000)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(408); // Request Timeout
  });

  // TEST CASE 68: Database connection error
  it('should return 503 when database unavailable', async () => {
    // Close database connection
    await prisma.$disconnect();

    const token = await getTestToken('admin');
    const response = await request(app)
      .get('/api/v1/drifts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(503); // Service Unavailable
  });

  // TEST CASE 69: Validation error format
  it('should return detailed validation errors', async () => {
    const token = await getTestToken('admin');
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(response.body.error.details)).toBe(true);
    expect(response.body.error.details[0]).toHaveProperty('field');
    expect(response.body.error.details[0]).toHaveProperty('issue');
  });

  // TEST CASE 70: Concurrent error handling
  it('should handle concurrent errors independently', async () => {
    const token = await getTestToken('admin');

    const requests = [
      request(app).get('/api/v1/drifts/invalid-id').set('Authorization', `Bearer ${token}`),
      request(app).get('/api/v1/drifts/another-invalid-id').set('Authorization', `Bearer ${token}`),
    ];

    const [res1, res2] = await Promise.all(requests);

    expect(res1.status).toBe(404);
    expect(res2.status).toBe(404);
    expect(res1.body.error.message).not.toBe(res2.body.error.message);
  });
});
```

---

### **PART 3: FRONTEND UNIT TESTS**

#### **3.1 Component Tests** (LoginPage.test.tsx)
```typescript
describe('<LoginPage />', () => {
  // TEST CASE 71: Render login form
  it('should render email and password inputs', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  // TEST CASE 72: Form validation
  it('should show validation errors for empty fields', async () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  // TEST CASE 73: Form submission
  it('should call login API on form submit', async () => {
    const loginMock = jest.spyOn(authService, 'login').mockResolvedValueOnce({
      accessToken: 'token-123',
      user: { id: 'user-123', role: 'admin' }
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@driftsentry.local' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'admin@driftsentry.local',
        password: 'admin123'
      });
    });
  });

  // TEST CASE 74: Redirect on success
  it('should redirect to dashboard on successful login', async () => {
    jest.spyOn(authService, 'login').mockResolvedValueOnce({
      accessToken: 'token-123',
      user: { id: 'user-123', role: 'admin' }
    });

    const mockedNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockedNavigate
    }));

    render(<LoginPage />);

    // Fill and submit form...
    // await waitFor(() => {
    //   expect(mockedNavigate).toHaveBeenCalledWith('/dashboard');
    // });
  });

  // TEST CASE 75: Error handling
  it('should display error message on login failure', async () => {
    jest.spyOn(authService, 'login').mockRejectedValueOnce(
      new Error('Invalid credentials')
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'admin@driftsentry.local' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  // TEST CASE 76: Loading state
  it('should show loading spinner while submitting', async () => {
    jest.spyOn(authService, 'login').mockImplementationOnce(
      () => new Promise(r => setTimeout(r, 1000))
    );

    render(<LoginPage />);

    // Fill form and submit
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    // Check for spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // TEST CASE 77: Accessibility
  it('should be keyboard navigable', () => {
    render(<LoginPage />);

    // Should be able to tab through inputs
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveFocus() === false; // Initially not focused

    // Tab to email
    fireEvent.keyDown(document.body, { key: 'Tab' });
    expect(emailInput).toHaveFocus();

    // Tab to password
    fireEvent.keyDown(emailInput, { key: 'Tab' });
    expect(screen.getByLabelText(/password/i)).toHaveFocus();
  });

  // TEST CASE 78: Remember me checkbox
  it('should handle remember me checkbox', async () => {
    render(<LoginPage />);

    const rememberCheckbox = screen.getByLabelText(/remember me/i);
    fireEvent.click(rememberCheckbox);

    expect(rememberCheckbox).toBeChecked();

    // Verify localStorage updated
    expect(localStorage.getItem('rememberEmail')).toBeTruthy();
  });
});
```

#### **3.2 Hook Tests** (useDrifts.test.ts)
```typescript
describe('useDrifts Hook', () => {
  // TEST CASE 79: Fetch drifts on mount
  it('should fetch drifts on component mount', async () => {
    const { result } = renderHook(() => useDrifts());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.drifts).toEqual([]);

    // Wait for API call
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.drifts)).toBe(true);
  });

  // TEST CASE 80: Pagination
  it('should handle pagination correctly', async () => {
    const { result } = renderHook(() => useDrifts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Go to page 2
    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(result.current.pagination.page).toBe(2);
    });
  });

  // TEST CASE 81: Filtering
  it('should filter drifts by status', async () => {
    const { result } = renderHook(() => useDrifts());

    act(() => {
      result.current.setFilters({ status: 'PENDING' });
    });

    await waitFor(() => {
      result.current.drifts.forEach(drift => {
        expect(drift.status).toBe('PENDING');
      });
    });
  });

  // TEST CASE 82: Error handling
  it('should handle API errors gracefully', async () => {
    jest.spyOn(api, 'getDrifts').mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useDrifts());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error.message).toContain('Network error');
    });
  });

  // TEST CASE 83: Refetch manually
  it('should refetch drifts on demand', async () => {
    const { result } = renderHook(() => useDrifts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const initialCount = result.current.drifts.length;

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      // Check that new data fetched
      expect(result.current.drifts).toBeTruthy();
    });
  });
});
```

---

### **PART 4: FRONTEND E2E TESTS** (Playwright)

#### **4.1 Login E2E** (login.spec.ts)
```typescript
describe('Login Flow E2E', () => {
  // TEST CASE 84: Full login workflow
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    // Fill form
    await page.fill('input[name="email"]', 'admin@driftsentry.local');
    await page.fill('input[name="password"]', 'admin123');

    // Submit
    await page.click('button:has-text("Sign In")');

    // Verify redirect
    await page.waitForURL('http://localhost:5173/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  // TEST CASE 85: Error message on invalid credentials
  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    await page.fill('input[name="email"]', 'admin@driftsentry.local');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');

    // Check for error message
    const error = await page.locator('text=Invalid credentials');
    await expect(error).toBeVisible();

    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  // TEST CASE 86: Remember me functionality
  test('should remember email with remember me checkbox', async ({ page }) => {
    await page.goto('http://localhost:5173/login');

    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('admin@driftsentry.local');

    const rememberCheckbox = page.locator('input[name="remember"]');
    await rememberCheckbox.click();

    // Reload page
    await page.reload();

    // Email should be prefilled
    await expect(emailInput).toHaveValue('admin@driftsentry.local');
  });

  // TEST CASE 87: Session persistence
  test('should maintain session after reload', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'admin@driftsentry.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    await page.waitForURL('**/dashboard');

    // Reload
    await page.reload();

    // Should still be on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  // TEST CASE 88: Logout
  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Click logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });
});
```

#### **4.2 Dashboard E2E** (dashboard.spec.ts)
```typescript
describe('Dashboard E2E', () => {
  // TEST CASE 89: Load dashboard data
  test('should load and display dashboard metrics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:5173/dashboard');

    // Check for key metrics
    const driftCount = page.locator('text=Drifts Detected');
    await expect(driftCount).toBeVisible();

    const costChart = page.locator('canvas[role="img"]');
    await expect(costChart).toBeVisible();
  });

  // TEST CASE 90: Real-time updates
  test('should receive real-time drift updates', async ({ page, context }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:5173/dashboard');

    // Open another browser tab to trigger drift creation
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173/drifts');

    // Create drift via API (in test, simulate via curl or API call)
    const newDriftCount = await page.locator('.drift-count').textContent();

    // Wait for WebSocket update
    await page.waitForTimeout(2000);

    const updatedCount = await page.locator('.drift-count').textContent();
    expect(updatedCount).not.toBe(newDriftCount);

    await page2.close();
  });

  // TEST CASE 91: Navigation between pages
  test('should navigate between dashboard and drifts list', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('http://localhost:5173/dashboard');
    expect(page.url()).toContain('/dashboard');

    // Click Drifts in sidebar
    await page.click('a:has-text("Drifts")');

    await page.waitForURL('**/drifts');
    expect(page.url()).toContain('/drifts');
  });
});
```

#### **4.3 Performance E2E** (performance.spec.ts)
```typescript
describe('Performance E2E', () => {
  // TEST CASE 92: Lighthouse audit
  test('should have Lighthouse score > 90', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');

    // Run Lighthouse (requires lighthouse module)
    // const result = await lighthouse('http://localhost:5173');
    // expect(result.lhr.categories.performance.score * 100).toBeGreaterThan(90);
  });

  // TEST CASE 93: First Contentful Paint < 1.5s
  test('should have FCP < 1.5s', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      return fcp?.startTime;
    });

    expect(metrics).toBeLessThan(1500); // 1.5 seconds
  });

  // TEST CASE 94: API response time < 500ms
  test('should have API responses < 500ms', async ({ page }) => {
    let maxLatency = 0;

    page.on('response', response => {
      const timing = response.timing();
      if (timing) {
        const latency = timing.responseEnd - timing.responseStart;
        maxLatency = Math.max(maxLatency, latency);
      }
    });

    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');

    expect(maxLatency).toBeLessThan(500);
  });

  // TEST CASE 95: Bundle size < 150KB
  test('should have bundle size < 150KB', async ({ page }) => {
    const resourceMetrics = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter(r => r.initiatorType === 'script' || r.initiatorType === 'link')
        .reduce((sum, r) => sum + r.transferSize, 0);
    });

    expect(resourceMetrics).toBeLessThan(150 * 1024); // 150KB
  });
});
```

---

## 🏗️ TEST CONFIGURATION FILES

### **Backend: jest.config.js**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true,
};
```

### **Frontend: vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/index.ts',
      ],
      lines: 95,
      functions: 95,
      branches: 95,
      statements: 95,
    },
    globals: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### **Frontend: playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📦 NPM SCRIPTS TO ADD

### **Backend package.json**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

### **Frontend package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit",
    "test:integration": "vitest tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

---

## ✅ QUALITY CRITERIA TO MEET

### **Code Coverage Target**
```
Frontend:
├─ Statements: > 95%
├─ Branches: > 95%
├─ Functions: > 95%
└─ Lines: > 95%

Backend:
├─ Statements: > 95%
├─ Branches: > 95%
├─ Functions: > 95%
└─ Lines: > 95%

Combined: > 94% overall
```

### **Test Pass Rate**
```
Unit Tests: 100% pass rate
Integration Tests: 100% pass rate
E2E Tests: 100% pass rate (or 90% acceptable)
```

### **Performance Targets**
```
Frontend:
├─ FCP (First Contentful Paint): < 1.5s
├─ LCP (Largest Contentful Paint): < 2.5s
├─ TTI (Time to Interactive): < 3.5s
├─ CLS (Cumulative Layout Shift): < 0.1
└─ Bundle size: < 150KB gzipped

Backend:
├─ API p99 latency: < 500ms
├─ Database query p99: < 100ms
├─ Throughput: > 1000 req/s
└─ Availability: 99.9% uptime
```

### **Security Targets**
```
OWASP Top 10: 0 critical/high vulnerabilities
npm audit: 0 critical/high vulnerabilities
License compliance: 100%
Dependency freshness: < 90 days old
```

### **Test Execution Time**
```
Unit tests: < 5 minutes
Integration tests: < 10 minutes
E2E tests: < 10 minutes
Total: < 30 minutes
```

---

## 🚀 EXECUTION PLAN (10 DAYS)

```
Day 1-2: Backend Unit Tests
├─ Write 80+ unit tests (services, repositories, utils)
├─ Achieve 90% coverage on backend
└─ Fix any failing tests

Day 3-4: Backend Integration Tests
├─ Write 50+ integration tests (API routes, WebSocket)
├─ Test all endpoints with real API calls
└─ Achieve 95%+ coverage

Day 5-6: Frontend Unit Tests
├─ Write 70+ component & hook tests
├─ Achieve 90% coverage
└─ Fix failing tests

Day 7-8: Frontend E2E Tests
├─ Write 15+ E2E tests (login, dashboard, drifts, alerts)
├─ Test on Chrome, Firefox, Safari
└─ Test on mobile viewport

Day 9-10: Performance, Security & Reporting
├─ Run Lighthouse audit (target: 90+)
├─ OWASP security scan (target: 0 critical)
├─ Generate coverage reports
├─ Document results
└─ Fix remaining issues
```

---

## 📊 SUCCESS METRICS

By end of Phase 7, you should have:

✅ **Test Coverage**: 95%+ code coverage  
✅ **Test Count**: 200+ test cases  
✅ **Pass Rate**: 100% tests passing  
✅ **Performance**: Lighthouse > 90  
✅ **Security**: OWASP 0 vulnerabilities  
✅ **Execution Time**: Tests complete in < 30 min  
✅ **Documentation**: Each test documented  
✅ **CI Integration**: Tests run on every PR  

---

## 🎯 WHAT TO TELL CURSOR/CLAUDE

**Use this exact prompt:**

```
I'm on Phase 7 (Testing & QA) of CloudDrift Guardian project.

Backend: Express.js REST API (9 endpoints) ✅
Frontend: React 18 + TypeScript ✅

Now I need 95%+ code coverage with 200+ tests.

STRUCTURE:
- Backend tests: /backend/tests/ (unit + integration)
- Frontend tests: /frontend/tests/ (unit + integration + E2E)
- E2E with Playwright

DELIVERABLES:
1. Backend: 80 unit tests (services, repos) + 50 integration tests (routes, WebSocket)
2. Frontend: 70 unit tests (components, hooks) + 30 E2E tests
3. Config: jest.config.js, vitest.config.ts, playwright.config.ts
4. Coverage reports (target: 95%)
5. Performance tests (Lighthouse > 90, API < 500ms)

Each test MUST have:
- Clear test case number (TEST CASE 71, 72, etc.)
- Descriptive name
- Setup/teardown
- Assertions
- Error paths covered

Follow the detailed specifications in the document above.
Build incrementally: unit → integration → E2E.
```

---

**This is your complete Phase 7 specification. Use it to guide Cursor/Claude step-by-step through testing implementation.**
