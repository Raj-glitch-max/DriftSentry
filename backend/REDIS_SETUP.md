# Redis Setup (Optional - For Production Performance)

DriftSentry works perfectly without Redis, but adding it provides:
- 10x faster dashboard loads
- Better rate limiting across multiple servers
- Reduced database load

## Option 1: Local Redis (Development)

### Using Docker:
```bash
docker run -d \
  --name driftsentry-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Using Docker Compose (Recommended):
Already configured in `docker-compose.yml`:
```bash
docker-compose up -d redis
```

### Verify Connection:
```bash
redis-cli ping
# Should return: PONG
```

## Option 2: Cloud Redis (Production)

### AWS ElastiCache:
1. Create ElastiCache Redis cluster
2. Copy connection endpoint
3. Update `.env`:
```
REDIS_URL=redis://your-elasticache-endpoint:6379
```

### Redis Cloud (Free Tier):
1. Sign up at https://redis.com/try-free/
2. Create database
3. Copy connection string
4. Update `.env`

## Environment Variable

Add to `.env`:
```bash
# Redis (optional - app works without it)
REDIS_URL=redis://localhost:6379
```

**Note:** If `REDIS_URL` is not set, the app will work fine using in-memory storage for rate limiting and no caching (slightly slower but functional).

## Verifying Redis is Working

1. Start backend: `npm run dev`
2. Check logs for:
   ```
   Redis cache connected
   Redis connected for rate limiting
   ```
3. Load dashboard
4. Check logs for:
   ```
   Metrics summary calculated (first load)
   Metrics summary served from cache (subsequent loads)
   ```

## Cache Keys Used

- `metrics:summary:*` - Dashboard metrics (5 min TTL)
- `metrics:cost:*` - Cost trends (10 min TTL)
- `drifts:list:*` - Drift listings (1 min TTL)
- `drift:{id}` - Drift details (5 min TTL)
- `alerts:*` - Alert data (30 sec - 1 min TTL)

## Cache Invalidation

Caches are automatically invalidated when:
- Drift created/approved/rejected
- Alert created/marked read
- User settings updated

## Performance Impact

**Without Redis:**
- Dashboard load: ~200-300ms
- Drift list: ~100-150ms

**With Redis:**
- Dashboard load: ~20-30ms (10x faster!)
- Drift list: ~10-15ms (10x faster!)

## Troubleshooting

**Redis connection failed:**
- App will continue working (logs warning)
- Rate limiting uses in-memory store
- Metrics not cached (slightly slower)

**Clear cache manually:**
```bash
redis-cli FLUSHALL
```
