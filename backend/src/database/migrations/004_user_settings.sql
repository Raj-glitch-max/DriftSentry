-- Migration: Add user settings, API key, and soft delete
-- Created: 2025-12-14

-- Add settings JSONB column for user preferences
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{}';

-- Add API key column for API authentication
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" VARCHAR(255);

-- Add soft delete timestamp
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

-- Add index on deleted_at for filtering active users
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users"("deleted_at");

-- Add index on API key for lookup
CREATE INDEX IF NOT EXISTS "idx_users_api_key" ON "users"("api_key") WHERE "api_key" IS NOT NULL;

-- Comments
COMMENT ON COLUMN "users"."settings" IS 'User preferences stored as JSON (email notifications, Slack integration, etc.)';
COMMENT ON COLUMN "users"."api_key" IS 'API key for programmatic access (optional, regenerable)';
COMMENT ON COLUMN "users"."deleted_at" IS 'Soft delete timestamp (NULL = active user)';
