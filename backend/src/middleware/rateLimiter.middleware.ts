/**
 * Rate Limiting Middleware
 * Protects API from abuse, DDoS attacks, and credential stuffing
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Redis client for rate limiting
let redisClient: Redis | undefined;

// Only use Redis if URL is configured, otherwise fall back to memory store
if (env.redisUrl) {
    try {
        redisClient = new Redis(env.redisUrl, {
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3,
        });

        redisClient.on('error', (err) => {
            logger.error('Redis connection error for rate limiting', { error: err.message });
        });

        redisClient.on('connect', () => {
            logger.info('Redis connected for rate limiting');
        });
    } catch (error) {
        logger.warn('Failed to connect to Redis, using memory store for rate limiting', {
            error: error instanceof Error ? error.message : String(error),
        });
        redisClient = undefined;
    }
}

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
    // Use Redis store if available, otherwise use default memory store
    ...(redisClient && {
        store: new RedisStore({
            sendCommand: ((...args: string[]) => redisClient!.call(...args)) as any,
        }),
    }),
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
    ...(redisClient && {
        store: new RedisStore({
            sendCommand: ((...args: string[]) => redisClient!.call(...args)) as any,
        }),
    }),
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
    ...(redisClient && {
        store: new RedisStore({
            sendCommand: ((...args: string[]) => redisClient!.call(...args)) as any,
        }),
    }),
});

export { redisClient };
