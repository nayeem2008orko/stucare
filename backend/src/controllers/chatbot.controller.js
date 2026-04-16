// chatbot.controller.js

const { body }       = require('express-validator');
const validate       = require('../middleware/validate.middleware');
const ChatbotService = require('../services/chatbot.service');

const messageRules = [
  body('message').trim().notEmpty().withMessage('Message is required')
                 .isLength({ max: 2000 }).withMessage('Message too long'),
  body('mode').isIn(['study', 'motivation']).withMessage('Mode must be study or motivation')
];

async function sendMessage(req, res, next) {
  try {
    const { message, mode } = req.body;
    const result = await ChatbotService.sendMessage({
      userId: req.user.id,
      message,
      mode
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

module.exports = { sendMessage, messageRules };