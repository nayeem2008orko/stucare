// auth.service.js
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const crypto       = require('crypto');
const UserModel    = require('../models/user.model');
const EmailService = require('./email.service');
const { createError } = require('../middleware/error.middleware');
const logger          = require('../utils/logger');

const BCRYPT_ROUNDS        = 12;
const ACCESS_TOKEN_EXPIRY  = '30d';
const REFRESH_TOKEN_EXPIRY = '30d';
const OTP_EXPIRY_MS        = 3 * 60 * 1000; // 3 minutes

// ── In-memory OTP cache ───────────────────────────────────────────────────────
// Map<userId, { otp: string, expiresAt: number }>
// Each resendOTP/register call overwrites the entry — old codes are instantly dead
// Entries are cleaned up automatically after expiry
const otpCache = new Map();

function cacheOTP(userId, otp) {
  otpCache.set(userId, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
  // Auto-delete after expiry so the Map doesn't grow forever
  setTimeout(() => otpCache.delete(userId), OTP_EXPIRY_MS + 1000);
}

function validateOTP(userId, otp) {
  const entry = otpCache.get(userId);
  if (!entry)                    return false;
  if (Date.now() > entry.expiresAt) { otpCache.delete(userId); return false; }
  if (entry.otp !== otp)         return false;
  otpCache.delete(userId); // consume — one-time use
  return true;
}
// ─────────────────────────────────────────────────────────────────────────────

function generateTokens(user) {
  const payload = { id: user.id, email: user.email };
  return {
    accessToken:  jwt.sign(payload, process.env.JWT_SECRET,         { expiresIn: ACCESS_TOKEN_EXPIRY }),
    refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY }),
  };
}

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

async function sendOTP(userId, email, name) {
  const otp = generateOTP();
  cacheOTP(userId, otp); // store in cache, overwrites any previous code
  try {
    await EmailService.sendOTPEmail(email, otp, name);
  } catch (err) {
    logger.error('SMTP error — failed to send OTP: ' + err.message);
    otpCache.delete(userId); // clean up cache if email failed
    throw createError('Failed to send verification email. Please try again.', 502);
  }
}

async function register({ name, username, email, password }) {
  if (await UserModel.emailExists(email))       throw createError('An account with this email already exists', 409);
  if (await UserModel.usernameExists(username)) throw createError('That username is already taken', 409);

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user   = await UserModel.create({ name, username, email, password: hashed });

  await sendOTP(user.id, email, name);

  return { userId: user.id, email };
}

async function verifyOTP({ userId, otp }) {
  const valid = validateOTP(userId, otp);
  if (!valid) throw createError('Invalid or expired verification code', 400);

  await UserModel.markVerified(userId);

  const user   = await UserModel.findById(userId);
  const tokens = generateTokens(user);

  return {
    user:   { id: user.id, name: user.name, username: user.username, email: user.email },
    tokens
  };
}

async function resendOTP({ userId }) {
  const user = await UserModel.findById(userId);
  if (!user)            throw createError('User not found', 404);
  if (user.is_verified) throw createError('Email already verified', 400);

  await sendOTP(user.id, user.email, user.name);
  return { message: 'Verification code resent' };
}

async function login({ username, password }) {
  const user = await UserModel.findByUsername(username);
  if (!user) throw createError('Invalid username or password', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw createError('Invalid username or password', 401);

  if (!user.is_verified) {
    await sendOTP(user.id, user.email, user.name);
    const err  = createError('Please verify your email before logging in', 403);
    err.userId = user.id;
    err.email  = user.email;
    throw err;
  }

  const tokens = generateTokens(user);
  return {
    user:   { id: user.id, name: user.name, username: user.username, email: user.email },
    tokens
  };
}

async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await UserModel.findById(decoded.id);
    if (!user) throw createError('User not found', 401);
    const accessToken = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    return { accessToken };
  } catch {
    throw createError('Invalid or expired refresh token', 401);
  }
}

module.exports = { register, verifyOTP, resendOTP, login, refreshAccessToken };