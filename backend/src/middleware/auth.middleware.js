const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { createError } = require("./error.middleware");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError("No token provided", 401));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(createError("Token expired", 401));
    }
    if (err.name === "JsonWebTokenError") {
      return next(createError("Invalid token", 401));
    }
    next(createError("Authentication failed", 401));
  }
}

module.exports = authMiddleware;
