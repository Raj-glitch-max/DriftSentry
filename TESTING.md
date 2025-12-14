# DriftSentry Testing Guide

## Overview

| Category | Framework | Files | Tests |
|----------|-----------|-------|-------|
| Backend Unit | Jest | 6 | 72 |
| Backend Integration | Jest + Supertest | 3 | 50 |
| Frontend Unit | Vitest + React Testing Library | 5 | 70 |
| Frontend E2E | Playwright | 3 | 30 |
| **Total** | | **17** | **222+** |

## Backend Tests

### Running Tests

```bash
cd backend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```
backend/tests/
├── setup.ts                          # Jest setup with mocks
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts      # 11 tests
│   │   ├── drift.service.test.ts     # 21 tests  
│   │   ├── alert.service.test.ts     # 10 tests
│   │   └── metrics.service.test.ts   # 8 tests
│   └── repositories/
│       ├── user.repository.test.ts   # 10 tests
│       └── drift.repository.test.ts  # 12 tests
└── integration/
    ├── auth.routes.test.ts           # 15 tests
    ├── drifts.routes.test.ts         # 20 tests
    └── websocket.test.ts             # 15 tests
```

### Coverage Expectations

- **Target**: ≥ 80% coverage
- Services: 95%+ coverage
- Repositories: 90%+ coverage
- Routes: 80%+ coverage

## Frontend Tests

### Running Tests

```bash
cd frontend

# Unit tests
npm run test

# With coverage
npm run test:coverage

# Interactive UI
npm run test:ui

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

### Test Structure

```
frontend/tests/
├── setup.ts                          # Vitest setup
├── unit/
│   ├── hooks/
│   │   └── useDrifts.test.ts         # 15 tests
│   └── components/
│       ├── LoginPage.test.tsx        # 15 tests
│       ├── DashboardPage.test.tsx    # 15 tests
│       ├── DriftsList.test.tsx       # 15 tests
│       └── Button.test.tsx           # 10 tests
└── e2e/
    ├── login.spec.ts                 # 10 tests
    ├── dashboard.spec.ts             # 10 tests
    └── drifts.spec.ts                # 10 tests
```

### E2E Requirements

1. Backend must be running on localhost:3001
2. Frontend must be running on localhost:3000
3. Database must be seeded with test data

```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev

# Run E2E tests (in another terminal)
cd frontend && npm run test:e2e
```

## Test Configuration

### Backend (Jest)

- Config: `backend/jest.config.js`
- Setup: `backend/tests/setup.ts`
- Coverage threshold: 80%

### Frontend (Vitest)

- Config: `frontend/vitest.config.ts`
- Setup: `frontend/tests/setup.ts`
- Coverage threshold: 80%

### E2E (Playwright)

- Config: `frontend/playwright.config.ts`
- Browsers: Chrome, Firefox, Safari
- Mobile: Pixel 5 emulation

## Writing New Tests

### Backend Example

```typescript
import { AuthService } from '../../../src/services/auth.service';

jest.mock('../../../src/repositories/user.repository');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  it('should return tokens for valid credentials', async () => {
    // Arrange
    setupMocks();
    
    // Act
    const result = await authService.login(input);
    
    // Assert
    expect(result.accessToken).toBeDefined();
  });
});
```

### Frontend Example

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByRole('textbox', { name: /email/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});
```
