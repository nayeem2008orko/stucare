// auth.middleware.js
// Verifies JWT token on every protected route
// Attaches the decoded user to req.user for use in controllers

const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');
const { createError } = require('./error.middleware');

function authMiddleware(req, res, next) {
  try {
    // Token comes from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    // Verify and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request for downstream use
    req.user = {
      id:    decoded.id,
      email: decoded.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(createError('Token expired', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(createError('Invalid token', 401));
    }
    next(createError('Authentication failed', 401));
  }
}

module.exports = authMiddleware;