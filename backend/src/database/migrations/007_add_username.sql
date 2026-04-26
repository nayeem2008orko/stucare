-- 007_add_username.sql
-- Adds username column to users table for username-based login

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;



-- Now make it NOT NULL
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Index for fast username login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);