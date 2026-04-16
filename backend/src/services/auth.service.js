const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { createError } = require("../middleware/error.middleware");

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateTokens(user) {
  const payload = { id: user.id, email: user.email };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

async function register({ name, email, password }) {
  const exists = await UserModel.emailExists(email);
  if (exists) {
    throw createError("An account with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
  });

  const tokens = generateTokens(user);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    tokens,
  };
}

async function login({ email, password }) {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError("Invalid email or password", 401);
  }

  const tokens = generateTokens(user);

  return {
    user: { id: user.id, name: user.name, email: user.email },
    tokens,
  };
}

async function refreshAccessToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user) throw createError("User not found", 401);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY },
    );

    return { accessToken };
  } catch (err) {
    throw createError("Invalid or expired refresh token", 401);
  }
}

module.exports = { register, login, refreshAccessToken };
