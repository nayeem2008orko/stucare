// db.js
// Exports a shared PostgreSQL connection pool used across the entire backend

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,              // maximum number of connections in the pool
  idleTimeoutMillis: 30000,  // close idle connections after 30 seconds
  connectionTimeoutMillis: 2000 // error if connection takes more than 2 seconds
});

// Test the connection when this module first loads
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully.');
    release();
  }
});

module.exports = pool;
