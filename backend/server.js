// server.js
// Entry point — starts the HTTP server

require('dotenv').config();
const app    = require('./app');
const logger = require('./src/utils/logger');

// Connect to DB on startup (just to verify connection)
require('./src/config/db');

const PORT = process.env.PORT;

app.listen(PORT, () => {
  logger.info(`StuCare backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});