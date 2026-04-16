

CREATE TABLE IF NOT EXISTS daily_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date    DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active    BOOLEAN NOT NULL DEFAULT true,

  -- Prevent duplicate plans for the same user on the same day
  CONSTRAINT unique_user_plan_date UNIQUE (user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_plans_user_date ON daily_plans(user_id, plan_date);