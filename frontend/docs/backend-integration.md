# Backend Integration Specification

This document describes the external data dependencies in the DriftSentry frontend, providing all information needed for a backend engineer to implement the real API endpoints.

## Overview

The frontend follows a clean separation of concerns:

```
Components → Hooks → Services → API
```

- **Components** only use hooks (never call services directly)
- **Hooks** use React Query and call service methods
- **Services** contain all HTTP logic and mock data
- **All types** are defined in `src/types/`

## Configuration

To enable real API calls, set `USE_MOCK = false` in:
- `src/services/driftApi.ts`
- `src/services/alertsApi.ts`

Base API URL is configured via environment variable:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Data Dependencies

### 1. Drifts

#### `useDrifts` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.list(params)` |
| **Endpoint** | `GET /drifts` |

**Request Query Parameters:**
```typescript
interface DriftQueryParams {
  page?: number;        // Default: 1
  limit?: number;       // Default: 20
  severity?: 'critical' | 'warning' | 'info';
  status?: 'detected' | 'pending' | 'approved' | 'rejected' | 'resolved';
  resourceType?: string;
  search?: string;
  sortBy?: 'detectedAt' | 'severity' | 'costImpact';
  sortOrder?: 'asc' | 'desc';
}
```

**Response:**
```typescript
interface PaginatedResponse<Drift> {
  items: Drift[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

**UI Tolerance:** ✅ Shows loading skeleton, error state with retry, empty state

---

#### `useDriftDetails` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.get(id)` |
| **Endpoint** | `GET /drifts/:id` |

**Response:**
```typescript
interface Drift {
  id: string;
  resource: string;
  resourceType: ResourceType;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'detected' | 'pending' | 'approved' | 'rejected' | 'resolved';
  expectedState: Record<string, unknown>;
  actualState: Record<string, unknown>;
  difference: Record<string, unknown>;
  detectedAt: string;       // ISO 8601
  resolvedAt?: string;      // ISO 8601
  costImpact: number;
  region: string;
  account: string;
  tags?: Record<string, string>;
}
```

**UI Tolerance:** ✅ Shows loading state, error state with retry, 404 handling

---

#### `useApproveDrift` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.approve(id, request)` |
| **Endpoint** | `POST /drifts/:id/approve` |

**Request Body:**
```typescript
interface ApproveDriftRequest {
  notes?: string;
  autoRemediate?: boolean;
}
```

**Response:**
```typescript
interface DriftActionResponse {
  id: string;
  status: string;
  message?: string;
}
```

**UI Tolerance:** ✅ Shows loading state on button, invalidates drift list on success

---

#### `useRejectDrift` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.reject(id, request)` |
| **Endpoint** | `POST /drifts/:id/reject` |

**Request Body:**
```typescript
interface RejectDriftRequest {
  reason: string;           // Required
  createException?: boolean;
}
```

**Response:** Same as `DriftActionResponse`

**UI Tolerance:** ✅ Shows loading state on button, invalidates drift list on success

---

### 2. Metrics

#### `useMetrics` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.getMetrics()` |
| **Endpoint** | `GET /metrics` |

**Response:**
```typescript
interface DashboardMetrics {
  totalDrifts: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  resolvedToday: number;
  pendingApproval: number;
  costSavings: number;
  issuesFixed: number;
}
```

**Cache:** Stale after 1 minute, auto-refetch every 1 minute

**UI Tolerance:** ✅ Shows skeleton cards, handles gracefully if null

---

#### `useCostTrend` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.getCostTrend(days)` |
| **Endpoint** | `GET /cost/trend` |

**Request Query Parameters:**
```typescript
{ days: 7 | 30 | 90 }
```

**Response:**
```typescript
interface CostTrendDataPoint {
  date: string;          // YYYY-MM-DD
  cost: number;
  savings: number;
  projected?: number;    // For future dates
}
```

**UI Tolerance:** ✅ Shows loading spinner, error message if fails

---

### 3. Alerts

#### `useAlerts` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useAlerts.ts` |
| **Service** | `alertsApi.list(page, limit)` |
| **Endpoint** | `GET /alerts` |

**Request Query Parameters:**
```typescript
{ page: number; limit: number }
```

**Response:** `PaginatedResponse<Alert>`

```typescript
interface Alert {
  id: string;
  driftId?: string;
  type: 'drift_detected' | 'threshold_exceeded' | 'resolution_needed' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;     // ISO 8601
  read: boolean;
  acknowledged: boolean;
  snoozedUntil?: string; // ISO 8601
}
```

**Cache:** Stale after 30 seconds, auto-refetch every 30 seconds

**UI Tolerance:** ✅ Shows loading spinner, error state, empty state

---

#### `useUnreadAlertCount` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useAlerts.ts` |
| **Service** | `alertsApi.getUnreadCount()` |
| **Endpoint** | `GET /alerts/unread/count` |

**Response:**
```typescript
{ count: number }
```

**UI Tolerance:** ✅ Falls back to 0, no visual error

---

#### `useMarkAlertAsRead` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useAlerts.ts` |
| **Service** | `alertsApi.markAsRead(id)` |
| **Endpoint** | `POST /alerts/:id/read` |

**UI Tolerance:** ✅ Optimistic update, invalidates alert list

---

#### `useMarkAllAlertsAsRead` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useAlerts.ts` |
| **Service** | `alertsApi.markAllAsRead()` |
| **Endpoint** | `POST /alerts/read-all` |

**UI Tolerance:** ✅ Invalidates all alert queries

---

### 4. Timeline

#### `useDriftTimeline` Hook
| Property | Value |
|----------|-------|
| **File** | `src/hooks/useDrifts.ts` |
| **Service** | `driftApi.getTimeline(driftId)` |
| **Endpoint** | `GET /drifts/:id/timeline` |

**Response:**
```typescript
interface DriftTimelineEvent {
  id: string;
  driftId: string;
  action: 'detected' | 'approved' | 'rejected' | 'resolved' | 'escalated';
  timestamp: string;     // ISO 8601
  description: string;
  user?: string;
  metadata?: Record<string, unknown>;
}
```

**UI Tolerance:** ✅ Shows loading state, handles empty timeline

---

## Error Handling

All endpoints should return errors in this format:

```typescript
interface APIError {
  code: string;          // e.g., "DRIFT_NOT_FOUND"
  message: string;       // User-friendly message
  details?: Record<string, unknown>;
  statusCode?: number;
}
```

HTTP Status Codes:
- `401` → Redirect to login (handled by axios interceptor)
- `403` → Show forbidden message
- `404` → Show not found state
- `500` → Show generic error with retry option

---

## Wiring Checklist

For each endpoint, the backend engineer should:

1. [ ] Implement the endpoint matching the path and method
2. [ ] Return responses matching the TypeScript interfaces above
3. [ ] Use ISO 8601 format for all dates
4. [ ] Return proper HTTP status codes
5. [ ] Test with `USE_MOCK = false` in the service file

Once implemented, the frontend will work without any component changes.
