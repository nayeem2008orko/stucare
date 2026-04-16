// env.js
// Validates that all required environment variables exist at startup
// If any are missing, the app crashes immediately with a clear error message
// This prevents mysterious bugs from missing config

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'OPENROUTER_API_KEY',
  'ALGORITHM_SERVICE_URL'
];

function validateEnv() {
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    process.exit(1);
  }

  console.log('Environment variables validated.');
}

module.exports = { validateEnv };