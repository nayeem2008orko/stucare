// chatbot.routes.js

const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/chatbot.controller');
const validate   = require('../middleware/validate.middleware');
const auth       = require('../middleware/auth.middleware');
const { chatLimiter } = require('../middleware/rateLimit.middleware');

router.use(auth);

router.post('/message', chatLimiter, controller.messageRules, validate, controller.sendMessage);

module.exports = router;