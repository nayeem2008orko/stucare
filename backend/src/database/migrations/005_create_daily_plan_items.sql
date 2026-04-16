

CREATE TYPE plan_item_status AS ENUM ('scheduled', 'completed', 'skipped', 'rescheduled');

CREATE TABLE IF NOT EXISTS daily_plan_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID NOT NULL REFERENCES daily_plans(id) ON DELETE CASCADE,
  task_id         UUID NOT NULL REFERENCES tasks(id)       ON DELETE CASCADE,
  scheduled_start TIME NOT NULL,
  scheduled_end   TIME NOT NULL,
  duration_min    INTEGER NOT NULL CHECK (duration_min > 0),
  status          plan_item_status NOT NULL DEFAULT 'scheduled',
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_plan_items_plan_id ON daily_plan_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_task_id ON daily_plan_items(task_id);