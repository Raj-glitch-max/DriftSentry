/**
 * Server Entry Point
 * Starts the Express server with WebSocket support and graceful shutdown
 */

import http from 'http';
import { createApp } from './app';
import { env, validateEnv } from './config/env';
import { prisma, disconnectPrisma } from './database/prisma';
import { setupWebSocket, setIO } from './websocket';
import { logger } from './utils/logger';

/**
 * Start the server
 */
async function main(): Promise<void> {
    try {
        // 1. Validate environment
        validateEnv();
        logger.info('Environment validated');

        // 2. Test database connection
        await prisma.$connect();
        logger.info('Database connected');

        // 3. Create Express app
        const app = createApp();

        // 4. Create HTTP server (required for Socket.io)
        const httpServer = http.createServer(app);

        // 5. Setup WebSocket
        const io = setupWebSocket(httpServer);
        setIO(io);

        // 6. Start listening
        httpServer.listen(env.port, env.host, () => {
            logger.info(`🚀 Server started`, {
                port: env.port,
                host: env.host,
                environment: env.nodeEnv,
                apiPrefix: '/api/v1',
            });
            logger.info(`📊 Health: http://${env.host}:${env.port}/health`);
            logger.info(`📚 API: http://${env.host}:${env.port}/api/v1`);
            logger.info(`📡 WebSocket ready`);
        });

        // ======== GRACEFUL SHUTDOWN ========

        const shutdown = async (signal: string): Promise<void> => {
            logger.info(`${signal} received, shutting down gracefully...`);

            // Close WebSocket connections
            io.close(() => {
                logger.info('WebSocket server closed');
            });

            // Stop accepting new connections
            httpServer.close(async () => {
                logger.info('HTTP server closed');

                // Disconnect from database
                await disconnectPrisma();
                logger.info('Database disconnected');

                logger.info('Shutdown complete');
                process.exit(0);
            });

            // Force shutdown after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught errors
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught exception', {
                error: error.message,
                stack: error.stack,
            });
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: unknown) => {
            logger.error('Unhandled rejection', {
                reason: reason instanceof Error ? reason.message : String(reason),
            });
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server', {
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
}

// Start the server
main().catch((error: unknown) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
