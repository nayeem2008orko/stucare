// planner.service.js
// Handles study plan generation by communicating with the Python algorithm service

const axios        = require('axios');
const TaskModel    = require('../models/task.model');
const SessionModel = require('../models/session.model');
const { createError } = require('../middleware/error.middleware');
const logger          = require('../utils/logger');

/**
 * Get or generate today's study plan for a user
 */
async function getDailyPlan(userId, availableHours = 4) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Step 1 — Check if plan already exists for today
  const existing = await SessionModel.getDailyPlanWithTasks(userId, today);
  if (existing.length > 0) {
    return { date: today, schedule: existing, cached: true };
  }

  // Step 2 — Fetch user's pending tasks
  const tasks = await TaskModel.findPendingByUser(userId);
  if (tasks.length === 0) {
    return { date: today, schedule: [], cached: false };
  }

  // Step 3 — Call Python algorithm service
  let schedule;
  try {
    const response = await axios.post(
      `${process.env.ALGORITHM_SERVICE_URL}/schedule`,
      { tasks, available_hours: availableHours },
      { timeout: 10000 }
    );
    schedule = response.data.schedule;
  } catch (err) {
    logger.error('Algorithm service error: ' + err.message);
    throw createError('Could not generate study plan. Please try again.', 503);
  }

  // Step 4 — Save plan to DB
  const plan = await SessionModel.findOrCreateDailyPlan(userId, today);

  const items = schedule.map(s => ({
    taskId:         s.task_id,
    scheduledStart: s.start_time,
    scheduledEnd:   s.end_time,
    durationMin:    s.duration_min
  }));

  await SessionModel.savePlanItems(plan.id, items);

  return { date: today, schedule, cached: false };
}

/**
 * Trigger rescheduling of missed tasks
 */
async function rescheduleMissed(userId) {
  const tasks = await TaskModel.findPendingByUser(userId);

  try {
    const response = await axios.post(
      `${process.env.ALGORITHM_SERVICE_URL}/reschedule`,
      { tasks },
      { timeout: 10000 }
    );
    return response.data.tasks;
  } catch (err) {
    logger.error('Reschedule service error: ' + err.message);
    throw createError('Could not reschedule tasks. Please try again.', 503);
  }
}

module.exports = { getDailyPlan, rescheduleMissed };