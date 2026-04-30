const logger = require('../utils/logger');

function errorMiddleware(err, req, res, next) {
  logger.error(`${err.message}`, err);

  const status  = err.status || err.statusCode || 500;
  const message = status >= 500
    ? 'Something went wrong. Please try again later.'
    : err.message || 'Something went wrong. Please try again later.';

  const body = { success: false, error: message };

  // Pass through extra fields (e.g. userId/email on 403 unverified)
  if (err.userId) body.userId = err.userId;
  if (err.email)  body.email  = err.email;

  res.status(status).json(body);
}

function createError(message, status = 500) {
  const err  = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorMiddleware, createError };
