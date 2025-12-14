// Backend test setup
import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        drift: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        alert: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

// Global test setup
beforeAll(async () => {
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
    name: 'Test User',
    role: 'ENGINEER',
    passwordHash: '$2b$12$mockHashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

export const createMockDrift = (overrides = {}) => ({
    id: 'drift-123',
    resourceId: 'i-1234567890abcdef0',
    resourceType: 'EC2',
    driftType: 'TAG_CHANGE',
    severity: 'HIGH',
    status: 'PENDING',
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
    type: 'CRITICAL_DRIFT',
    title: 'Critical drift detected',
    message: 'A critical drift was detected in production',
    severity: 'CRITICAL',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
});
