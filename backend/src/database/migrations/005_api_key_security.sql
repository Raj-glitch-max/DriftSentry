-- Migration 005: Secure API Key Storage
-- Replace plaintext api_key with hashed storage
-- Created: 2025-12-14

-- Drop insecure plaintext column
ALTER TABLE "users" DROP COLUMN IF EXISTS "api_key";

-- Add secure hash-based columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_hash" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_last4" VARCHAR(4);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_created_at" TIMESTAMPTZ(6);

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_users_api_key_hash" ON "users"("api_key_hash") WHERE "api_key_hash" IS NOT NULL;

-- Comments
COMMENT ON COLUMN "users"."api_key_hash" IS 'bcrypt hash of API key (never store plaintext)';
COMMENT ON COLUMN "users"."api_key_last4" IS 'Last 4 characters of API key for display';
COMMENT ON COLUMN "users"."api_key_created_at" IS 'When API key was last generated';
