// app.js
// Express application setup — middleware, routes, error handler

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const { validateEnv }       = require('./src/config/env');
const { generalLimiter }    = require('./src/middleware/rateLimit.middleware');
const { errorMiddleware }   = require('./src/middleware/error.middleware');
const logger                = require('./src/utils/logger');

// Validate env vars before anything else
validateEnv();

const app = express();

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());   // sets secure HTTP headers
app.use(cors({
  origin:      process.env.FRONTEND_URL,
  credentials: true
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));  // reject oversized payloads
app.use(express.urlencoded({ extended: false }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api', generalLimiter);



// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./src/routes/auth.routes'));
app.use('/api/planner',   require('./src/routes/planner.routes'));
app.use('/api/chatbot',   require('./src/routes/chatbot.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stucare-backend' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;