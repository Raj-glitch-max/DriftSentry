/**
 * Redis Cache Service
 * Provides caching layer for expensive queries
 */

import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

class CacheService {
    private client: Redis | null = null;
    private isConnected = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (!env.redisUrl) {
            logger.info('Redis URL not configured, caching disabled');
            return;
        }

        try {
            this.client = new Redis(env.redisUrl, {
                enableOfflineQueue: false,
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) {
                        logger.error('Redis max retries exceeded, disabling cache');
                        return null;
                    }
                    return Math.min(times * 100, 3000);
                },
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                logger.info('Redis cache connected');
            });

            this.client.on('error', (err) => {
                this.isConnected = false;
                logger.error('Redis cache error', { error: err.message });
            });

            this.client.on('close', () => {
                this.isConnected = false;
                logger.warn('Redis cache disconnected');
            });
        } catch (error) {
            logger.error('Failed to initialize Redis cache', {
                error: error instanceof Error ? error.message : String(error),
            });
            this.client = null;
        }
    }

    /**
     * Get cached value
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (!value) return null;

            return JSON.parse(value) as T;
        } catch (error) {
            logger.warn('Cache get error', { key, error });
            return null;
        }
    }

    /**
     * Set cached value with TTL (in seconds)
     */
    async set(key: string, value: any, ttl: number = 300): Promise<void> {
        if (!this.isConnected || !this.client) {
            return;
        }

        try {
            await this.client.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            logger.warn('Cache set error', { key, ttl, error });
        }
    }

    /**
     * Delete cached value
     */
    async delete(key: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            return;
        }

        try {
            await this.client.del(key);
        } catch (error) {
            logger.warn('Cache delete error', { key, error });
        }
    }

    /**
     * Delete multiple keys matching pattern
     */
    async deletePattern(pattern: string): Promise<void> {
        if (!this.isConnected || !this.client) {
            return;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                logger.debug('Cache invalidated', { pattern, count: keys.length });
            }
        } catch (error) {
            logger.warn('Cache delete pattern error', { pattern, error });
        }
    }

    /**
     * Check if cache is available
     */
    isAvailable(): boolean {
        return this.isConnected && this.client !== null;
    }

    /**
     * Close cache connection
     */
    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
        }
    }
}

// Export singleton
export const cacheService = new CacheService();

/**
 * Cache key generators
 */
export const CacheKeys = {
    metrics: {
        summary: (accountId?: string) =>
            accountId ? `metrics:summary:${accountId}` : 'metrics:summary:global',
        costTrend: (days: number, accountId?: string) =>
            accountId ? `metrics:cost:${days}:${accountId}` : `metrics:cost:${days}:global`,
    },
    drifts: {
        list: (page: number, accountId?: string) =>
            accountId ? `drifts:list:${page}:${accountId}` : `drifts:list:${page}:global`,
        detail: (id: string) => `drift:${id}`,
        count: (accountId?: string) =>
            accountId ? `drifts:count:${accountId}` : 'drifts:count:global',
    },
    alerts: {
        list: (page: number, accountId?: string) =>
            accountId ? `alerts:list:${page}:${accountId}` : `alerts:list:${page}:global`,
        unread: (accountId?: string) =>
            accountId ? `alerts:unread:${accountId}` : 'alerts:unread:global',
    },
};

/**
 * Cache TTLs (in seconds)
 */
export const CacheTTL = {
    METRICS_SUMMARY: 300, // 5 minutes
    COST_TREND: 600, // 10 minutes
    DRIFT_LIST: 60, // 1 minute
    DRIFT_DETAIL: 300, // 5 minutes
    ALERT_LIST: 60, // 1 minute
    ALERT_COUNT: 30, // 30 seconds
};
