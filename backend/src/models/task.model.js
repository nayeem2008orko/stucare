// task.model.js
// All database queries related to the tasks table

const pool = require('../config/db');

const TaskModel = {

  // Get all tasks for a user, ordered by deadline soonest first
  async findAllByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE user_id = $1
       ORDER BY deadline ASC, priority_score DESC`,
      [userId]
    );
    return result.rows;
  },

  // Get a single task by ID — also verifies it belongs to the requesting user
  async findById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 LIMIT 1',
      [id, userId]
    );
    return result.rows[0] || null;
  },

  // Get only tasks that are not yet completed (used by algorithm)
  async findPendingByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM tasks
       WHERE user_id = $1
         AND status IN ('pending', 'in_progress', 'missed')
       ORDER BY deadline ASC`,
      [userId]
    );
    return result.rows;
  },

  // Create a new task
  async create({ userId, title, subject, description, difficulty, deadline, estimatedHours }) {
    const result = await pool.query(
      `INSERT INTO tasks
         (user_id, title, subject, description, difficulty, deadline, estimated_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, title, subject, description, difficulty, deadline, estimatedHours]
    );
    return result.rows[0];
  },

  // Update any fields of a task
  async update(id, userId, fields) {
    // Dynamically build the SET clause from whichever fields were provided
    const allowed = ['title', 'subject', 'description', 'difficulty', 'deadline',
                     'estimated_hours', 'completed_hours', 'status', 'priority_score'];

    const updates = [];
    const values  = [];
    let   idx     = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }

    if (updates.length === 0) return null;

    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await pool.query(
      `UPDATE tasks
       SET ${updates.join(', ')}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  // Delete a task
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rowCount > 0;
  }
};

module.exports = TaskModel;
