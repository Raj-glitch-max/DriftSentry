/**
 * Rate Limiter Middleware
 * Prevents abuse by limiting requests per IP/user
 * Uses Redis for distributed rate limiting (with graceful fallback to memory)
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Create Redis client with robust error handling
 * Retries connection and gracefully falls back to memory store if Redis unavailable
 */
let redisClient: Redis | null = null;
let redisAvailable = false;

async function initializeRedis(): Promise<void> {
    try {
        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                logger.debug(`Redis retry attempt ${times}, waiting ${delay}ms`);
                return delay;
            },
            enableOfflineQueue: false, // Don't queue commands if Redis is down
            lazyConnect: true, // Don't connect immediately
        });

        // Wait for connection (with timeout)
        await Promise.race([
            redis.connect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
            ),
        ]);

        // Test connection
        await redis.ping();

        redisClient = redis;
        redisAvailable = true;
        logger.info('✅ Redis connected successfully for rate limiting');

        // Handle connection errors
        redis.on('error', (err) => {
            logger.error('Redis connection error:', { error: err.message });
            redisAvailable = false;
        });

        redis.on('reconnecting', () => {
            logger.warn('Redis reconnecting...');
        });

        redis.on('ready', () => {
            logger.info('Redis ready');
            redisAvailable = true;
        });

    } catch (error) {
        logger.warn('⚠️  Redis unavailable, using memory store for rate limiting', {
            error: error instanceof Error ? error.message : String(error),
        });
        redisClient = null;
        redisAvailable = false;
    }
}

// Initialize Redis asynchronously (don't block app startup)
initializeRedis();

/**
 * Global API rate limiter
 * 100 requests per minute per IP
 */
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later.',
        },
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Use Redis store ONLY if available, otherwise use default memory store
    store: (redisAvailable && redisClient) ? new RedisStore({
        // @ts-ignore - type mismatch with latest ioredis, safe to bypass
        sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)),
    }) : undefined, // undefined = use default MemoryStore
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
        });
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests, please try again later.',
            },
        });
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per minute per IP (prevents credential stuffing)
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Only 5 login attempts per minute
    skipSuccessfulRequests: false, // Count all requests
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: (redisAvailable && redisClient) ? new RedisStore({
        // @ts-ignore - type mismatch with latest ioredis, safe to bypass
        sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)),
    }) : undefined,
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Too many authentication attempts. Please wait before trying again.',
            },
        });
    },
});

/**
 * Moderate rate limiter for API key operations
 * 10 requests per hour per IP (API key regeneration)
 */
export const apiKeyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        error: {
            code: 'API_KEY_RATE_LIMIT_EXCEEDED',
            message: 'Too many API key operations, please try again later.',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: (redisAvailable && redisClient) ? new RedisStore({
        // @ts-ignore - type mismatch with latest ioredis, safe to bypass
        sendCommand: (...args: string[]) => redisClient!.call(args[0], ...args.slice(1)),
    }) : undefined,
});

export { redisClient };
