# 📊 BACKEND PHASE 3: VERIFICATION & VIBE-CODING GUIDE
## Authentication & Real-Time Implementation Checklist

---

## PHASE 3 OVERVIEW

**What You're Building**: Secure authentication + real-time WebSocket layer  
**Duration**: 2-3 hours  
**Status**: Building on Phase 1 ✅ + Phase 2 ✅  
**Difficulty**: Medium-Hard (crypto, async patterns, socket management)

---

## CRITICAL PHASE 3 CONCEPTS

### JWT Token Flow

```
User Login
    ↓
Verify Email + Password (bcrypt)
    ↓
Generate 2 Tokens:
  - accessToken (short-lived, 15m, for API calls)
  - refreshToken (long-lived, 7d, for getting new access tokens)
    ↓
Store refreshToken in DB (immutable audit trail)
    ↓
Return both tokens to client
    ↓
Client uses accessToken in Authorization header
    ↓
Server verifies JWT signature & expiration
    ↓
Client uses refreshToken to get new accessToken (if expired)
```

### RBAC Pattern

```
Route Handler
    ↓
authMiddleware (verify JWT, attach user)
    ↓
requireRole('admin', 'engineer') (check user.role)
    ↓
If allowed → call handler
If denied → return 403 Forbidden
```

### WebSocket Authentication

```
Client connects with token
    ↓
io.use() middleware intercepts connection
    ↓
Verify JWT token from auth param
    ↓
If invalid → reject connection
If valid → attach user to socket
    ↓
socket.on('connection')
    ↓
User joins rooms: user:{id}, account:{accountId}
```

### Event Emission Pattern

```
Service writes to database
    ↓
emitDriftCreated(drift)  ← Called after successful write
    ↓
Event sent to all connected clients in drifts room
    ↓
Frontend receives real-time update
    ↓
UI updates without page refresh
```

---

## PRE-IMPLEMENTATION CHECKLIST

**Before Antigravity starts**:

- [ ] Phase 2 API endpoints are **fully working**
- [ ] `npm run type-check` passes with 0 errors
- [ ] Database is running with Phase 1 seed data
- [ ] All Phase 2 routes respond correctly
- [ ] Dependencies installed: `jsonwebtoken`, `bcrypt`, `socket.io`
  ```bash
  npm install jsonwebtoken bcrypt socket.io
  npm install --save-dev @types/jsonwebtoken @types/bcrypt
  ```
- [ ] `.env` file has `JWT_SECRET` (can be anything for dev)
  ```env
  JWT_SECRET=your-super-secret-key-change-in-production
  ```
- [ ] Test users seeded in database:
  - admin@driftsentry.local / admin123
  - engineer@driftsentry.local / engineer123
  - viewer@driftsentry.local / viewer123

---

## VIBE-CODING STANDARDS FOR PHASE 3

### Authentication Security (Critical)

```typescript
// ✅ CORRECT - Hash password before storing
async login(input: LoginInput) {
  const user = await userRepository.getByEmail(input.email);
  if (!user) throw new AuthError('Invalid credentials');
  
  const passwordMatch = await verifyPassword(
    input.password,
    user.passwordHash  // HASHED in database
  );
  
  if (!passwordMatch) throw new AuthError('Invalid credentials');
}

// ❌ WRONG - Storing plain password
const user = await prisma.user.create({
  data: {
    email: input.email,
    passwordHash: input.password  // NOT hashed!
  }
});

// ❌ WRONG - Exposing password hash in response
res.json({
  user: {
    email: user.email,
    passwordHash: user.passwordHash  // NEVER send this!
  }
});

// ✅ CORRECT - Only return necessary fields
res.json({
  user: {
    id: user.id,
    email: user.email,
    role: user.role  // No password or hash
  }
});
```

### Token Handling (Critical)

```typescript
// ✅ CORRECT - Verify signature + expiration
function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET, {
      audience: 'api',
      issuer: 'driftsentry',
    }) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

// ❌ WRONG - Not verifying signature
const decoded = jwt.decode(token);  // No verification!
return decoded;

// ❌ WRONG - Not checking expiration
const payload = jwt.verify(token, secret);
// Assumes jwt.verify handles expiration automatically
// (it does, but be explicit)

// ✅ CORRECT - Log token generation
logger.info('Token generated', {
  userId: user.id,
  expiresIn: '15m',
});

// ❌ WRONG - Logging the token itself
logger.info('Generated token', { token });  // NEVER!
```

### Role-Based Access Control (RBAC)

```typescript
// ✅ CORRECT - Use role from authenticated token
router.post('/approve', authMiddleware, requireRole('admin', 'engineer'), async (req, res) => {
  const userId = req.user.id;        // From token (trusted)
  const role = req.user.role;        // From token (trusted)
  
  if (!['admin', 'engineer'].includes(role)) {
    throw new Error('Unauthorized');
  }
});

// ❌ WRONG - Trust role from request body
router.post('/approve', async (req, res) => {
  const role = req.body.role;        // Client can forge this!
  
  if (role === 'admin') {
    // Dangerous! Client can fake admin role
  }
});

// ❌ WRONG - No role verification
router.post('/approve', async (req, res) => {
  // Anyone can approve drifts!
  await driftService.approve(req.body.driftId);
});

// ✅ CORRECT - Role checks are readable
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    next();
  };
}
```

### WebSocket Security

```typescript
// ✅ CORRECT - Authenticate on connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('No token'));
  }
  
  try {
    const payload = verifyToken(token);
    socket.user = payload;  // Attach to socket
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// ❌ WRONG - No authentication
io.on('connection', (socket) => {
  // Anyone can connect and receive all events!
});

// ❌ WRONG - Authenticating custom events too late
io.on('connection', (socket) => {
  socket.on('custom-event', (data) => {
    // By now, socket is connected without auth check
  });
});

// ✅ CORRECT - Check authorization on sensitive events
socket.on('subscribe:admin-events', () => {
  if (socket.user.role !== 'admin') {
    socket.emit('error', { message: 'Forbidden' });
    return;
  }
  
  socket.join('admin-events');
});

// ✅ CORRECT - Only emit safe data
io.to('drifts').emit('drift:created', {
  id: drift.id,
  severity: drift.severity,
  costImpactMonthly: drift.costImpactMonthly,
  // Don't emit: expectedState, actualState (might have secrets)
});

// ❌ WRONG - Emitting sensitive data to all clients
io.emit('internal-metrics', {
  databaseQueryTime: 150,
  memoryUsage: 512000,
  secretApiKey: 'xxx',  // NEVER!
});
```

### Error Messages (Security)

```typescript
// ✅ CORRECT - Generic error for login
if (!user || !passwordMatch) {
  throw new AuthError('Invalid email or password');
  // Doesn't reveal which field is wrong
}

// ❌ WRONG - Revealing which part failed
if (!user) {
  throw new Error('User not found');  // Email doesn't exist
}
if (!passwordMatch) {
  throw new Error('Password is incorrect');  // Now we know user exists
}

// ✅ CORRECT - Logging sensitive info, not returning it
logger.debug('Login failed', {
  email: input.email,
  reason: 'User not found',
});

res.status(401).json({
  error: 'Invalid email or password'  // Generic
});
```

### Async/Await Patterns

```typescript
// ✅ CORRECT - Try-catch with proper error re-throw
async function login(input: LoginInput) {
  try {
    const user = await userRepository.getByEmail(input.email);
    if (!user) throw new AuthError('Invalid credentials');
    
    const match = await verifyPassword(input.password, user.passwordHash);
    if (!match) throw new AuthError('Invalid credentials');
    
    return { accessToken, refreshToken, user };
  } catch (error) {
    logger.error('Login failed', { error });
    throw error;  // Let middleware handle
  }
}

// ❌ WRONG - Silent failures
async function login(input: LoginInput) {
  const user = await userRepository.getByEmail(input.email);
  // What if getByEmail throws? It propagates unhandled!
  
  return { user };
}

// ❌ WRONG - Swallowing errors
async function login(input: LoginInput) {
  try {
    const user = await userRepository.getByEmail(input.email);
  } catch (error) {
    // Error disappears here
    console.log('something went wrong');
  }
}

// ✅ CORRECT - Logging context with errors
logger.error('Password verification failed', {
  userId: user.id,
  email: user.email,
  error: error instanceof Error ? error.message : String(error),
  timestamp: new Date().toISOString(),
});
```

---

## POST-IMPLEMENTATION VERIFICATION

### Step 1: TypeScript Compilation

```bash
npm run type-check

# Expected output:
# ✅ No errors found
#
# If errors:
# - Check all function signatures have explicit return types
# - Verify all imports are correct
# - Ensure all async functions return Promise<T>
```

### Step 2: Build

```bash
npm run build

# Expected: dist/ folder created with .js files
```

### Step 3: Server Startup

```bash
npm run dev

# Expected output:
# 🚀 Server started on port 3001
# 📡 WebSocket ready
#
# Check logs for:
# - No errors during startup
# - Database connection successful
# - Socket.io initialized
```

### Step 4: Manual Login Test

```bash
# Test valid credentials
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@driftsentry.local",
    "password": "admin123"
  }'

# Expected: 200 with:
# {
#   "success": true,
#   "data": {
#     "accessToken": "eyJhbGc...",
#     "refreshToken": "random_string",
#     "user": { "id": "...", "email": "...", "role": "admin" }
#   }
# }
```

### Step 5: Test Protected Endpoint Without Token

```bash
curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"reason": "This should fail"}'

# Expected: 401 with:
# {
#   "success": false,
#   "error": {
#     "code": "AUTH_ERROR",
#     "message": "Invalid or expired token",
#     "timestamp": "..."
#   }
# }
```

### Step 6: Test Protected Endpoint With Token

```bash
# Use the accessToken from login response
ACCESS_TOKEN="eyJhbGc..."

curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"reason": "This change is acceptable"}'

# Expected: 200 with updated drift
```

### Step 7: Test RBAC (Viewer Cannot Approve)

```bash
# Login as viewer
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@driftsentry.local",
    "password": "viewer123"
  }'

# Try to approve with viewer token
curl -X POST "http://localhost:3001/api/v1/drifts/{drift-id}/approve" \
  -H "Authorization: Bearer {viewer-token}" \
  -d '{"reason": "..."}'

# Expected: 403 with:
# {
#   "success": false,
#   "error": {
#     "code": "FORBIDDEN",
#     "message": "Insufficient permissions"
#   }
# }
```

### Step 8: Test Token Refresh

```bash
# Get tokens from login
REFRESH_TOKEN="random_string"

curl -X POST "http://localhost:3001/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "'$REFRESH_TOKEN'"}'

# Expected: 200 with:
# {
#   "success": true,
#   "data": {
#     "accessToken": "new_jwt_token"
#   }
# }
```

### Step 9: Test WebSocket Connection

**From browser console**:

```javascript
// Connect with valid token
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_access_token'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('Socket ID:', socket.id);
  
  // Subscribe to drifts
  socket.emit('subscribe:drifts');
});

socket.on('drift:created', (event) => {
  console.log('📢 New drift received:', event);
});

socket.on('drift:approved', (event) => {
  console.log('✅ Drift approved:', event);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});
```

**Test without token**:

```javascript
// Try to connect without token
const socket = io('http://localhost:3001');

socket.on('connect_error', (error) => {
  console.log('❌ Expected error:', error.message);
  // Should say "No token" or "Authentication failed"
});
```

### Step 10: Test Real-Time Event Emission

**In one terminal** (Monitor logs):

```bash
npm run dev
# Keep this running to see logs
```

**In another terminal** (Send request):

```bash
# Login to get token
TOKEN="eyJhbGc..."

# Approve a drift (should emit drift:approved)
curl -X POST "http://localhost:3001/api/v1/drifts/{id}/approve" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "..."}'
```

**In browser console** (Receive event):

```javascript
// Should log:
// 📢 New drift received: { id: '...', status: 'approved', ... }
```

---

## LOGGING VERIFICATION

**Check logs contain**:

```
✅ "User logged in" with userId, email (no password)
✅ "Token generated" with userId, expiresIn (no token)
✅ "Token verified" with userId, path
✅ "Authorization failed" with userId, role, requiredRoles
✅ "WebSocket connected" with socketId, userId
✅ "Drift approved" with driftId, approvedBy, duration
✅ "Emitted drift:approved" with driftId (NOT secret data)

❌ No entries with: passwords, tokens, API keys, secrets
❌ No plain `console.log()` (use logger)
```

---

## SECURITY CHECKLIST

**Before marking Phase 3 complete**:

- [ ] Passwords are hashed with bcrypt (check DB)
- [ ] JWT tokens verified with signature check
- [ ] Role-based access control enforced on all protected routes
- [ ] WebSocket requires valid JWT to connect
- [ ] No secrets logged (check logs/application.log)
- [ ] Error messages don't reveal which part failed
- [ ] Tokens not exposed in URLs (only Authorization header)
- [ ] Refresh token stored hashed in database
- [ ] CORS configured for frontend domain
- [ ] Password validation (min 8 chars enforced)

---

## PERFORMANCE TARGETS FOR PHASE 3

| Operation | Target | Metric |
|-----------|--------|--------|
| Login | <200ms | Password hash + DB write |
| Token Refresh | <100ms | JWT generation |
| WebSocket Connect | <50ms | Token verification |
| Drift Approval | <300ms | Update + emit |
| Real-time Event | <50ms | Socket.io broadcast |

**Measure**:

```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
logger.debug('Operation', { duration });
```

---

## INTEGRATION POINTS FOR FRONTEND

**Frontend expects**:

1. **Login endpoint**: `POST /api/v1/auth/login`
   - Send: `{ email, password }`
   - Receive: `{ accessToken, refreshToken, user }`

2. **Protected routes**: Add header
   ```
   Authorization: Bearer {accessToken}
   ```

3. **Token refresh**: `POST /api/v1/auth/refresh`
   - Send: `{ refreshToken }`
   - Receive: `{ accessToken }`

4. **WebSocket connection**:
   ```javascript
   io('...', { auth: { token: accessToken } })
   ```

5. **Real-time events**:
   - `drift:created`, `drift:approved`, `drift:rejected`
   - `alert:created`, `alert:read`

---

## CRITICAL VIBE-CODING DO's AND DON'Ts

### 🚫 NEVER

```
❌ Store plain passwords in database
❌ Log tokens or passwords
❌ Trust client for role information
❌ Skip WebSocket authentication
❌ Emit sensitive data to all clients
❌ Use expired tokens
❌ Store refresh token in plaintext
❌ Allow any role to approve drifts
❌ Skip error handling on async operations
❌ Commit JWT_SECRET to git (use .env)
```

### ✅ ALWAYS

```
✅ Hash passwords before storing
✅ Verify JWT signature + expiration
✅ Use role from authenticated token
✅ Authenticate WebSocket on connection
✅ Emit only necessary, safe data
✅ Reject expired tokens immediately
✅ Hash refresh tokens in database
✅ Enforce role-based access control
✅ Handle all errors with try-catch
✅ Use environment variables for secrets
✅ Log contextual information without secrets
✅ Test all three user roles (admin, engineer, viewer)
✅ Test both token flows (fresh, refreshed)
✅ Test WebSocket with valid + invalid tokens
```

---

## PHASE 3: SUCCESS SIGNALS

✅ **Complete when**:

1. `npm run type-check` → 0 errors
2. `npm run build` → success
3. All 3 auth endpoints working (login, refresh, logout)
4. JWT tokens verify correctly
5. Protected routes require token
6. RBAC working (viewer can't approve)
7. WebSocket connects with valid token
8. WebSocket rejects invalid token
9. Real-time events emit after operations
10. Logs don't contain secrets
11. No console.log() in code
12. All roles can login and use appropriate endpoints

---

**Phase 3 Verified!** Time for Phase 4 (final): Logging & Deployment. 🚀
