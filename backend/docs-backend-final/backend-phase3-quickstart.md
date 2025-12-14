# 🎯 BACKEND PHASE 3: READY FOR ANTIGRAVITY
## Quick Start Guide

---

## WHAT ANTIGRAVITY NEEDS TO BUILD

**Phase 3** = Authentication + Real-Time WebSocket  
**Duration** = 2-3 hours  
**Prerequisites** = Phase 1 ✅ + Phase 2 ✅ complete and working

---

## 5 THINGS TO BUILD

### 1️⃣ Auth Service (`src/services/auth.service.ts`)
- User login with email/password
- JWT token generation
- Token refresh logic
- Logout (revoke token)
- Password verification with bcrypt

### 2️⃣ JWT Utilities (`src/utils/jwt.ts` + `src/utils/password.ts`)
- Sign access token (15m expiry)
- Sign refresh token (7d expiry)
- Verify JWT signature + expiration
- Hash password with bcrypt
- Verify password against hash

### 3️⃣ Auth Middleware (`src/middleware/auth.middleware.ts`)
- Extract token from Authorization header
- Verify JWT and attach user to request
- `requireRole()` for RBAC protection
- Optional auth middleware

### 4️⃣ Auth Routes (`src/routes/auth.routes.ts`)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- Protect drift/alert routes with authMiddleware

### 5️⃣ WebSocket Real-Time (`src/websocket/socket.ts` + `src/websocket/events.ts`)
- Socket.io server with JWT auth
- Subscribe/unsubscribe to events
- Emit drift events (created, approved, rejected)
- Emit alert events (created, read)
- Services emit events after database writes

---

## KEY FILES PROVIDED

1. **backend-part3-prompt.md** (60 KB)
   - Complete implementation spec
   - Full code examples for all 5 sections
   - All endpoints defined with curl examples
   - Security best practices

2. **backend-part3-verification.md** (50 KB)
   - Vibe-coding security checklist
   - 10-step manual testing walkthrough
   - Logging verification
   - RBAC testing (3 user roles)
   - WebSocket testing
   - Performance targets

---

## QUICK CHECKLIST

**Before Antigravity starts**:
- [ ] Phase 2 API working (`curl http://localhost:3001/api/v1/drifts`)
- [ ] `npm run type-check` → 0 errors
- [ ] Dependencies installed:
  ```bash
  npm install jsonwebtoken bcrypt socket.io
  npm install --save-dev @types/jsonwebtoken @types/bcrypt
  ```
- [ ] `.env` has `JWT_SECRET=your-secret`
- [ ] Test users seeded in database:
  - admin@driftsentry.local / admin123
  - engineer@driftsentry.local / engineer123
  - viewer@driftsentry.local / viewer123

**After Antigravity delivers**:
- [ ] `npm run type-check` → 0 errors
- [ ] `npm run build` → success
- [ ] `npm run dev` → server + WebSocket start
- [ ] Login works: `curl POST /api/v1/auth/login`
- [ ] Protected routes require token
- [ ] RBAC enforced (viewer can't approve)
- [ ] WebSocket connects with valid token
- [ ] Real-time events received
- [ ] All three user roles tested
- [ ] No secrets in logs

---

## CRITICAL COMMANDS

```bash
# Build check
npm run type-check

# Start dev server (with WebSocket)
npm run dev

# Test login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@driftsentry.local","password":"admin123"}'

# Use token on protected endpoint
curl -X POST http://localhost:3001/api/v1/drifts/{id}/approve \
  -H "Authorization: Bearer {accessToken}" \
  -d '{"reason":"..."}'

# Test WebSocket (from browser)
const socket = io('http://localhost:3001', {
  auth: { token: 'your_token' }
});
```

---

## PHASE 3: THE SECURITY LAYER

**What gets locked down**:

| Endpoint | Public | Admin | Engineer | Viewer |
|----------|--------|-------|----------|--------|
| GET /drifts | ✅ | ✅ | ✅ | ✅ |
| GET /drifts/:id | ✅ | ✅ | ✅ | ✅ |
| POST /approve | ❌ | ✅ | ✅ | ❌ |
| POST /reject | ❌ | ✅ | ✅ | ❌ |
| GET /alerts | ✅ | ✅ | ✅ | ✅ |
| POST /mark-read | ❌ | ✅ | ✅ | ✅ |

---

## PHASE 3: THE REAL-TIME LAYER

**What happens**:

```
User A approves a drift
    ↓
Server writes to database
    ↓
emitDriftApproved() is called
    ↓
WebSocket broadcasts to all connected clients
    ↓
User B's browser receives drift:approved event
    ↓
Frontend updates UI without page refresh
```

**Events emitted**:
- `drift:created` - New drift detected
- `drift:approved` - Drift approved by engineer/admin
- `drift:rejected` - Drift rejected
- `alert:created` - New alert
- `alert:read` - Alert marked as read

---

## TOKEN LIFECYCLE

```
1. User Login
   POST /api/v1/auth/login
   ↓
   Returns: {accessToken (15m), refreshToken (7d)}

2. API Call
   Authorization: Bearer {accessToken}
   ↓
   Server verifies signature + expiration

3. Token Expires
   Access token expires after 15 minutes
   ↓
   Client gets new token using refresh token

4. Refresh Token
   POST /api/v1/auth/refresh
   with {refreshToken}
   ↓
   Returns: {new accessToken}

5. Logout
   POST /api/v1/auth/logout
   with {refreshToken}
   ↓
   Refresh token revoked in database
```

---

## ROLE-BASED ACCESS CONTROL (RBAC)

```typescript
// All 3 roles seeded in database:

1. admin@driftsentry.local
   - Can login
   - Can view all drifts
   - Can approve/reject drifts
   - Can mark alerts as read

2. engineer@driftsentry.local
   - Can login
   - Can view all drifts
   - Can approve/reject drifts
   - Can mark alerts as read

3. viewer@driftsentry.local
   - Can login
   - Can view all drifts
   - CANNOT approve/reject (will get 403)
   - Can mark alerts as read

// Routes protected:
router.post('/approve', authMiddleware, requireRole('admin', 'engineer'), handler);
router.post('/reject', authMiddleware, requireRole('admin', 'engineer'), handler);
```

---

## WEBSOCKET ROOMS

```
User connects with token
    ↓
socket.join(`user:{userId}`)      ← Personal messages
socket.join(`account:{accountId}`)  ← All account drifts
socket.join(`drifts`)               ← If subscribed
socket.join(`alerts`)               ← If subscribed

// Client can subscribe/unsubscribe:
socket.emit('subscribe:drifts')     ← Join drifts room
socket.emit('unsubscribe:drifts')   ← Leave drifts room
socket.emit('subscribe:alerts')     ← Join alerts room
```

---

## VIBE-CODING RULES FOR PHASE 3

**Non-negotiable security**:

```
✅ DO:
- Hash passwords with bcrypt before storing
- Verify JWT signature + expiration
- Use role from authenticated token (not from client)
- Authenticate WebSocket on connection
- Log important events without secrets
- Check RBAC before allowing operations
- Emit only necessary data (not secrets)
- Test with all 3 user roles

❌ NEVER:
- Store plain passwords
- Log passwords or tokens
- Trust client for role information
- Skip WebSocket authentication
- Emit sensitive data to all clients
- Use expired tokens
- Trust request body for userId (use token)
- Allow anyone to approve drifts
```

---

## NEXT AFTER PHASE 3

Once Phase 3 is verified ✅:
1. Frontend connects with real API
2. Users can login
3. Real-time updates work
4. Only authorized users can modify drifts
5. Phase 4 = Logging, monitoring, deployment

---

## SUCCESS SIGNALS

You'll know Phase 3 is complete when:

1. ✅ `npm run type-check` → 0 errors
2. ✅ `npm run build` → succeeds
3. ✅ Login works with seeded credentials
4. ✅ Tokens verify on protected routes
5. ✅ RBAC works (viewer gets 403)
6. ✅ WebSocket connects with token
7. ✅ WebSocket rejects without token
8. ✅ Real-time events broadcast
9. ✅ All 3 user roles tested
10. ✅ No secrets in logs

---

**Phase 3 is go!** Send `backend-part3-prompt.md` to Antigravity. 🔐📡
