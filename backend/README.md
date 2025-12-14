# DriftSentry Backend

Backend server for DriftSentry - Infrastructure Drift Detection Platform.

## Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 14+ (via Docker)
- **ORM**: Prisma
- **Logging**: Pino

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### 2. Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL
docker compose up -d

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed test data
npm run seed
```

### 3. Verify Setup

```bash
# Check TypeScript
npm run type-check

# Check database connection
docker compose exec postgres psql -U driftsentry -d driftsentry -c "\dt"
```

## Project Structure

```
backend/
├── docker-compose.yml       # PostgreSQL container
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── database/
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── seed.ts          # Test data seeder
│   │   └── migrations/      # SQL migration files
│   ├── types/
│   │   ├── domain/          # Domain entity types
│   │   └── api/             # API response types
│   ├── repositories/        # Data access layer
│   └── utils/
│       ├── errors.ts        # Custom error classes
│       └── logger.ts        # Structured logging
└── DATABASE_SCHEMA.md       # Schema documentation
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run type-check` | Verify TypeScript types |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run seed` | Populate test data |
| `npm run build` | Build for production |

## Test Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@driftsentry.local | admin123 |
| Engineer | engineer@driftsentry.local | engineer123 |
| Viewer | viewer@driftsentry.local | viewer123 |

## Environment Variables

See `.env.example` for required variables:

```
DATABASE_URL=postgresql://driftsentry:driftsentry@localhost:5432/driftsentry
NODE_ENV=development
LOG_LEVEL=debug
```

## Next Steps

This is **Phase 1** of the backend implementation:
- ✅ Domain types
- ✅ Database schema
- ✅ Repository pattern
- ✅ Seed script

**Coming in Phase 2:**
- REST API endpoints
- Service layer
- Validation middleware
