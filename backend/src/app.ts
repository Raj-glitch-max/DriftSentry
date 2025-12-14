/**
 * Express Application Factory
 * Creates and configures the Express app with middleware stack
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { REQUEST_LIMITS, API_PREFIX } from './config/constants';
import { errorMiddleware } from './middleware/error.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { correlationIdMiddleware } from './middleware/correlation-id.middleware';
import { metricsMiddleware, metricsEndpoint } from './middleware/metrics.middleware';
import { globalLimiter } from './middleware/rateLimiter.middleware';
import { apiRoutes } from './routes';
import { healthRouter } from './routes/health.routes';
import { logger } from './utils/logger';

/**
 * Create Express application
 * Configured with security, logging, and error handling middleware
 */
export function createApp(): Express {
    const app = express();

    // ======== SECURITY ========
    // Comprehensive security headers
    app.use(
        helmet({
            // Content Security Policy
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (Next.js requirement)
                    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
                    imgSrc: ["'self'", 'data:', 'https:'],
                    connectSrc: [
                        "'self'",
                        env.corsOrigin,
                        'ws://localhost:3002', // WebSocket (dev)
                        'wss://api.driftsentry.com', // WebSocket (prod)
                    ],
                    fontSrc: ["'self'", 'https:', 'data:'],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'"], // Prevent clickjacking
                },
            },
            // Strict Transport Security (HTTPS only in production)
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
            },
            // Prevent MIME type sniffing
            noSniff: true,
            // Disable X-Powered-By header
            hidePoweredBy: true,
            // Referrer Policy
            referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
    );

    // CORS with credentials support
    app.use(
        cors({
            origin: env.corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID'],
            exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
            maxAge: 86400, // 24 hours
        })
    );

    // ======== PARSING ========
    app.use(express.json({ limit: REQUEST_LIMITS.JSON_SIZE }));
    app.use(express.urlencoded({ limit: REQUEST_LIMITS.URL_ENCODED_SIZE, extended: true }));

    // ======== OBSERVABILITY ========
    app.use(correlationIdMiddleware);  // Add trace ID to all requests
    app.use(metricsMiddleware);        // Collect Prometheus metrics
    app.use(loggingMiddleware);        // Request logging

    // ======== HEALTH CHECKS ========
    app.use('/health', healthRouter);  // /health/live, /health/ready, /health/detailed

    // ======== METRICS ENDPOINT ========
    app.get('/metrics', metricsEndpoint);  // Prometheus scraping

    // ======== RATE LIMITING ========
    app.use(API_PREFIX, globalLimiter);  // 100 requests/min per IP

    // ======== API ROUTES ========
    app.use(API_PREFIX, apiRoutes);

    // ======== 404 HANDLER ========
    app.use((req: Request, res: Response) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.path} not found`,
                traceId: req.correlationId,
                timestamp: new Date().toISOString(),
            },
        });
    });

    // ======== ERROR HANDLER (MUST BE LAST) ========
    app.use(errorMiddleware);

    logger.info('Express app created', {
        corsOrigin: env.corsOrigin,
        metricsEnabled: true,
        healthChecksEnabled: true,
    });

    return app;
}
