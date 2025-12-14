# DriftSentry Backend

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `0.0.0.0` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT signing | Dev default (change in production!) |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `debug` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run test` | Run unit and integration tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

```
src/
├── app.ts              # Express app factory (createApp)
├── server.ts           # Entry point (startServer)
├── config/             # Environment and app configuration
├── routes/             # API route definitions
│   ├── health.routes.ts    # Health check endpoints
│   ├── auth.routes.ts      # Authentication routes
│   └── drifts.routes.ts    # Drift management routes
├── services/           # Business logic layer
├── repositories/       # Data access layer (Prisma)
├── middleware/         # Express middleware
├── utils/              # Shared utilities
├── types/              # TypeScript types
└── websocket/          # Real-time events (Socket.io)
```

## API Endpoints

### Health Checks
- `GET /health/live` - Liveness probe (is process alive?)
- `GET /health/ready` - Readiness probe (can accept traffic?)
- `GET /health/detailed` - Detailed health with metrics

### Metrics
- `GET /metrics` - Prometheus metrics

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Drifts
- `GET /api/v1/drifts` - List drifts (paginated)
- `GET /api/v1/drifts/:id` - Get drift details
- `POST /api/v1/drifts/:id/approve` - Approve drift
- `POST /api/v1/drifts/:id/reject` - Reject drift

### Alerts
- `GET /api/v1/alerts` - List alerts
- `POST /api/v1/alerts/:id/read` - Mark as read

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Container-Ready Features

- ✅ `createApp()` factory for testing
- ✅ Health endpoints for K8s probes
- ✅ Prometheus metrics endpoint
- ✅ Graceful shutdown handling
- ✅ All config from environment variables
- ✅ Structured JSON logging (Pino)
