# ⚡ PHASE 7 QUICK START GUIDE
## Commands & Execution Workflow for Cursor/Claude

---

## 🎯 WHAT TO TELL CURSOR/CLAUDE

Copy this exact prompt and paste into Cursor/Claude/Google Antigravity:

```
You are helping me build CloudDrift Guardian's Phase 7: Testing & Quality Assurance.

CURRENT STATUS:
✅ Backend: Express.js REST API (9 endpoints) - COMPLETE
✅ Frontend: React 18 TypeScript (5 pages) - COMPLETE
🔄 Phase 7: Testing & Quality - STARTING NOW

PROJECT STRUCTURE:
Backend: /backend (Node.js + Express + PostgreSQL)
Frontend: /frontend (React + TypeScript + Vite)

PHASE 7 GOAL:
- 95%+ code coverage
- 200+ test cases (120 unit + 50 integration + 30 E2E)
- 100% test pass rate
- Lighthouse score > 90
- OWASP vulnerabilities: 0
- Total test time: < 30 minutes

DELIVERABLES (10 days):
1. Backend Unit Tests (80 test cases)
   - auth.service.test.ts (10 cases)
   - drift.service.test.ts (20 cases)
   - cost.service.test.ts (5 cases)
   - repositories/*.test.ts (25 cases)
   - utils/*.test.ts (20 cases)

2. Backend Integration Tests (50 test cases)
   - auth.routes.test.ts (10 cases)
   - drifts.routes.test.ts (20 cases)
   - alerts.routes.test.ts (10 cases)
   - websocket.test.ts (10 cases)

3. Frontend Unit Tests (70 test cases)
   - LoginPage.test.tsx (10 cases)
   - DashboardPage.test.tsx (15 cases)
   - DriftsList.test.tsx (15 cases)
   - hooks/*.test.ts (30 cases)

4. Frontend E2E Tests (30 test cases)
   - login.spec.ts (10 cases)
   - dashboard.spec.ts (10 cases)
   - drifts.spec.ts (10 cases)

5. Configuration
   - jest.config.js (backend)
   - vitest.config.ts (frontend)
   - playwright.config.ts (E2E)

TESTING RULES:
✓ Each test case numbered (TEST CASE 1, 2, 3, etc.)
✓ Test has: describe, it, expect, setup, teardown
✓ Mock external dependencies
✓ Test both success and error paths
✓ Every assertion verified
✓ Test should be independent

TOOLS:
- Backend: Jest + TypeScript
- Frontend: Vitest + React Testing Library
- E2E: Playwright (Chrome, Firefox, Safari)
- Coverage: 95%+ target
- Performance: Lighthouse CLI

FOLLOW THIS DOCUMENT EXACTLY:
/path/to/phase-7-testing-prompt.md

Start with Step 1: Create folder structure
Then: Backend unit tests
Then: Backend integration tests
Then: Frontend unit tests
Then: Frontend E2E tests
Finally: Coverage reports & performance audits

Don't skip any steps. Complete each module before moving to next.
```

---

## 📋 STEP-BY-STEP EXECUTION

### **STEP 1: Create Folder Structure** (15 min)

```bash
# Backend test folders
mkdir -p backend/tests/unit/services
mkdir -p backend/tests/unit/repositories
mkdir -p backend/tests/unit/utils
mkdir -p backend/tests/unit/middleware
mkdir -p backend/tests/integration
mkdir -p backend/tests/fixtures

# Frontend test folders
mkdir -p frontend/tests/unit/components
mkdir -p frontend/tests/unit/hooks
mkdir -p frontend/tests/unit/services
mkdir -p frontend/tests/unit/utils
mkdir -p frontend/tests/integration
mkdir -p frontend/tests/e2e
mkdir -p frontend/tests/fixtures

echo "Folders created ✓"
```

### **STEP 2: Install Backend Testing Dependencies** (10 min)

```bash
cd backend

# Install Jest + TypeScript testing tools
npm install -D jest ts-jest @types/jest

# Install testing utilities
npm install -D @testing-library/jest-dom
npm install -D supertest @types/supertest

# Install mocking libraries
npm install -D jest-mock-extended ts-mockito

# Install database test utilities
npm install -D sql.js

# Add test script to package.json
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"

npm run test -- --version
```

### **STEP 3: Install Frontend Testing Dependencies** (10 min)

```bash
cd frontend

# Install Vitest + React Testing Library
npm install -D vitest jsdom @vitest/ui

# Install component testing utilities
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install E2E testing
npm install -D @playwright/test

# Install mocking
npm install -D msw happy-dom

# Add test scripts
# "test": "vitest",
# "test:watch": "vitest --watch",
# "test:ui": "vitest --ui",
# "test:e2e": "playwright test"

npm run test -- --version
```

### **STEP 4: Create Test Configuration Files** (20 min)

**Backend: jest.config.js**
```bash
cat > backend/jest.config.js << 'EOF'
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
EOF

cat backend/jest.config.js
```

**Frontend: vitest.config.ts**
```bash
cat > frontend/vitest.config.ts << 'EOF'
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 95,
      functions: 95,
      branches: 95,
    },
    testTimeout: 10000,
  },
});
EOF

cat frontend/vitest.config.ts
```

**Frontend: playwright.config.ts**
```bash
cat > frontend/playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
EOF

cat frontend/playwright.config.ts
```

### **STEP 5: Create Test Setup Files** (10 min)

**Backend: tests/setup.ts**
```bash
cat > backend/tests/setup.ts << 'EOF'
// Before all tests
beforeAll(async () => {
  console.log('🧪 Starting backend tests...');
});

// After all tests
afterAll(async () => {
  console.log('✅ Backend tests complete');
});

// Each test
beforeEach(async () => {
  // Clear database, reset mocks
});

afterEach(async () => {
  // Cleanup
});
EOF

cat backend/tests/setup.ts
```

**Frontend: tests/setup.ts**
```bash
cat > frontend/tests/setup.ts << 'EOF'
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
EOF

cat frontend/tests/setup.ts
```

### **STEP 6: Start Writing Tests** (Day 1-2: Backend Unit Tests)

Tell Cursor:
```
Create backend/tests/unit/services/auth.service.test.ts

This file should contain 10 test cases:
1. Valid login returns tokens
2. Invalid email throws error
3. Invalid password throws error
4. Empty fields validation
5. Refresh token returns new access token
6. Expired refresh token rejected
7. Invalid signature rejected
8. Logout invalidates token
9. Password hashing with bcrypt
10. Different salts produce different hashes

Each test MUST have:
- describe('AuthService', () => {})
- describe('login()', () => {})
- it('should...', async () => {})
- Mock database calls with jest.spyOn()
- Assert with expect()
- Setup/teardown

Use the specification from phase-7-testing-prompt.md

Follow this format for EACH test case:

it('test description', async () => {
  // Setup
  const input = { ... };
  
  // Execute
  const result = await authService.login(input);
  
  // Assert
  expect(result).toHaveProperty('accessToken');
  expect(result).toHaveProperty('refreshToken');
  expect(result.user.role).toBe('admin');
});
```

### **STEP 7: Run Tests & Check Coverage** (Daily)

```bash
# Backend
cd backend
npm run test                    # Run all tests once
npm run test:watch            # Watch mode (re-run on file change)
npm run test:coverage         # Generate coverage report

# View coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage\lcov-report\index.html  # Windows

# Frontend
cd frontend
npm run test                   # Run all tests
npm run test:watch           # Watch mode
npm run test:ui              # Visual UI
npm run test:coverage        # Coverage report

# E2E (after frontend/backend running)
npm run test:e2e             # Run Playwright tests
npm run test:e2e -- --headed # Show browser
npm run test:e2e -- --debug  # Debug mode
```

### **STEP 8: Performance Audit** (Day 9)

```bash
# Install Lighthouse
npm install -g lighthouse

# Audit frontend performance
lighthouse http://localhost:5173 --view

# Check bundle size
npm run build
ls -lh dist/

# API performance test
npm install -D autocannon
autocannon http://localhost:3002/api/v1/drifts --c 10 --d 30

# Security scan
npm audit

# OWASP scan
npm install -D @owasp/zap
```

### **STEP 9: Generate Coverage Reports** (Day 10)

```bash
# Backend coverage
cd backend
npm run test:coverage
cat coverage/coverage-summary.json | grep -E 'lines|branches|functions'

# Frontend coverage
cd frontend
npm run test:coverage
cat coverage/coverage-summary.json

# Combined report (if available)
npm run test:all -- --coverage
```

### **STEP 10: Final Check** (Day 10)

```bash
# Run all tests
npm run test:all

# Check pass rate
npm run test 2>&1 | grep -E 'passed|failed'

# Verify no TypeScript errors
npx tsc --noEmit

# Final verification
npm run lint
npm run build
npm run test:e2e
```

---

## 🎬 DAILY EXECUTION SCHEDULE

### **Day 1-2: Backend Unit Tests**
```bash
# Morning
npm run test:watch

# Each module:
# - auth.service.test.ts (10 cases)
# - drift.service.test.ts (20 cases)
# - alert.service.test.ts (5 cases)
# - Cost service tests (10 cases)

# Evening: Check coverage
npm run test:coverage
# Target: 90% coverage by end of day 2
```

### **Day 3-4: Backend Integration Tests**
```bash
# Morning
npm run test:watch

# Each endpoint:
# - POST /api/v1/auth/login (10 cases)
# - GET /api/v1/drifts (10 cases)
# - POST /api/v1/drifts/:id/approve (10 cases)
# - WebSocket tests (15 cases)

# Evening: Check pass rate
npm run test 2>&1 | tail -20
# Target: 95%+ coverage
```

### **Day 5-6: Frontend Unit Tests**
```bash
cd frontend

# Morning
npm run test:watch

# Components:
# - LoginPage (10 cases)
# - DashboardPage (15 cases)
# - DriftsList (15 cases)

# Hooks:
# - useDrifts (10 cases)
# - useAuth (10 cases)
# - useAlerts (5 cases)

# Evening: Coverage check
npm run test:coverage
# Target: 90% coverage
```

### **Day 7-8: Frontend E2E Tests**
```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Run E2E tests
npm run test:e2e -- --headed

# Test workflows:
# - Login flow
# - Dashboard load
# - Drift approval
# - Real-time updates
# - Mobile viewport

# Evening: Verify all pass
npm run test:e2e 2>&1 | grep -E 'passed|failed'
```

### **Day 9-10: Performance & Security**
```bash
# Performance
lighthouse http://localhost:5173 --view
# Target: 90+

# Security
npm audit
npx @owasp/zap scan --target http://localhost:3002
# Target: 0 critical/high

# Coverage reports
npm run test:coverage
# Target: 95%+

# Final verification
npm run test:all
# Expected: All tests passing, 95%+ coverage
```

---

## ✅ SUCCESS CHECKLIST

Before moving to Phase 8, verify:

- [ ] Backend unit tests: 80+ passing, 90%+ coverage
- [ ] Backend integration tests: 50+ passing, 95%+ coverage  
- [ ] Frontend unit tests: 70+ passing, 90%+ coverage
- [ ] Frontend E2E tests: 30+ passing (all scenarios)
- [ ] Total test count: 200+ tests
- [ ] Total coverage: 95%+ across both
- [ ] Lighthouse score: 90+
- [ ] OWASP vulnerabilities: 0
- [ ] npm audit: 0 critical/high
- [ ] All tests < 30 minutes total
- [ ] CI/CD integration: Tests run on every PR

---

## 📞 TROUBLESHOOTING

### **Tests failing?**
```bash
# Debug single test
npm run test -- auth.service.test.ts --verbose

# Check logs
tail -100 test-output.log

# Reset modules
npm run test -- --clearCache
```

### **Coverage not meeting target?**
```bash
# Find uncovered lines
npm run test:coverage -- --listTests

# View coverage report
open coverage/lcov-report/index.html

# Add missing tests in that file
```

### **E2E tests flaky?**
```bash
# Increase timeout
timeout: 30000  # in playwright.config.ts

# Wait for elements
page.waitForLoadState('networkidle')
page.waitForSelector('[data-testid="element"]')

# Debug mode
npm run test:e2e -- --debug
```

### **WebSocket tests failing?**
```bash
# Check socket connection
io.on('connect_error', (err) => console.log(err));

# Verify event is emitted
const events = [];
io.on('drift:created', (e) => events.push(e));

# Add debugging
console.log('Events received:', events);
```

---

## 🎯 KEY METRICS TO TRACK

Track these daily:

```
Day 1: Unit tests written: __/80
Day 2: Unit tests passing: __/80, Coverage: __%
Day 3: Integration tests written: __/50
Day 4: Integration tests passing: __/50, Coverage: __%
Day 5: Frontend tests written: __/70
Day 6: Frontend tests passing: __/70, Coverage: __%
Day 7: E2E tests written: __/30
Day 8: E2E tests passing: __/30, All browsers: __/3
Day 9: Lighthouse score: __/100
Day 10: Final audit: Coverage __%, Tests ___/200, Pass rate __%
```

---

**You've got this! Start Day 1 with backend unit tests. Move methodically through each module. Don't skip any. 🚀**
