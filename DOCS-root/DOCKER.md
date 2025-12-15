# Docker & DevOps Documentation

## Quick Start

### Local Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

### Build Individual Containers

**Backend:**
```bash
cd backend
docker build -t driftsentry-backend:latest .
docker run -p 3002:3001 driftsentry-backend:latest
```

**Frontend:**
```bash
cd frontend
docker build -t driftsentry-frontend:latest .
docker run -p 3000:3000 driftsentry-frontend:latest
```

## Architecture

### Services
- **postgres**: PostgreSQL 15 (port 5433 → 5432)
- **redis**: Redis 7 (port 6379)
- **backend**: Node.js/Express API (port 3002 → 3001)
- **frontend**: Next.js app (port 3000)

### Network
- All services on `driftsentry-network` bridge
- Services communicate using container names

### Volumes
- `postgres-data`: Persistent database storage

## Health Checks

All services have health checks:
- **postgres**: `pg_isready`
- **redis**: `redis-cli ping`
- **backend**: HTTP GET `/health/live`
- **frontend**: HTTP GET `/`

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Allowed frontend origin

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Production Deployment

See `working-docs/PHASE-8-DEVOPS-COMPLETE.md` for AWS deployment instructions.

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs <service-name>
```

**Database connection issues:**
```bash
docker-compose exec postgres psql -U admin -d driftsentry
```

**Reset everything:**
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d
```

## Phase 8 Status

- [x] **8A**: Docker setup (Dockerfiles created)
- [x] **8B**: docker-compose orchestration
- [ ] **8C**: GitHub Actions CI/CD
- [ ] **8D**: AWS infrastructure
- [ ] **8E**: Secrets management
- [ ] **8F**: Production deployment
- [ ] **8G**: Monitoring & logging
- [ ] **8H**: Load testing
