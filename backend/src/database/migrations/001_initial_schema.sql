-- ============================================
-- DriftSentry Initial Schema
-- PostgreSQL 14+ with UUID and JSONB support
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & AUTH
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'engineer', 'viewer'))
);

-- ============================================
-- DRIFTS (Core entity)
-- ============================================

CREATE TABLE drifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  account_id VARCHAR(12),
  
  expected_state JSONB NOT NULL,
  actual_state JSONB NOT NULL,
  difference JSONB NOT NULL,
  
  severity VARCHAR(20) NOT NULL DEFAULT 'warning',
  cost_impact_monthly DECIMAL(10, 2) DEFAULT 0,
  
  status VARCHAR(50) NOT NULL DEFAULT 'detected',
  
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_by VARCHAR(50) NOT NULL,
  
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  approval_reason TEXT,
  
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_how VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_status CHECK (status IN ('detected', 'triaged', 'approved', 'rejected', 'resolved')),
  CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info')),
  CONSTRAINT valid_detected_by CHECK (detected_by IN ('scheduler', 'manual', 'api')),
  CONSTRAINT valid_resolved_how CHECK (resolved_how IS NULL OR resolved_how IN ('auto-remediate', 'manual-fix', 'acknowledged'))
);

-- ============================================
-- ALERTS
-- ============================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID NOT NULL REFERENCES drifts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_alert_type CHECK (type IN ('drift_detected', 'approval_needed', 'remediation_failed')),
  CONSTRAINT valid_alert_severity CHECK (severity IN ('critical', 'warning', 'info'))
);

-- ============================================
-- AUDIT LOG (immutable)
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  actor_id UUID REFERENCES users(id),
  actor_email VARCHAR(255),
  old_value JSONB,
  new_value JSONB,
  details JSONB,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_action CHECK (action IN ('drift_created', 'drift_approved', 'drift_rejected', 'drift_resolved', 'user_login', 'user_logout'))
);

-- ============================================
-- COST METRICS (time-series)
-- ============================================

CREATE TABLE cost_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID REFERENCES drifts(id) ON DELETE CASCADE,
  cost_usd DECIMAL(10, 2) NOT NULL,
  cost_projected_monthly DECIMAL(10, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SESSIONS (for JWT refresh tokens)
-- ============================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address INET,
  user_agent VARCHAR(500),
  is_revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE
);
