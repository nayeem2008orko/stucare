// rateLimit.middleware.js
// Prevents abuse by limiting how many requests a client can make
// Chatbot has a stricter limit to control AI API costs

const rateLimit = require('express-rate-limit');

// General API limit — 500 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         500,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error:   'Too many requests, please try again later.'
  }
});

// Auth endpoints — stricter to prevent brute force
const authLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error:   'Too many login attempts, please try again in 15 minutes.'
  }
});

// Chatbot — 30 messages per 15 minutes per IP
const chatLimiter = rateLimit({
  windowMs:    15 * 60 * 1000,
  max:         30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error:   'Chatbot message limit reached. Please wait before sending more messages.'
  }
});

module.exports = { generalLimiter, authLimiter, chatLimiter };