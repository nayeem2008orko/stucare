// planner.service.js
const axios           = require('axios');
const TaskModel       = require('../models/task.model');
const SessionModel    = require('../models/session.model');
const { createError } = require('../middleware/error.middleware');
const logger          = require('../utils/logger');

async function getDailyPlan(userId, availableHours = 4, force = false) {
  const today = new Date().toISOString().split('T')[0];

  if (!force) {
    const existing = await SessionModel.getDailyPlanWithTasks(userId, today);
    if (existing.length > 0) {
      // Check if the cached plan was generated with different hours
      const cachedHours = existing[0].available_hours;
      if (!cachedHours || Math.abs(cachedHours - availableHours) < 0.01) {
        // Hours match — return cache (completed tasks already filtered by SQL)
        return { date: today, schedule: existing, cached: true };
      }
      // Hours changed — fall through to regenerate
    }
  }

  // Bust old plan
  await SessionModel.deleteDailyPlan(userId, today);

  // Fetch only pending tasks
  const tasks = await TaskModel.findPendingByUser(userId);
  if (tasks.length === 0) {
    return { date: today, schedule: [], cached: false };
  }

  // Call Python algorithm
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

  // Save fresh plan (store availableHours so cache can detect hour changes)
  const plan = await SessionModel.findOrCreateDailyPlan(userId, today, availableHours);
  await SessionModel.savePlanItems(plan.id, schedule.map(s => ({
    taskId:         s.task_id,
    scheduledStart: s.start_time,
    scheduledEnd:   s.end_time,
    durationMin:    s.duration_min
  })));

  return { date: today, schedule, cached: false };
}

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