const AnalyticsService = require("../services/analytics.service");

async function getProgress(req, res, next) {
  try {
    const progress = await AnalyticsService.getProgress(req.user.id);
    res.status(200).json({ success: true, data: progress });
  } catch (err) {
    next(err);
  }
}

async function getStreak(req, res, next) {
  try {
    const streak = await AnalyticsService.getStreak(req.user.id);
    res.status(200).json({ success: true, data: streak });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProgress, getStreak };
