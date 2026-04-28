// session.model.js
const pool = require('../config/db');

const SessionModel = {

  async startSession(taskId, userId) {
    const result = await pool.query(
      `INSERT INTO task_sessions (task_id, user_id, started_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [taskId, userId]
    );
    return result.rows[0];
  },

  async endSession(sessionId, userId) {
    const result = await pool.query(
      `UPDATE task_sessions SET ended_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [sessionId, userId]
    );
    return result.rows[0] || null;
  },

  async getTotalMinutesByTask(taskId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(duration_min), 0) AS total_minutes
       FROM task_sessions WHERE task_id = $1 AND ended_at IS NOT NULL`,
      [taskId]
    );
    return parseInt(result.rows[0].total_minutes, 10);
  },

  // Wipes today's plan so it can be regenerated fresh
  async deleteDailyPlan(userId, planDate) {
    // Delete items first (FK constraint), then the plan
    await pool.query(
      `DELETE FROM daily_plan_items WHERE plan_id IN (
         SELECT id FROM daily_plans WHERE user_id = $1 AND plan_date = $2
       )`,
      [userId, planDate]
    );
    await pool.query(
      'DELETE FROM daily_plans WHERE user_id = $1 AND plan_date = $2',
      [userId, planDate]
    );
  },

  async findOrCreateDailyPlan(userId, planDate, availableHours = null) {
    const existing = await pool.query(
      'SELECT * FROM daily_plans WHERE user_id = $1 AND plan_date = $2 LIMIT 1',
      [userId, planDate]
    );
    if (existing.rows[0]) {
      // Update available_hours if provided (plan was just regenerated)
      if (availableHours !== null) {
        await pool.query(
          'UPDATE daily_plans SET available_hours = $1 WHERE id = $2',
          [availableHours, existing.rows[0].id]
        );
      }
      return existing.rows[0];
    }
    const created = await pool.query(
      `INSERT INTO daily_plans (user_id, plan_date, available_hours) VALUES ($1, $2, $3) RETURNING *`,
      [userId, planDate, availableHours]
    );
    return created.rows[0];
  },

  async savePlanItems(planId, items) {
    await pool.query('DELETE FROM daily_plan_items WHERE plan_id = $1', [planId]);
    if (items.length === 0) return [];

    const values = [];
    const placeholders = items.map((item, i) => {
      const base = i * 5;
      values.push(planId, item.taskId, item.scheduledStart, item.scheduledEnd, item.durationMin);
      return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`;
    });

    const result = await pool.query(
      `INSERT INTO daily_plan_items (plan_id, task_id, scheduled_start, scheduled_end, duration_min)
       VALUES ${placeholders.join(', ')} RETURNING *`,
      values
    );
    return result.rows;
  },

  // Returns plan items normalised to the same shape the Python scheduler returns,
  // so the frontend always gets consistent field names regardless of cache vs fresh.
  async getDailyPlanWithTasks(userId, planDate) {
    const result = await pool.query(
      `SELECT
         t.id              AS task_id,
         t.title,
         t.subject,
         t.difficulty,
         t.deadline,
         t.status          AS task_status,
         dpi.scheduled_start AS start_time,
         dpi.scheduled_end   AS end_time,
         dpi.duration_min,
         dpi.status          AS item_status,
         dp.available_hours
       FROM daily_plans dp
       JOIN daily_plan_items dpi ON dpi.plan_id = dp.id
       JOIN tasks t              ON t.id = dpi.task_id
       WHERE dp.user_id  = $1
         AND dp.plan_date = $2
         AND t.status NOT IN ('completed')
       ORDER BY dpi.scheduled_start ASC`,
      [userId, planDate]
    );
    return result.rows;
  },

  async saveChatMessage(userId, mode, role, content) {
    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, mode, role, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, mode, role, content]
    );
    return result.rows[0];
  },

  async getChatHistory(userId, mode, limit = 20) {
    const result = await pool.query(
      `SELECT role, content, created_at FROM chat_messages
       WHERE user_id = $1 AND mode = $2
       ORDER BY created_at DESC LIMIT $3`,
      [userId, mode, limit]
    );
    return result.rows.reverse();
  }
};

module.exports = SessionModel;