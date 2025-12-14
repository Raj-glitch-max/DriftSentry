-- ============================================
-- DriftSentry Performance Indexes
-- Optimized for common query patterns
-- ============================================

-- USERS indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;

-- DRIFTS indexes
CREATE INDEX idx_drifts_status ON drifts(status);
CREATE INDEX idx_drifts_severity ON drifts(severity);
CREATE INDEX idx_drifts_resource ON drifts(resource_type, region);
CREATE INDEX idx_drifts_detected_at ON drifts(detected_at DESC);
CREATE INDEX idx_drifts_created_at ON drifts(created_at DESC);
CREATE INDEX idx_drifts_approved_by ON drifts(approved_by) WHERE approved_at IS NOT NULL;
CREATE INDEX idx_drifts_rejected_by ON drifts(rejected_by) WHERE rejected_at IS NOT NULL;
CREATE INDEX idx_drifts_resource_id ON drifts(resource_id);
CREATE INDEX idx_drifts_account_id ON drifts(account_id) WHERE account_id IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX idx_drifts_status_severity ON drifts(status, severity);
CREATE INDEX idx_drifts_status_created_at ON drifts(status, created_at DESC);

-- JSONB indexes for state queries
CREATE INDEX idx_drifts_expected_state ON drifts USING GIN (expected_state);
CREATE INDEX idx_drifts_actual_state ON drifts USING GIN (actual_state);
CREATE INDEX idx_drifts_difference ON drifts USING GIN (difference);

-- ALERTS indexes
CREATE INDEX idx_alerts_drift_id ON alerts(drift_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unread ON alerts(is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- AUDIT_LOGS indexes
CREATE INDEX idx_audit_logs_drift_id ON audit_logs(drift_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- COST_METRICS indexes
CREATE INDEX idx_cost_metrics_drift_id ON cost_metrics(drift_id);
CREATE INDEX idx_cost_metrics_recorded_at ON cost_metrics(recorded_at DESC);
CREATE INDEX idx_cost_metrics_period ON cost_metrics(period_start, period_end);

-- SESSIONS indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE is_revoked = false;
CREATE INDEX idx_sessions_active ON sessions(user_id, is_revoked) WHERE is_revoked = false;
