// session.model.js
// Database queries for task_sessions and daily_plans / daily_plan_items

const pool = require('../config/db');

const SessionModel = {

  // Record the start of a study session
  async startSession(taskId, userId) {
    const result = await pool.query(
      `INSERT INTO task_sessions (task_id, user_id, started_at)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [taskId, userId]
    );
    return result.rows[0];
  },

  // Record the end of a study session
  async endSession(sessionId, userId) {
    const result = await pool.query(
      `UPDATE task_sessions
       SET ended_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sessionId, userId]
    );
    return result.rows[0] || null;
  },

  // Get total minutes studied per task (used for analytics)
  async getTotalMinutesByTask(taskId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(duration_min), 0) AS total_minutes
       FROM task_sessions
       WHERE task_id = $1 AND ended_at IS NOT NULL`,
      [taskId]
    );
    return parseInt(result.rows[0].total_minutes, 10);
  },

  // Get or create today's daily plan for a user
  async findOrCreateDailyPlan(userId, planDate) {
    // Try to find existing plan first
    const existing = await pool.query(
      'SELECT * FROM daily_plans WHERE user_id = $1 AND plan_date = $2 LIMIT 1',
      [userId, planDate]
    );
    if (existing.rows[0]) return existing.rows[0];

    // Create new plan if none exists
    const created = await pool.query(
      `INSERT INTO daily_plans (user_id, plan_date)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, planDate]
    );
    return created.rows[0];
  },

  // Save the plan items returned by the Python algorithm
  async savePlanItems(planId, items) {
    // Delete any previous items for this plan before inserting new ones
    await pool.query('DELETE FROM daily_plan_items WHERE plan_id = $1', [planId]);

    if (items.length === 0) return [];

    // Build a multi-row INSERT for efficiency (one query instead of N)
    const values  = [];
    const placeholders = items.map((item, i) => {
      const base = i * 5;
      values.push(
        planId,
        item.taskId,
        item.scheduledStart,
        item.scheduledEnd,
        item.durationMin
      );
      return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`;
    });

    const result = await pool.query(
      `INSERT INTO daily_plan_items
         (plan_id, task_id, scheduled_start, scheduled_end, duration_min)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );
    return result.rows;
  },

  // Get today's full plan with task details joined
  async getDailyPlanWithTasks(userId, planDate) {
    const result = await pool.query(
      `SELECT
         dpi.id,
         dpi.scheduled_start,
         dpi.scheduled_end,
         dpi.duration_min,
         dpi.status,
         dpi.display_order,
         t.id          AS task_id,
         t.title       AS task_title,
         t.subject,
         t.difficulty,
         t.deadline
       FROM daily_plans dp
       JOIN daily_plan_items dpi ON dpi.plan_id = dp.id
       JOIN tasks t              ON t.id = dpi.task_id
       WHERE dp.user_id = $1
         AND dp.plan_date = $2
       ORDER BY dpi.scheduled_start ASC`,
      [userId, planDate]
    );
    return result.rows;
  },

  // Save a chat message
  async saveChatMessage(userId, mode, role, content) {
    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, mode, role, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, mode, role, content]
    );
    return result.rows[0];
  },

  // Get last N messages for a user in a specific mode (for AI context)
  async getChatHistory(userId, mode, limit = 20) {
    const result = await pool.query(
      `SELECT role, content, created_at
       FROM chat_messages
       WHERE user_id = $1 AND mode = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, mode, limit]
    );
    // Reverse so oldest message is first (correct order for AI context)
    return result.rows.reverse();
  }
};

module.exports = SessionModel;