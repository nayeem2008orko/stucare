const pool = require("../config/db");

const UserModel = {
  async findByEmail(email) {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1",
      [id],
    );
    return result.rows[0] || null;
  },

  async create({ name, email, password }) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password],
    );
    return result.rows[0];
  },

  async emailExists(email) {
    const result = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 LIMIT 1",
      [email],
    );
    return result.rowCount > 0;
  },
};

module.exports = UserModel;
