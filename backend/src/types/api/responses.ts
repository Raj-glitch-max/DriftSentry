/**
 * API Response Types
 * Standard envelope for all API responses
 */

/**
 * Successful API response wrapper
 */
export interface ApiResponse<T = null> {
    success: true;
    data: T;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    success: true;
    data: {
        items: T[];
        pagination: Pagination;
    };
}

/**
 * Pagination metadata
 */
export interface Pagination {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
}

/**
 * Create pagination metadata from query results
 */
export function createPagination(
    total: number,
    page: number,
    pageSize: number
): Pagination {
    const totalPages = Math.ceil(total / pageSize);
    return {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
    };
}

/**
 * Paginated result from repository
 */
export interface PaginatedResult<T> {
    items: T[];
    total: number;
}
