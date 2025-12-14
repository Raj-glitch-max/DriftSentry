/**
 * API-related TypeScript types for DriftSentry
 */

/**
 * Standard API response wrapper
 */
export interface APIResponse<T> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: APIError;
    readonly timestamp: string;
}

/**
 * API error structure
 */
export interface APIError {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly statusCode?: number;
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
    readonly items: readonly T[];
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly hasMore: boolean;
}

/**
 * Empty paginated response (for safe defaults)
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
    return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false,
    };
}

/**
 * Discriminated union for async data states
 */
export type AsyncState<T> =
    | { readonly status: 'idle' }
    | { readonly status: 'loading' }
    | { readonly status: 'success'; readonly data: T }
    | { readonly status: 'error'; readonly error: Error; readonly retry: () => Promise<void> };

/**
 * Helper to check if async state is loading
 */
export function isLoading<T>(state: AsyncState<T>): state is { status: 'loading' } {
    return state.status === 'loading';
}

/**
 * Helper to check if async state is success
 */
export function isSuccess<T>(state: AsyncState<T>): state is { status: 'success'; data: T } {
    return state.status === 'success';
}

/**
 * Helper to check if async state is error
 */
export function isError<T>(state: AsyncState<T>): state is { status: 'error'; error: Error; retry: () => Promise<void> } {
    return state.status === 'error';
}

/**
 * Generic query parameters base
 */
export interface BaseQueryParams {
    readonly page?: number;
    readonly limit?: number;
    readonly sortBy?: string;
    readonly sortOrder?: 'asc' | 'desc';
}

/**
 * User session type (for auth)
 */
export interface User {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly role: 'admin' | 'user' | 'viewer';
    readonly avatar?: string;
}

/**
 * Auth state
 */
export interface AuthState {
    readonly user: User | null;
    readonly token: string | null;
    readonly isAuthenticated: boolean;
    readonly isLoading: boolean;
}
