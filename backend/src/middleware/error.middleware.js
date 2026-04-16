// error.middleware.js
// Global error handler — catches all errors thrown in any route
// Always returns consistent JSON error responses
// Never leaks stack traces to the client in production

const logger = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  // Log the full error internally
  logger.error(`${err.message}`, err);

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Never expose internal error details in production
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An internal server error occurred'
    : err.message || 'An internal server error occurred';

  res.status(status).json({
    success: false,
    error:   message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

// Helper to create errors with a status code attached
function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorMiddleware, createError };