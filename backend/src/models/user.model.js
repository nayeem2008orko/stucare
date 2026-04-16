// user.model.js
// All database queries related to the users table

const pool = require('../config/db');

const UserModel = {

  // Find a user by their email address (used during login)
  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]   // $1 is a parameterized placeholder — prevents SQL injection
    );
    return result.rows[0] || null;
  },

  // Find a user by their UUID (used after JWT verification)
  async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]  // Note: we never return the password hash in this query
    );
    return result.rows[0] || null;
  },

  // Create a new user — password must already be hashed before calling this
  async create({ name, email, password }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password]
    );
    return result.rows[0];
  },

  // Check if an email is already registered
  async emailExists(email) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rowCount > 0;
  }
};

module.exports = UserModel;