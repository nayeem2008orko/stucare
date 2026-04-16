-- 006_create_chat_messages.sql
-- Stores all chatbot conversation history per user

CREATE TYPE chat_mode AS ENUM ('study', 'motivation');
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode       chat_mode    NOT NULL,
  role       message_role NOT NULL,
  content    TEXT         NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_id   ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mode      ON chat_messages(user_id, mode);
CREATE INDEX IF NOT EXISTS idx_chat_created   ON chat_messages(created_at);