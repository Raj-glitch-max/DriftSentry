# Load Testing - DriftSentry

## Phase 8H: Performance & Load Testing

Verify application performance under load before going live.

## Tools

### 1. Artillery (Recommended)

Install:
```bash
npm install -g artillery@latest
```

### 2. Apache Bench (Simple)

Pre-installed on most systems:
```bash
ab -V
```

### 3. k6 (Advanced)

```bash
brew install k6  # macOS
```

## Load Test Scenarios

### Scenario 1: Basic Health Check

**Goal:** Verify infrastructure can handle traffic

```bash
artillery quick --count 100 --num 10 http://<PUBLIC_IP>:3001/health/live
```

**Expected:**
- Response time: < 100ms
- Success rate: 100%
- 0 errors

### Scenario 2: Dashboard Load

Test the most-accessed endpoint:

```yaml
# load-tests/dashboard.yml
config:
  target: "http://<PUBLIC_IP>:3001"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/sec
    - duration: 120
      arrivalRate: 20  # Ramp to 20/sec
    - duration: 60
      arrivalRate: 50  # Peak at 50/sec
  http:
    timeout: 5

scenarios:
  - name: "Dashboard metrics"
    flow:
      - get:
          url: "/api/v1/metrics/summary"
          headers:
            Authorization: "Bearer {{auth_token}}"
      - think: 2  # 2 second pause
      - get:
          url: "/api/v1/drifts"
      - get:
          url: "/api/v1/alerts"
```

Run:
```bash
artillery run load-tests/dashboard.yml
```

**Success criteria:**
- p95 response time < 500ms
- p99 response time < 1000ms
- Success rate > 99%
- No memory leaks

### Scenario 3: API Stress Test

```yaml
# load-tests/stress.yml
config:
  target: "http://<PUBLIC_IP>:3001"
  phases:
    - duration: 300
      arrivalRate: 100  # 100 requests/sec for 5 minutes
  http:
    timeout: 10

scenarios:
  - name: "Mixed operations"
    weight: 7
    flow:
      - get:
          url: "/api/v1/drifts"
  - name: "Write operations"
    weight: 3
    flow:
      - post:
          url: "/api/v1/drifts"
          json:
            resourceId: "{{ $randomString() }}"
            resourceType: "aws.ec2.instance"
            severity: "high"
```

**Success criteria:**
- Sustained 100 req/sec
- Error rate < 0.1%
- Database connections stable
- Memory usage stable

### Scenario 4: Rate Limiting Test

Verify rate limiting works:

```bash
# Should get 429 Too Many Requests
ab -n 200 -c 10 http://<PUBLIC_IP>:3001/api/v1/auth/login
```

**Expected:**
- First 50-100 requests succeed
- Remaining requests return 429
- Rate limiting working correctly

## Performance Benchmarks

### Backend API

| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /health/live | < 50ms | ___ ms |
| GET /api/v1/metrics/summary | < 200ms | ___ ms |
| GET /api/v1/drifts | < 300ms | ___ ms |
| POST /api/v1/drifts | < 500ms | ___ ms |
| GET /api/v1/drifts/:id/timeline | < 400ms | ___ ms |

### Frontend

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | ___ s |
| Time to Interactive | < 3s | ___ s |
| Largest Contentful Paint | < 2.5s | ___ s |

## Database Performance

```bash
# Monitor database during load test
aws rds describe-db-instances \
  --db-instance-identifier driftsentry-db \
  --query "DBInstances[0].{CPU:CpuUtilization,Connections:ActiveConnections}"
```

**Targets:**
- CPU < 70%
- Connections < 80% of max
- No connection pool exhaustion

## Redis Cache Performance

Monitor cache hit rate:

```bash
# Inside Redis container
redis-cli info stats | grep keyspace_hits
redis-cli info stats | grep keyspace_misses
```

**Target cache hit rate:** > 80%

## Load Test Script

```bash
#!/bin/bash
# load-tests/run-all.sh

echo "🚀 Starting DriftSentry load tests..."

# 1. Health check
echo "\n📊 Test 1: Health check (100 requests)"
artillery quick --count 100 --num 10 http://$BACKEND_URL/health/live

# 2. Dashboard load
echo "\n📊 Test 2: Dashboard load (60 seconds)"
artillery run load-tests/dashboard.yml

# 3. Stress test
echo "\n📊 Test 3: Stress test (5 minutes)"
artillery run load-tests/stress.yml

# 4. Report
echo "\n✅ Load testing complete!"
echo "Review artillery reports in ./artillery-reports/"
```

## Monitoring During Tests

```bash
# Terminal 1: Application logs
aws logs tail /ecs/driftsentry-backend --follow

# Terminal 2: Metrics
watch -n 5 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=driftsentry-backend \
  --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average'

# Terminal 3: Run load test
artillery run load-tests/dashboard.yml
```

## Performance Tuning

If tests fail:

1. **Slow responses:**
   - Check database query performance
   - Verify Redis caching working
   - Check for N+1 queries

2. **High CPU:**
   - Increase Fargate CPU allocation
   - Profile code for hotspots
   - Add caching

3. **Memory leaks:**
   - Check for unclosed connections
   - Monitor memory over time
   - Review event listeners

4. **Database bottleneck:**
   - Add database indexes
   - Optimize queries
   - Consider read replicas

## Production Readiness Checklist

- [ ] All load tests pass
- [ ] p95 response time < 500ms
- [ ] Error rate < 0.1%
- [ ] Rate limiting working
- [ ] Database connections stable
- [ ] Memory usage stable
- [ ] No memory leaks
- [ ] Cache hit rate > 80%
- [ ] CloudWatch alarms tested
- [ ] Rollback procedure tested

## Cost

Load testing should use existing infrastructure - **no additional cost.**

Run tests during development hours to avoid wasting free tier resources.

## Phase 8H Complete ✅

Load testing procedures documented and ready for execution!

## Final Phase 8 Status

- [x] **8A**: Docker containerization
- [x] **8B**: docker-compose orchestration
- [x] **8C**: GitHub Actions CI/CD
- [x] **8D**: AWS infrastructure
- [x] **8E**: Secrets management
- [x] **8F**: Production deployment
- [x] **8G**: Monitoring & logging
- [x] **8H**: Load testing

**🎉 PHASE 8 COMPLETE! 🎉**
