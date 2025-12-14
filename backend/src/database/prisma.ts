/**
 * Prisma Client Singleton
 * Ensures single instance across application
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

/**
 * Create Prisma client with appropriate logging
 */
const createPrismaClient = (): PrismaClient => {
    const client = new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });

    // Log queries in development
    if (process.env['NODE_ENV'] !== 'production') {
        client.$on('query', (e) => {
            logger.debug('Database query', {
                query: e.query,
                params: e.params,
                duration: `${e.duration}ms`,
            });
        });
    }

    // Always log errors
    client.$on('error', (e) => {
        logger.error('Database error', {
            message: e.message,
            target: e.target,
        });
    });

    // Always log warnings
    client.$on('warn', (e) => {
        logger.warn('Database warning', {
            message: e.message,
        });
    });

    return client;
};

/**
 * Prisma client singleton
 * Uses global variable in development to survive hot reloads
 */
export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
    globalThis.prisma = prisma;
}

/**
 * Graceful shutdown handler
 */
export async function disconnectPrisma(): Promise<void> {
    logger.info('Disconnecting from database...');
    await prisma.$disconnect();
    logger.info('Database disconnected');
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error('Database health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}

export default prisma;
