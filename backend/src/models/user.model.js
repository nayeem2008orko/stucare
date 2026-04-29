// user.model.js
const pool = require('../config/db');

const UserModel = {

  async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, name, username, email, is_verified, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ name, username, email, password }) {
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password, is_verified)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, name, username, email, is_verified, created_at`,
      [name, username, email, password]
    );
    return result.rows[0];
  },

  async setOTP(userId, otp, expiresAt) {
    await pool.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, expiresAt, userId]
    );
  },

  async verifyOTP(userId, otp) {
    const result = await pool.query(
      `SELECT otp_code, otp_expires_at FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const user = result.rows[0];
    if (!user) return false;
    if (user.otp_code !== otp) return false;
    if (new Date() > new Date(user.otp_expires_at)) return false;
    return true;
  },

  async markVerified(userId) {
    await pool.query(
      'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [userId]
    );
  },

  async emailExists(email) {
    const result = await pool.query('SELECT 1 FROM users WHERE email = $1 LIMIT 1', [email]);
    return result.rowCount > 0;
  },

  async usernameExists(username) {
    const result = await pool.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [username]);
    return result.rowCount > 0;
  }
};

module.exports = UserModel;