/**
 * API configuration for DriftSentry
 */

export const API_CONFIG = {
    /** Base URL for API requests */
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',

    /** Request timeout in milliseconds */
    timeout: 30000,

    /** API version */
    version: 'v1',

    /** Endpoints */
    endpoints: {
        drifts: '/drifts',
        metrics: '/metrics',
        alerts: '/alerts',
        costTrend: '/cost/trend',
        auth: {
            login: '/auth/login',
            logout: '/auth/logout',
            refresh: '/auth/refresh',
        },
    },

    /** WebSocket URL */
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
} as const;

/** React Query configuration */
export const QUERY_CONFIG = {
    /** Default stale time (5 minutes) */
    staleTime: 5 * 60 * 1000,

    /** Default cache time (10 minutes) */
    gcTime: 10 * 60 * 1000,

    /** Number of retries on failure */
    retry: 2,

    /** Retry delay calculation */
    retryDelay: (attemptIndex: number): number =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
} as const;
