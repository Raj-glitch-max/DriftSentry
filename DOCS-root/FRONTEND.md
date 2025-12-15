# DriftSentry Frontend

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local if needed

# Start development server
npm run dev
```

Access at: http://localhost:3000

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:3001` |

### Changing API URL

Set different API URLs per environment:

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Staging
NEXT_PUBLIC_API_URL=https://api-staging.driftsentry.com/api/v1

# Production
NEXT_PUBLIC_API_URL=https://api.driftsentry.com/api/v1
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Architecture

```
src/
├── app/                # Next.js App Router pages
│   ├── page.tsx            # Home/landing page
│   ├── login/              # Login page
│   ├── dashboard/          # Dashboard page
│   └── drifts/             # Drifts list and detail pages
├── components/
│   ├── common/             # Shared components (Button, Card, etc.)
│   ├── layout/             # Layout components (Sidebar, Header)
│   └── features/           # Feature-specific components
├── hooks/              # Custom React hooks
│   └── useDrifts.ts        # React Query hooks for data fetching
├── services/           # API client and services
│   ├── api.ts              # Axios instance
│   └── driftApi.ts         # Drift API methods
├── config/             # App configuration
│   └── api.config.ts       # API URLs and settings
├── types/              # TypeScript types
├── utils/              # Helper functions
└── store/              # Zustand state management
```

## Key Features

### State Management
- **React Query**: Server state and caching
- **Zustand**: Client-side state

### UI Components
- **Radix UI**: Accessible primitives
- **Tailwind CSS**: Styling
- **Lucide**: Icons

### Error Handling
- **ErrorBoundary**: Catches component errors
- **API Error Handling**: Centralized in axios interceptors

## Testing

```bash
# Unit tests
npm run test

# With coverage
npm run test:coverage

# E2E tests (requires backend running)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

## Container-Ready Features

- ✅ API URL from environment variable
- ✅ No hardcoded localhost URLs
- ✅ ErrorBoundary for error handling
- ✅ Static export compatible
