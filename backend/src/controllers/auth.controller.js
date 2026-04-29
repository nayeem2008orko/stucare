// auth.controller.js
const { body }    = require('express-validator');
const validate    = require('../middleware/validate.middleware');
const AuthService = require('../services/auth.service');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail({ gmail_remove_dots: false }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const verifyOTPRules = [
  body('userId').notEmpty().withMessage('User ID is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric(),
];

async function register(req, res, next) {
  try {
    const { name, username, email, password } = req.body;
    const result = await AuthService.register({ name, username, email, password });
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function verifyOTP(req, res, next) {
  try {
    const { userId, otp } = req.body;
    const result = await AuthService.verifyOTP({ userId, otp });
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function resendOTP(req, res, next) {
  try {
    const { userId } = req.body;
    const result = await AuthService.resendOTP({ userId });
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login({ username, password });
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token required' });
    const result = await AuthService.refreshAccessToken(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function logout(req, res) {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

async function getMe(req, res, next) {
  try {
    const UserModel = require('../models/user.model');
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.status(200).json({ success: true, data: { user } });
  } catch (err) { next(err); }
}

module.exports = { register, registerRules, verifyOTP, verifyOTPRules, resendOTP, login, loginRules, refresh, logout, getMe };