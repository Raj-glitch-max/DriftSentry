/**
 * WebSocket Server Setup
 * Socket.io with JWT authentication
 */

import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { env } from '../config/env';

/**
 * Authenticated socket user
 */
interface SocketUser {
    id: string;
    email: string;
    role: 'admin' | 'engineer' | 'viewer';
}

/**
 * Extend Socket to include user
 */
interface AuthenticatedSocket extends Socket {
    user: SocketUser;
}

/**
 * Global Socket.io instance
 */
let globalIO: SocketIOServer | null = null;

/**
 * WebSocket authentication middleware
 * Verify JWT token from client and attach user to socket
 */
function authenticateSocket(
    socket: Socket,
    next: (err?: Error) => void
): void {
    const token =
        (socket.handshake.auth['token'] as string) ??
        (socket.handshake.query['token'] as string);

    if (!token) {
        return next(new Error('Authentication failed: missing token'));
    }

    try {
        const payload = verifyToken(token);
        (socket as AuthenticatedSocket).user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };
        next();
    } catch (error) {
        next(new Error('Authentication failed: invalid token'));
    }
}

/**
 * Create Socket.io server and attach to HTTP server
 */
export function setupWebSocket(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.corsOrigin,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // Middleware: authenticate all connections
    io.use(authenticateSocket);

    // Connection handler
    io.on('connection', (socket: Socket) => {
        const user = (socket as AuthenticatedSocket).user;

        logger.info('WebSocket connected', {
            socketId: socket.id,
            userId: user.id,
            email: user.email,
        });

        // Join user-specific room
        socket.join(`user:${user.id}`);

        // Join global rooms (can be refined by account later)
        socket.join('global');

        // Subscribe to drift updates
        socket.on('subscribe:drifts', () => {
            socket.join('drifts');
            logger.debug('Subscribed to drifts', { socketId: socket.id });
        });

        // Unsubscribe from drift updates
        socket.on('unsubscribe:drifts', () => {
            socket.leave('drifts');
            logger.debug('Unsubscribed from drifts', { socketId: socket.id });
        });

        // Subscribe to alerts
        socket.on('subscribe:alerts', () => {
            socket.join('alerts');
            logger.debug('Subscribed to alerts', { socketId: socket.id });
        });

        // Unsubscribe from alerts
        socket.on('unsubscribe:alerts', () => {
            socket.leave('alerts');
            logger.debug('Unsubscribed from alerts', { socketId: socket.id });
        });

        // Handle disconnect
        socket.on('disconnect', (reason: string) => {
            logger.info('WebSocket disconnected', {
                socketId: socket.id,
                userId: user.id,
                reason,
            });
        });

        // Error handling
        socket.on('error', (error: Error) => {
            logger.error('WebSocket error', {
                socketId: socket.id,
                userId: user.id,
                error: error?.message ?? String(error),
            });
        });
    });

    logger.info('WebSocket server initialized');

    return io;
}

/**
 * Get global Socket.io instance
 * @throws Error if not initialized
 */
export function getIO(): SocketIOServer {
    if (!globalIO) {
        throw new Error('Socket.io not initialized. Call setupWebSocket first.');
    }
    return globalIO;
}

/**
 * Set global Socket.io instance
 * Called after setupWebSocket
 */
export function setIO(io: SocketIOServer): void {
    globalIO = io;
}

/**
 * Check if Socket.io is initialized
 */
export function isIOInitialized(): boolean {
    return globalIO !== null;
}
