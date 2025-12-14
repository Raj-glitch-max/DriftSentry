-- Migration 006: Multi-Tenancy - Add Accounts/Organizations
-- Created: 2025-12-14
-- Purpose: Enable multiple customers (tenants) with data isolation

-- Create accounts table
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "slug" VARCHAR(100) UNIQUE NOT NULL,
  "plan" VARCHAR(50) NOT NULL DEFAULT 'free',
  "status" VARCHAR(50) NOT NULL DEFAULT 'active',
  "trial_ends_at" TIMESTAMPTZ(6),
  "settings" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Add accountId to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_id" UUID;

-- Add accountId to drifts
ALTER TABLE "drifts" ADD COLUMN IF NOT EXISTS "account_id" UUID;

-- Add accountId to alerts
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "account_id" UUID;

-- Add accountId to cost_metrics
ALTER TABLE "cost_metrics" ADD COLUMN IF NOT EXISTS "account_id" UUID;

-- Add accountId to audit_logs
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "account_id" UUID;

-- Create default account for existing data
INSERT INTO "accounts" ("id", "name", "slug", "plan", "status")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'enterprise', 'active')
ON CONFLICT DO NOTHING;

-- Backfill existing data with default account
UPDATE "users" SET "account_id" = '00000000-0000-0000-0000-000000000001' WHERE "account_id" IS NULL;
UPDATE "drifts" SET "account_id" = '00000000-0000-0000-0000-000000000001' WHERE "account_id" IS NULL;
UPDATE "alerts" SET "account_id" = '00000000-0000-0000-0000-000000000001' WHERE "account_id" IS NULL;
UPDATE "cost_metrics" SET "account_id" = '00000000-0000-0000-0000-000000000001' WHERE "account_id" IS NULL;
UPDATE "audit_logs" SET "account_id" = '00000000-0000-0000-0000-000000000001' WHERE "account_id" IS NULL;

-- Make accountId NOT NULL after backfill
ALTER TABLE "users" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "drifts" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "alerts" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "cost_metrics" ALTER COLUMN "account_id" SET NOT NULL;
-- audit_logs can have NULL accountId for system-level events

-- Add foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "fk_users_account" 
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;

ALTER TABLE "drifts" ADD CONSTRAINT "fk_drifts_account" 
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;

ALTER TABLE "alerts" ADD CONSTRAINT "fk_alerts_account" 
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;

ALTER TABLE "cost_metrics" ADD CONSTRAINT "fk_cost_metrics_account" 
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "fk_audit_logs_account" 
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE;

-- Create indexes for tenant isolation (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS "idx_users_account_id" ON "users"("account_id");
CREATE INDEX IF NOT EXISTS "idx_drifts_account_id" ON "drifts"("account_id");
CREATE INDEX IF NOT EXISTS "idx_alerts_account_id" ON "alerts"("account_id");
CREATE INDEX IF NOT EXISTS "idx_cost_metrics_account_id" ON "cost_metrics"("account_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_account_id" ON "audit_logs"("account_id") WHERE "account_id" IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_drifts_account_status" ON "drifts"("account_id", "status");
CREATE INDEX IF NOT EXISTS "idx_alerts_account_unread" ON "alerts"("account_id", "is_read") WHERE "is_read" = false;

-- Comments
COMMENT ON TABLE "accounts" IS 'Multi-tenant organizations/companies';
COMMENT ON COLUMN "accounts"."slug" IS 'URL-friendly identifier (e.g., acme-corp)';
COMMENT ON COLUMN "accounts"."plan" IS 'Subscription plan: free, pro, enterprise';
COMMENT ON COLUMN "accounts"."status" IS 'Account status: active, suspended, cancelled';
