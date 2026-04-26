// user.model.js
// All database queries related to the users table

const pool = require('../config/db');

const UserModel = {

  async findByUsername(username) {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      'SELECT id, name, username, email, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ name, username, email, password }) {
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, username, email, created_at`,
      [name, username, email, password]
    );
    return result.rows[0];
  },

  async emailExists(email) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return result.rowCount > 0;
  },

  async usernameExists(username) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    return result.rowCount > 0;
  }
};

module.exports = UserModel;