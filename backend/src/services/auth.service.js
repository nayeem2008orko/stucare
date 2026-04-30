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
const OTP_EXPIRY_MINUTES   = 10;

function generateTokens(user) {
  const payload = { id: user.id, email: user.email };
  const accessToken  = jwt.sign(payload, process.env.JWT_SECRET,        { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

async function sendOTPWithLogging(email, otp, name) {
  try {
    await EmailService.sendOTPEmail(email, otp, name);
  } catch (err) {
    // Log the real SMTP error to terminal only — never expose to client
    logger.error('SMTP error — failed to send OTP email: ' + err.message);
    throw createError('Failed to send verification email. Please check your email address and try again.', 502);
  }
}

// Step 1: Register — save user (unverified) and send OTP
async function register({ name, username, email, password }) {
  if (await UserModel.emailExists(email)) {
    throw createError('An account with this email already exists', 409);
  }
  if (await UserModel.usernameExists(username)) {
    throw createError('That username is already taken', 409);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await UserModel.create({ name, username, email, password: hashedPassword });

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await UserModel.setOTP(user.id, otp, expiresAt);

  // If email fails, user is in DB but unverified — they can use resend-otp later
  // We still surface a clear error so they know what went wrong
  await sendOTPWithLogging(email, otp, name);

  return { userId: user.id, email };
}

// Step 2: Verify OTP — confirm email and issue tokens
async function verifyOTP({ userId, otp }) {
  const valid = await UserModel.verifyOTP(userId, otp);
  if (!valid) throw createError('Invalid or expired verification code', 400);

  await UserModel.markVerified(userId);

  const user   = await UserModel.findById(userId);
  const tokens = generateTokens(user);

  return {
    user:   { id: user.id, name: user.name, username: user.username, email: user.email },
    tokens
  };
}

// Resend OTP
async function resendOTP({ userId }) {
  const user = await UserModel.findById(userId);
  if (!user)            throw createError('User not found', 404);
  if (user.is_verified) throw createError('Email already verified', 400);

  const otp       = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await UserModel.setOTP(userId, otp, expiresAt);
  await sendOTPWithLogging(user.email, otp, user.name);

  return { message: 'Verification code resent' };
}

async function login({ username, password }) {
  const user = await UserModel.findByUsername(username);
  if (!user) throw createError('Invalid username or password', 401);

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) throw createError('Invalid username or password', 401);

  if (!user.is_verified) {
    const err = createError('Please verify your email before logging in', 403);
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