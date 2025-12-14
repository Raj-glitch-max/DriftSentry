/**
 * Environment Configuration
 * Type-safe environment variables with validation
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment configuration object
 * All environment variables accessed through this object
 */
export const env = {
    // Node environment
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    isProduction: process.env['NODE_ENV'] === 'production',
    isDevelopment: process.env['NODE_ENV'] !== 'production',

    // Server
    port: parseInt(process.env['PORT'] ?? '3001', 10),
    host: process.env['HOST'] ?? '0.0.0.0',

    // Database
    databaseUrl: process.env['DATABASE_URL'] ?? '',

    // CORS
    corsOrigin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',

    // Redis (optional - for caching and rate limiting)
    redisUrl: process.env['REDIS_URL'] ?? '',

    // Logging
    logLevel: process.env['LOG_LEVEL'] ?? 'debug',
} as const;

/**
 * Validate required environment variables
 * Call this at startup to fail fast
 */
export function validateEnv(): void {
    const required: (keyof typeof env)[] = ['databaseUrl'];
    const missing: string[] = [];

    for (const key of required) {
        if (!env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            `Check your .env file or environment configuration.`
        );
    }
}

export type Env = typeof env;
