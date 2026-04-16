const pool = require("../config/db");
const TaskModel = require("../models/task.model");

async function getProgress(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*)                                            AS total_tasks,
       COUNT(*) FILTER (WHERE status = 'completed')       AS completed_tasks,
       COUNT(*) FILTER (WHERE status = 'missed')          AS missed_tasks,
       COUNT(*) FILTER (WHERE status = 'in_progress')     AS in_progress_tasks,
       COALESCE(SUM(completed_hours), 0)                  AS total_hours_studied,
       COALESCE(SUM(estimated_hours), 0)                  AS total_hours_planned
     FROM tasks
     WHERE user_id = $1`,
    [userId],
  );

  const row = result.rows[0];

  const completionRate =
    row.total_tasks > 0
      ? Math.round((row.completed_tasks / row.total_tasks) * 100)
      : 0;

  return {
    totalTasks: parseInt(row.total_tasks),
    completedTasks: parseInt(row.completed_tasks),
    missedTasks: parseInt(row.missed_tasks),
    inProgressTasks: parseInt(row.in_progress_tasks),
    completionRate,
    totalHoursStudied: parseFloat(row.total_hours_studied),
    totalHoursPlanned: parseFloat(row.total_hours_planned),
  };
}

async function getStreak(userId) {
  const result = await pool.query(
    `SELECT DISTINCT DATE(started_at) AS study_date
     FROM task_sessions
     WHERE user_id = $1 AND ended_at IS NOT NULL
     ORDER BY study_date DESC`,
    [userId],
  );

  const dates = result.rows.map(
    (r) => r.study_date.toISOString().split("T")[0],
  );

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let currentStreak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().split("T")[0];

    if (dates[i] === expectedStr) {
      currentStreak++;
    } else {
      break;
    }
  }

  let longestStreak = 1;
  let runningStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev - curr) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

module.exports = { getProgress, getStreak };
