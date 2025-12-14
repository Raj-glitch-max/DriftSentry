// Backend test setup

// Mock the database module BEFORE any imports
jest.mock('../src/database/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        drift: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        alert: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        session: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $on: jest.fn(),
    },
}));

// Mock logger to prevent console noise
jest.mock('../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Global test setup
beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    console.log('🧪 Starting backend tests...');
});

afterAll(async () => {
    console.log('✅ Backend tests complete');
});

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.restoreAllMocks();
});

// Test utilities
export const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@driftsentry.local',
    firstName: 'Test',
    lastName: 'User',
    role: 'engineer',
    passwordHash: '$2b$12$mockHashedPassword',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockDrift = (overrides = {}) => ({
    id: 'drift-123',
    resourceId: 'i-1234567890abcdef0',
    resourceType: 'EC2',
    region: 'us-east-1',
    severity: 'warning',
    status: 'detected',
    detectedAt: new Date(),
    currentState: { tags: { Environment: 'production' } },
    expectedState: { tags: { Environment: 'staging' } },
    estimatedCost: 150.0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockAlert = (overrides = {}) => ({
    id: 'alert-123',
    type: 'drift_detected',
    title: 'Critical drift detected',
    message: 'A critical drift was detected in production',
    severity: 'critical',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
});
