

CREATE TABLE IF NOT EXISTS task_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at     TIMESTAMP WITH TIME ZONE,
  duration_min INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
      ELSE NULL
    END
  ) STORED,
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_task_id ON task_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON task_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date    ON task_sessions(started_at);