/**
 * Prometheus Metrics Service
 * Collect application metrics for monitoring
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a new registry
const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

/**
 * HTTP Request counter
 */
const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
});

/**
 * HTTP Request duration histogram
 */
const httpRequestDuration = new Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [register],
});

/**
 * Error counter
 */
const errorsTotal = new Counter({
    name: 'errors_total',
    help: 'Total errors',
    labelNames: ['code', 'path'],
    registers: [register],
});

/**
 * Database query duration
 */
const databaseQueryDuration = new Histogram({
    name: 'database_query_duration_ms',
    help: 'Database query duration in milliseconds',
    labelNames: ['operation', 'table'],
    buckets: [1, 5, 10, 25, 50, 100, 250, 500],
    registers: [register],
});

/**
 * Active WebSocket connections
 */
const websocketConnections = new Gauge({
    name: 'websocket_connections_active',
    help: 'Active WebSocket connections',
    registers: [register],
});

/**
 * Prometheus Metrics Service
 */
export class PrometheusService {
    /**
     * Get Prometheus registry
     */
    static getRegistry(): Registry {
        return register;
    }

    /**
     * Record HTTP request
     */
    static recordRequest(
        method: string,
        path: string,
        status: number,
        durationMs: number
    ): void {
        // Normalize path (remove IDs for cardinality control)
        const normalizedPath = normalizePath(path);

        httpRequestsTotal.labels(method, normalizedPath, String(status)).inc();
        httpRequestDuration.labels(method, normalizedPath, String(status)).observe(durationMs);
    }

    /**
     * Record error
     */
    static recordError(code: string, path: string): void {
        const normalizedPath = normalizePath(path);
        errorsTotal.labels(code, normalizedPath).inc();
    }

    /**
     * Record database query
     */
    static recordDatabaseQuery(
        operation: string,
        table: string,
        durationMs: number
    ): void {
        databaseQueryDuration.labels(operation, table).observe(durationMs);
    }

    /**
     * Set active WebSocket connections
     */
    static setWebSocketConnections(count: number): void {
        websocketConnections.set(count);
    }

    /**
     * Get metrics in Prometheus format
     */
    static async getMetrics(): Promise<string> {
        return register.metrics();
    }

    /**
     * Get content type for metrics
     */
    static getContentType(): string {
        return register.contentType;
    }
}

/**
 * Normalize path for metrics (remove UUIDs and numeric IDs)
 */
function normalizePath(path: string): string {
    return path
        // Replace UUIDs
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
        // Replace numeric IDs
        .replace(/\/\d+/g, '/:id')
        // Remove trailing slash
        .replace(/\/+$/, '')
        || '/';
}

export default PrometheusService;
