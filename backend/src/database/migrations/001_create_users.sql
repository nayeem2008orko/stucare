-- 001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100)              NOT NULL,
  username       VARCHAR(50)               NOT NULL UNIQUE,
  email          VARCHAR(255)              NOT NULL UNIQUE,
  password       VARCHAR(255)              NOT NULL,
  is_verified    BOOLEAN                   DEFAULT FALSE,
  otp_code       VARCHAR(6),
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE  DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);