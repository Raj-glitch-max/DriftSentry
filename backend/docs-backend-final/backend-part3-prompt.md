# 🚀 BACKEND PHASE 3: AUTHENTICATION & REAL-TIME
## Implementation Prompt for Antigravity
**Target**: Production-ready JWT auth + WebSocket real-time updates  
**Estimated Duration**: 2-3 hours  
**Stack**: Node.js + Express + Prisma + Socket.io + jsonwebtoken  
**Status**: Building on solid Phase 1 + Phase 2 foundation

---

## MISSION BRIEFING

You are building the **authentication & real-time layer** that secures the API and enables live updates. This is Part 3 of 4:

```
Phase 1: Domain Modeling & Data Persistence    ✅ COMPLETE
         (Database, Types, Repositories)

Phase 2: API Contracts & Service Layer         ✅ COMPLETE
         (REST endpoints, Business Logic, Validation)

Phase 3: Authentication & Real-Time            ← YOU ARE HERE
         (JWT, RBAC, WebSocket, Sessions)

Phase 4: Deployment & Operations               Coming next
         (Logging, Monitoring, Docker)
```

**Success Criteria**:
- ✅ Login/logout/refresh endpoints implemented
- ✅ JWT token generation & verification working
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC) on protected endpoints
- ✅ WebSocket real-time drift/alert updates
- ✅ Client authentication on socket connection
- ✅ Zero TypeScript errors
- ✅ All endpoints secured
- ✅ Frontend can login and receive real-time updates

---

## PART 3: BREAKDOWN

### Section 3.1: User Authentication Service

**Objective**: Login, refresh tokens, password hashing

**Files to Create**:

```
src/services/
├── auth.service.ts              ← Login, refresh, logout logic
└── (existing drift, alert services updated with auth checks)

src/utils/
├── jwt.ts                        ← JWT creation and verification
└── password.ts                   ← Bcrypt hashing/verification
```

**Code Example: `src/utils/jwt.ts`**

```typescript
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types/api/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const ACCESS_TOKEN_EXPIRES_IN = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d';   // 7 days

/**
 * Sign JWT access token
 */
export function signAccessToken(payload: {
  userId: string;
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    audience: 'api',
    issuer: 'driftsentry',
  });
}

/**
 * Sign JWT refresh token (long-lived)
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    audience: 'api',
    issuer: 'driftsentry',
  });
}

/**
 * Verify JWT token
 * @throws Error if invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      audience: 'api',
      issuer: 'driftsentry',
    }) as any;
    
    return {
      userId: payload.userId || payload.sub,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(
  authHeader?: string
): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
```

**Code Example: `src/utils/password.ts`**

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash password for storage
 * Use on user registration/password change
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 * Use on login
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Code Example: `src/services/auth.service.ts`**

```typescript
import { logger } from '@/utils/logger';
import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { signAccessToken, signRefreshToken, verifyToken } from '@/utils/jwt';
import { hashPassword, verifyPassword } from '@/utils/password';
import { AuthError, ValidationError, NotFoundError } from '@/utils/errors';
import type { LoginInput, RefreshInput } from '@/types/api/auth';

/**
 * AuthService
 * Handles user authentication and token management
 */
export class AuthService {
  /**
   * User login
   * 
   * @throws ValidationError if invalid credentials
   * @throws NotFoundError if user not found
   * @throws AuthError if password incorrect
   */
  async login(input: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
  }> {
    const startTime = Date.now();
    
    try {
      // 1. Find user by email
      const user = await userRepository.getByEmail(input.email);
      
      if (!user) {
        logger.warn('Login failed: user not found', {
          email: input.email,
          duration: Date.now() - startTime,
        });
        throw new AuthError('Invalid email or password');
      }
      
      // 2. Check if user is active
      if (!user.isActive) {
        logger.warn('Login failed: user inactive', {
          userId: user.id,
          duration: Date.now() - startTime,
        });
        throw new AuthError('Account is disabled');
      }
      
      // 3. Verify password
      const passwordMatch = await verifyPassword(
        input.password,
        user.passwordHash
      );
      
      if (!passwordMatch) {
        logger.warn('Login failed: invalid password', {
          userId: user.id,
          duration: Date.now() - startTime,
        });
        throw new AuthError('Invalid email or password');
      }
      
      // 4. Generate tokens
      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as any,
      });
      
      const refreshToken = signRefreshToken(user.id);
      
      // 5. Create session in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);  // 7 days
      
      await sessionRepository.create({
        userId: user.id,
        refreshToken,
        expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      
      // 6. Update last login
      await userRepository.updateLastLogin(user.id);
      
      logger.info('User logged in', {
        userId: user.id,
        email: user.email,
        duration: Date.now() - startTime,
      });
      
      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : String(error),
        email: input.email,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refresh(input: RefreshInput): Promise<{
    accessToken: string;
  }> {
    try {
      // 1. Find session
      const session = await sessionRepository.getByRefreshToken(
        input.refreshToken
      );
      
      if (!session) {
        throw new AuthError('Invalid refresh token');
      }
      
      // 2. Check if revoked or expired
      if (session.isRevoked || new Date() > session.expiresAt) {
        throw new AuthError('Refresh token expired or revoked');
      }
      
      // 3. Get user
      const user = await userRepository.getById(session.userId);
      
      if (!user || !user.isActive) {
        throw new AuthError('User not found or inactive');
      }
      
      // 4. Generate new access token
      const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role as any,
      });
      
      // 5. Update session last_used_at
      await sessionRepository.updateLastUsed(session.id);
      
      logger.debug('Token refreshed', { userId: user.id });
      
      return { accessToken };
    } catch (error) {
      logger.error('Refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  
  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const session = await sessionRepository.getByRefreshToken(
        refreshToken
      );
      
      if (session) {
        await sessionRepository.revoke(session.id);
      }
      
      logger.debug('User logged out');
    } catch (error) {
      logger.error('Logout failed', { error });
      throw error;
    }
  }
}

export const authService = new AuthService();
```

**Requirements**:

1. ✅ JWT tokens with proper expiration (access: 15m, refresh: 7d)
2. ✅ Bcrypt password hashing (10 salt rounds)
3. ✅ Token verification with audience/issuer checks
4. ✅ Session table integration (immutable audit trail)
5. ✅ All errors logged without exposing sensitive data
6. ✅ Password strength validation (min 8 chars)
7. ✅ Account active/inactive status check
8. ✅ Session revocation on logout
9. ✅ Last login timestamp update
10. ✅ Exported as singleton

---

### Section 3.2: Authentication Middleware

**Objective**: Verify JWT and attach user to request

**File**: `src/middleware/auth.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, verifyToken } from '@/utils/jwt';
import { AuthError } from '@/utils/errors';
import { logger } from '@/utils/logger';

/**
 * JWT verification middleware
 * Extracts token from Authorization header, verifies it, and attaches user to request
 * 
 * Usage:
 * app.use('/api/v1/protected', authMiddleware, routes);
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(
      req.headers.authorization
    );
    
    if (!token) {
      throw new AuthError('Missing authorization token');
    }
    
    const payload = verifyToken(token);
    
    // Attach user to request
    (req as any).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    
    logger.debug('Token verified', {
      userId: payload.userId,
      path: req.path,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
    });
    
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Role-based access control middleware
 * 
 * Usage:
 * router.post('/approve', authMiddleware, requireRole('admin', 'engineer'), handler);
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Not authenticated',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    if (!allowedRoles.includes(user.role)) {
      logger.warn('Authorization failed', {
        userId: user.id,
        role: user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this action',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    next();
  };
}

/**
 * Optional auth middleware
 * Sets user if token present, allows request to continue if not
 * 
 * Usage:
 * app.use(optionalAuthMiddleware);  // All routes can check req.user
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = extractTokenFromHeader(
      req.headers.authorization
    );
    
    if (token) {
      const payload = verifyToken(token);
      (req as any).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch (error) {
    // Ignore auth errors, allow unauthenticated access
    logger.debug('Optional auth skipped', {
      reason: error instanceof Error ? error.message : 'No token',
    });
  }
  
  next();
}
```

**Requirements**:

1. ✅ Extract token from `Authorization: Bearer {token}` header
2. ✅ Verify token with proper error handling
3. ✅ Attach `req.user` with userId, email, role
4. ✅ Require role middleware for RBAC
5. ✅ Optional auth middleware for flexible routes
6. ✅ All failures logged without exposing secrets
7. ✅ Proper HTTP status codes (401, 403)
8. ✅ Error messages don't reveal sensitive info

---

### Section 3.3: Authentication Routes (Endpoints)

**Objective**: Login, refresh, logout endpoints

**File**: `src/routes/auth.routes.ts`

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '@/services/auth.service';
import { validateRequest } from '@/schemas';
import { loginSchema, refreshSchema } from '@/schemas/auth.schema';
import { logger } from '@/utils/logger';

/**
 * Authentication Routes
 */
export const authRouter = Router();

/**
 * POST /api/v1/auth/login
 * User login with email and password
 * 
 * Request Body:
 * {
 *   email: string (valid email),
 *   password: string (min 8 chars)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     accessToken: string (JWT, expires 15m),
 *     refreshToken: string (random, expires 7d),
 *     user: { id, email, role }
 *   }
 * }
 */
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Validate input
    const input = validateRequest(loginSchema, req.body);
    
    // Add context for logging
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Call service
    const result = await authService.login({
      ...input,
      ipAddress: ipAddress as string,
      userAgent: userAgent as string,
    });
    
    logger.info('POST /api/v1/auth/login', {
      email: input.email,
      role: result.user.role,
      duration: Date.now() - startTime,
    });
    
    // Return tokens (client stores them)
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 * 
 * Request Body:
 * {
 *   refreshToken: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     accessToken: string (new JWT)
 *   }
 * }
 */
authRouter.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const input = validateRequest(refreshSchema, req.body);
    
    // Call service
    const result = await authService.refresh(input);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user (revoke refresh token)
 * 
 * Request Body:
 * {
 *   refreshToken: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: null
 * }
 */
authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token required',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    await authService.logout(refreshToken);
    
    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

export default authRouter;
```

**Protect endpoints with auth middleware**:

```typescript
// In src/routes/drift.routes.ts - require auth + role

import { authMiddleware, requireRole } from '@/middleware/auth.middleware';

// Public endpoints (no auth)
driftRouter.get('/', async (req, res, next) => { /* list */ });
driftRouter.get('/:id', async (req, res, next) => { /* get */ });

// Protected endpoints (require auth)
driftRouter.post(
  '/:id/approve',
  authMiddleware,
  requireRole('admin', 'engineer'),
  async (req, res, next) => { /* approve */ }
);

driftRouter.post(
  '/:id/reject',
  authMiddleware,
  requireRole('admin', 'engineer'),
  async (req, res, next) => { /* reject */ }
);
```

**Requirements**:

1. ✅ POST /auth/login returns accessToken + refreshToken
2. ✅ POST /auth/refresh exchanges refresh token for new access token
3. ✅ POST /auth/logout revokes refresh token
4. ✅ All endpoints validate input with Zod
5. ✅ Protected routes use authMiddleware + requireRole
6. ✅ All errors logged with context
7. ✅ Proper HTTP status codes
8. ✅ No secrets in response bodies

---

### Section 3.4: WebSocket Real-Time Updates

**Objective**: Real-time drift/alert updates via Socket.io

**Files to Create**:

```
src/websocket/
├── socket.ts                    ← Socket.io server setup
├── handlers/
│   ├── drift.handler.ts         ← Drift events
│   ├── alert.handler.ts         ← Alert events
│   └── index.ts
└── events.ts                    ← Event definitions
```

**Code Example: `src/websocket/socket.ts`**

```typescript
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '@/utils/jwt';
import { logger } from '@/utils/logger';

/**
 * WebSocket authentication
 * Verify JWT token from client and attach user to socket
 */
function authenticateSocket(socket: Socket, next: Function): void {
  const token = socket.handshake.auth.token || 
                socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication failed: missing token'));
  }
  
  try {
    const payload = verifyToken(token as string);
    (socket as any).user = {
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
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  
  // Middleware: authenticate all connections
  io.use(authenticateSocket);
  
  // Connection handler
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    
    logger.info('WebSocket connected', {
      socketId: socket.id,
      userId: user.id,
    });
    
    // Join user-specific room
    socket.join(`user:${user.id}`);
    
    // Join account room (all drifts for this account)
    socket.join(`account:${user.accountId || 'global'}`);
    
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
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket disconnected', {
        socketId: socket.id,
        userId: user.id,
        reason,
      });
    });
    
    // Error handling
    socket.on('error', (error) => {
      logger.error('WebSocket error', {
        socketId: socket.id,
        userId: user.id,
        error: error?.message || String(error),
      });
    });
  });
  
  logger.info('WebSocket server initialized');
  
  return io;
}

/**
 * Global socket.io instance (for emitting from services)
 */
let globalIO: SocketIOServer;

export function getIO(): SocketIOServer {
  if (!globalIO) {
    throw new Error('Socket.io not initialized. Call setupWebSocket first.');
  }
  return globalIO;
}

export function setIO(io: SocketIOServer): void {
  globalIO = io;
}
```

**Code Example: `src/websocket/events.ts`**

```typescript
import { getIO } from './socket';
import type { Drift, Alert } from '@/types/domain';
import { logger } from '@/utils/logger';

/**
 * Emit drift:created event to relevant clients
 */
export function emitDriftCreated(drift: Drift): void {
  try {
    const io = getIO();
    
    const event = {
      id: drift.id,
      resourceId: drift.resourceId,
      resourceType: drift.resourceType,
      region: drift.region,
      severity: drift.severity,
      costImpactMonthly: drift.costImpactMonthly,
      detectedAt: drift.detectedAt,
      status: drift.status,
    };
    
    // Emit to all subscribers
    io.to('drifts').emit('drift:created', event);
    io.to(`account:${drift.accountId || 'global'}`).emit('drift:created', event);
    
    logger.debug('Emitted drift:created', { driftId: drift.id });
  } catch (error) {
    logger.error('Failed to emit drift:created', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Emit drift:approved event
 */
export function emitDriftApproved(drift: Drift, approvedBy: string): void {
  try {
    const io = getIO();
    
    io.to('drifts').emit('drift:approved', {
      id: drift.id,
      status: drift.status,
      approvedAt: drift.approvedAt,
      approvedBy,
    });
    
    logger.debug('Emitted drift:approved', { driftId: drift.id });
  } catch (error) {
    logger.error('Failed to emit drift:approved', { error });
  }
}

/**
 * Emit drift:rejected event
 */
export function emitDriftRejected(drift: Drift, rejectedBy: string): void {
  try {
    const io = getIO();
    
    io.to('drifts').emit('drift:rejected', {
      id: drift.id,
      status: drift.status,
      rejectedAt: drift.rejectedAt,
      rejectedBy,
    });
    
    logger.debug('Emitted drift:rejected', { driftId: drift.id });
  } catch (error) {
    logger.error('Failed to emit drift:rejected', { error });
  }
}

/**
 * Emit alert:created event
 */
export function emitAlertCreated(alert: Alert): void {
  try {
    const io = getIO();
    
    io.to('alerts').emit('alert:created', {
      id: alert.id,
      driftId: alert.driftId,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      createdAt: alert.createdAt,
    });
    
    logger.debug('Emitted alert:created', { alertId: alert.id });
  } catch (error) {
    logger.error('Failed to emit alert:created', { error });
  }
}

/**
 * Emit alert:read event
 */
export function emitAlertRead(alertId: string): void {
  try {
    const io = getIO();
    
    io.to('alerts').emit('alert:read', { id: alertId });
    
    logger.debug('Emitted alert:read', { alertId });
  } catch (error) {
    logger.error('Failed to emit alert:read', { error });
  }
}
```

**Update services to emit events**:

```typescript
// In src/services/drift.service.ts

import { emitDriftCreated, emitDriftApproved } from '@/websocket/events';

async approveDrift(...): Promise<Drift> {
  // ... existing logic ...
  
  const updated = await driftRepository.updateStatus(driftId, 'approved', {
    approvedAt: new Date(),
    approvedBy: userId,
    approvalReason: input.reason,
  });
  
  // Emit to all connected clients
  emitDriftApproved(updated, userId);
  
  return updated;
}
```

**Update server startup**:

```typescript
// In src/server.ts

import http from 'http';
import { createApp } from './app';
import { setupWebSocket, setIO } from '@/websocket/socket';

async function startServer(port: number = 3001): Promise<void> {
  const app = createApp();
  
  // Create HTTP server
  const httpServer = http.createServer(app);
  
  // Setup WebSocket
  const io = setupWebSocket(httpServer);
  setIO(io);  // Make globally available
  
  // Start listening
  httpServer.listen(port, () => {
    logger.info(`🚀 Server started on port ${port}`);
    logger.info(`📡 WebSocket ready`);
  });
}
```

**Requirements**:

1. ✅ Socket.io server setup with CORS
2. ✅ JWT authentication on socket connection
3. ✅ User joins personal + account rooms
4. ✅ Subscribe/unsubscribe event handlers
5. ✅ Emit drift events (created, approved, rejected)
6. ✅ Emit alert events (created, read)
7. ✅ Services emit events after DB writes
8. ✅ All event emissions logged
9. ✅ Error handling on all socket operations
10. ✅ Connection/disconnection logging

---

### Section 3.5: Validation Schemas for Auth

**File**: `src/schemas/auth.schema.ts`

```typescript
import { z } from 'zod';

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request schema
 */
export const refreshSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token required'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

/**
 * Logout request schema
 */
export const logoutSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token required'),
});

export type LogoutInput = z.infer<typeof logoutSchema>;
```

**Requirements**:

1. ✅ Email validation (format check)
2. ✅ Password strength validation (min 8 chars)
3. ✅ Token format validation
4. ✅ Type exports for TypeScript
5. ✅ Clear error messages

---

## DELIVERABLES CHECKLIST

**By the end of Phase 3, deliver**:

- [ ] Auth service (`src/services/auth.service.ts`)
- [ ] JWT utilities (`src/utils/jwt.ts`)
- [ ] Password utilities (`src/utils/password.ts`)
- [ ] Auth middleware (`src/middleware/auth.middleware.ts`)
- [ ] Auth routes (`src/routes/auth.routes.ts`)
- [ ] WebSocket setup (`src/websocket/socket.ts`)
- [ ] WebSocket events (`src/websocket/events.ts`)
- [ ] Auth validation schemas (`src/schemas/auth.schema.ts`)
- [ ] User repository updated with auth methods
- [ ] Session repository (`src/repositories/session.repository.ts`)
- [ ] All services updated to emit WebSocket events
- [ ] Server updated to use HTTP + Socket.io
- [ ] Protected routes have proper auth middleware
- [ ] All TypeScript types compile
- [ ] Zero console warnings

---

## PHASE 3: VIBE-CODING VERIFICATION CHECKLIST

### ✅ Code Quality Gates

**1. TypeScript Verification**

```bash
npm run type-check

# Expected output:
# ✅ No errors found in your code
```

**2. Build**

```bash
npm run build
```

**3. Server Startup**

```bash
npm run dev

# Expected output:
# 🚀 Server started on port 3001
# 📡 WebSocket ready
```

### 🧪 Manual Testing Checklist

**Auth flow**:

```bash
# 1. Login (use seeded test user)
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@driftsentry.local",
    "password": "admin123"
  }'

# Expected: 200 with accessToken, refreshToken, user

# 2. Use token to access protected endpoint
curl -X POST "http://localhost:3001/api/v1/drifts/{id}/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{"reason": "This change is acceptable"}'

# Expected: 200 with updated drift

# 3. Try without token
curl -X POST "http://localhost:3001/api/v1/drifts/{id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"reason": "This change is acceptable"}'

# Expected: 401 Unauthorized

# 4. Try with wrong role (viewer cannot approve)
# (Login as viewer@driftsentry.local)
# Expected: 403 Forbidden

# 5. Refresh token
curl -X POST "http://localhost:3001/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "{refreshToken}"}'

# Expected: 200 with new accessToken

# 6. Logout
curl -X POST "http://localhost:3001/api/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "{refreshToken}"}'

# Expected: 200 with success
```

**WebSocket connection**:

```javascript
// From browser console or client
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_access_token'
  }
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Subscribe to drifts
  socket.emit('subscribe:drifts');
});

socket.on('drift:created', (event) => {
  console.log('New drift!', event);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

---

## CRITICAL VIBE-CODING RULES FOR PHASE 3

### 🚫 NEVER DO

```typescript
// ❌ Don't store token in localStorage without HttpOnly flag
localStorage.setItem('token', accessToken);  // XSS vulnerability!

// ❌ Don't log passwords or tokens
logger.info('User login', { password: input.password });  // NO!

// ❌ Don't trust client for user ID
const userId = req.body.userId;  // Use req.user.id from token!

// ❌ Don't emit sensitive data to all clients
io.emit('user:created', { user: { password_hash, ... } });

// ❌ Don't skip password hashing
const user = await userRepository.create({
  passwordHash: input.password  // NO! Hash it!
});

// ❌ Don't allow role manipulation from client
const role = req.body.role;  // Always use token's role!

// ❌ Don't skip socket authentication
io.on('connection', (socket) => {
  // Verify auth immediately, don't wait for custom events
});
```

### ✅ ALWAYS DO

```typescript
// ✅ Do hash passwords
const passwordHash = await hashPassword(input.password);
const user = await userRepository.create({
  email: input.email,
  passwordHash,
});

// ✅ Do verify tokens
const payload = verifyToken(token);
(req as any).user = payload;

// ✅ Do use role from token
const canApprove = req.user.role === 'admin' || req.user.role === 'engineer';

// ✅ Do check role on protected routes
router.post(
  '/approve',
  authMiddleware,
  requireRole('admin', 'engineer'),
  handler
);

// ✅ Do sanitize logs
logger.info('Login', { email: user.email });  // No password!

// ✅ Do emit only necessary data
socket.emit('drift:created', {
  id: drift.id,
  severity: drift.severity,
  // Don't emit: expectedState, actualState (might have secrets)
});

// ✅ Do authenticate sockets
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = verifyToken(token);  // Throws if invalid
  next();
});
```

---

## PHASE 3: SUCCESS SIGNALS

When complete, you should be able to:

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -d '{"email":"admin@driftsentry.local","password":"admin123"}'
# Returns: accessToken, refreshToken

# 2. Use token for protected endpoints
curl -X POST http://localhost:3001/api/v1/drifts/{id}/approve \
  -H "Authorization: Bearer {token}" \
  -d '{"reason":"..."}'
# Returns: 200 with updated drift

# 3. Connect WebSocket
# Browser: io(http://localhost:3001, { auth: { token } })
# Receives: drift:created, alert:created events in real-time

# 4. Refresh token
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -d '{"refreshToken":"{token}"}'
# Returns: new accessToken

# 5. Logout
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -d '{"refreshToken":"{token}"}'

# 6. No TypeScript errors
npm run type-check
```

---

**Phase 3 Ready!** Time to add security & real-time magic. 🔐📡
