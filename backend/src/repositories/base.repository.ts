/**
 * Base Repository Abstract Class
 * Common functionality for all repositories
 */

import { logger } from '../utils/logger';
import type { PaginatedResult } from '../types/api/responses';

/**
 * Base interface for entities with ID
 */
export interface BaseEntity {
    id: string;
}

/**
 * Base filter interface with pagination
 */
export interface BaseFilters {
    page: number;
    limit: number;
}

/**
 * Abstract base repository with common operations
 * All repositories extend this for consistent behavior
 * @template T - Entity type
 * @template F - Filter type (extends BaseFilters)
 * @template R - Result type for list (can differ from T, e.g., for UserPublic)
 */
export abstract class BaseRepository<T extends BaseEntity, F extends BaseFilters = BaseFilters, R = T> {
    protected readonly entityName: string;

    constructor(entityName: string) {
        this.entityName = entityName;
    }

    /**
     * Get entity by ID
     */
    abstract getById(id: string): Promise<T | null>;

    /**
     * List entities with pagination
     */
    abstract list(filters: F): Promise<PaginatedResult<R>>;

    /**
     * Delete entity by ID
     */
    abstract delete(id: string): Promise<boolean>;

    /**
     * Log successful operation
     */
    protected logSuccess(operation: string, context: Record<string, unknown> = {}): void {
        logger.debug(`${this.entityName}: ${operation}`, context);
    }

    /**
     * Log failed operation
     */
    protected logError(operation: string, error: unknown, context: Record<string, unknown> = {}): void {
        logger.error(`${this.entityName}: ${operation} failed`, {
            ...context,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    /**
     * Calculate pagination offset
     */
    protected calculateOffset(page: number, limit: number): number {
        return (page - 1) * limit;
    }

    /**
     * Validate pagination parameters
     */
    protected validatePagination(page: number, limit: number): boolean {
        return page >= 1 && limit >= 1 && limit <= 100;
    }
}
