// auth.middleware.js
// 1. Verifies JWT on every protected route
// 2. Checks is_verified in DB — blocks unverified users even if they have a token

const jwt       = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { createError } = require('./error.middleware');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('No token provided', 401));
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Pull fresh user from DB on every request — this is the safety guard.
    // Even if someone skips the frontend verify screen and somehow gets a token,
    // every single API call will be blocked here until is_verified = true.
    const user = await UserModel.findById(decoded.id);
    if (!user) return next(createError('User not found', 401));

    if (!user.is_verified) {
      return next(createError('Email not verified', 403));
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(createError('Token expired', 401));
    if (err.name === 'JsonWebTokenError') return next(createError('Invalid token', 401));
    next(createError('Authentication failed', 401));
  }
}

module.exports = authMiddleware;
