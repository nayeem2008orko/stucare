// planner.controller.js

const { body, param } = require('express-validator');
const validate        = require('../middleware/validate.middleware');
const TaskModel       = require('../models/task.model');
const PlannerService  = require('../services/planner.service');

const taskRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  body('deadline').isDate().withMessage('Deadline must be a valid date (YYYY-MM-DD)'),
  body('estimatedHours').isFloat({ min: 0.5, max: 100 }).withMessage('Estimated hours must be between 0.5 and 100')
];

async function getDailyPlan(req, res, next) {
  try {
    const availableHours = parseFloat(req.query.available_hours) || 4;
    const result = await PlannerService.getDailyPlan(req.user.id, availableHours);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function getAllTasks(req, res, next) {
  try {
    const tasks = await TaskModel.findAllByUser(req.user.id);
    res.status(200).json({ success: true, data: { tasks } });
  } catch (err) { next(err); }
}

async function createTask(req, res, next) {
  try {
    const { title, subject, description, difficulty, deadline, estimatedHours } = req.body;
    const task = await TaskModel.create({
      userId: req.user.id, title, subject,
      description, difficulty, deadline, estimatedHours
    });
    res.status(201).json({ success: true, data: { task } });
  } catch (err) { next(err); }
}

async function updateTask(req, res, next) {
  try {
    const task = await TaskModel.update(req.params.id, req.user.id, req.body);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, data: { task } });
  } catch (err) { next(err); }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await TaskModel.delete(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) { next(err); }
}

async function reschedule(req, res, next) {
  try {
    const tasks = await PlannerService.rescheduleMissed(req.user.id);
    res.status(200).json({ success: true, data: { tasks } });
  } catch (err) { next(err); }
}

module.exports = { getDailyPlan, getAllTasks, createTask, taskRules, updateTask, deleteTask, reschedule };