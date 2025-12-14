import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Test utilities
export const createMockDrift = (overrides = {}) => ({
    id: 'drift-123',
    resourceId: 'i-1234567890abcdef0',
    resourceType: 'EC2',
    driftType: 'TAG_CHANGE',
    severity: 'HIGH',
    status: 'PENDING',
    detectedAt: new Date().toISOString(),
    currentState: { tags: { Environment: 'production' } },
    expectedState: { tags: { Environment: 'staging' } },
    estimatedCost: 150.0,
    ...overrides,
});

export const createMockUser = (overrides = {}) => ({
    id: 'user-123',
    email: 'test@driftsentry.local',
    name: 'Test User',
    role: 'ENGINEER',
    ...overrides,
});

export const createMockAlert = (overrides = {}) => ({
    id: 'alert-123',
    type: 'CRITICAL_DRIFT',
    title: 'Critical drift detected',
    message: 'A critical drift was detected',
    severity: 'CRITICAL',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
});

// API response helpers
export const mockApiResponse = <T>(data: T, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
});

export const mockPaginatedResponse = <T>(data: T[], total = 100, page = 1, limit = 10) => ({
    data,
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    },
});
