const logger = require("../utils/logger");

function errorMiddleware(err, req, res, next) {
  logger.error(`${err.message}`, err);

  const status = err.status || err.statusCode || 500;

  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "An internal server error occurred"
      : err.message || "An internal server error occurred";

  res.status(status).json({
    success: false,
    error: message,

    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

function createError(message, status = 500) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorMiddleware, createError };
