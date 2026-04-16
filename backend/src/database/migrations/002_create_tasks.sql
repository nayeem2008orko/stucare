

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'missed');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255)      NOT NULL,
  subject         VARCHAR(100)      NOT NULL,
  description     TEXT,
  difficulty      difficulty_level  NOT NULL DEFAULT 'medium',
  deadline        DATE              NOT NULL,
  estimated_hours NUMERIC(4, 1)     NOT NULL CHECK (estimated_hours > 0),
  completed_hours NUMERIC(4, 1)     NOT NULL DEFAULT 0,
  status          task_status       NOT NULL DEFAULT 'pending',
  priority_score  NUMERIC(6, 2)     DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_tasks_user_id  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);