// planner.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/planner.controller');
const validate   = require('../middleware/validate.middleware');
const auth       = require('../middleware/auth.middleware');

// All planner routes require authentication
router.use(auth);

router.get('/daily',           controller.getDailyPlan);
router.get('/tasks',           controller.getAllTasks);
router.post('/tasks',          controller.taskRules, validate, controller.createTask);
router.put('/tasks/:id',       controller.taskRules, validate, controller.updateTask);
router.delete('/tasks/:id',    controller.deleteTask);
router.post('/reschedule',     controller.reschedule);

module.exports = router;