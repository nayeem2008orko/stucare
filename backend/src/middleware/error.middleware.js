// error.middleware.js
const logger = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  // Always log full error internally
  logger.error(`${err.message}`, err);

  const status = err.status || err.statusCode || 500;

  // For expected errors (4xx) show the message — it's intentional e.g. "Invalid username or password"
  // For unexpected server errors (5xx) never expose internals — always show a generic message
  const message = status >= 500
    ? 'Something went wrong. Please try again later.'
    : err.message || 'Something went wrong. Please try again later.';

  res.status(status).json({
    success: false,
    error: message,
  });
}

function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorMiddleware, createError };
