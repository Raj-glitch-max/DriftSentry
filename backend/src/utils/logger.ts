/**
 * Structured Logger for DriftSentry Backend
 * Uses Pino for high-performance JSON logging
 */

import pino from 'pino';

/**
 * Log levels enum for type safety
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Context object for structured logging
 */
export interface LogContext {
    [key: string]: unknown;
}

/**
 * Create pino logger with appropriate settings
 */
const createLogger = () => {
    const isDevelopment = process.env['NODE_ENV'] !== 'production';
    const logLevel = (process.env['LOG_LEVEL'] as LogLevel) || (isDevelopment ? 'debug' : 'info');

    return pino({
        level: logLevel,
        transport: isDevelopment
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
        base: {
            service: 'driftsentry-backend',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => ({ level: label }),
        },
        // Redact sensitive fields from logs
        redact: {
            paths: [
                'password',
                'passwordHash',
                'password_hash',
                'token',
                'accessToken',
                'refreshToken',
                'refresh_token',
                'authorization',
                'Authorization',
                'cookie',
                'Cookie',
                'secret',
                'apiKey',
                'api_key',
            ],
            censor: '[REDACTED]',
        },
    });
};

const pinoLogger = createLogger();

/**
 * Logger wrapper with consistent interface
 * Never logs sensitive data (redacted by pino config)
 */
export const logger = {
    /**
     * Debug level - for detailed debugging info
     */
    debug: (message: string, context?: LogContext): void => {
        pinoLogger.debug(context ?? {}, message);
    },

    /**
     * Info level - for normal operation events
     */
    info: (message: string, context?: LogContext): void => {
        pinoLogger.info(context ?? {}, message);
    },

    /**
     * Warn level - for potentially problematic situations
     */
    warn: (message: string, context?: LogContext): void => {
        pinoLogger.warn(context ?? {}, message);
    },

    /**
     * Error level - for error conditions
     */
    error: (message: string, context?: LogContext): void => {
        pinoLogger.error(context ?? {}, message);
    },

    /**
     * Fatal level - for unrecoverable errors
     */
    fatal: (message: string, context?: LogContext): void => {
        pinoLogger.fatal(context ?? {}, message);
    },

    /**
     * Create a child logger with additional context
     */
    child: (context: LogContext) => {
        const childLogger = pinoLogger.child(context);
        return {
            debug: (message: string, ctx?: LogContext) => childLogger.debug(ctx ?? {}, message),
            info: (message: string, ctx?: LogContext) => childLogger.info(ctx ?? {}, message),
            warn: (message: string, ctx?: LogContext) => childLogger.warn(ctx ?? {}, message),
            error: (message: string, ctx?: LogContext) => childLogger.error(ctx ?? {}, message),
            fatal: (message: string, ctx?: LogContext) => childLogger.fatal(ctx ?? {}, message),
        };
    },
};

export default logger;
