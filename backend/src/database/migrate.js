require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set in your .env file");
  process.exit(1);
}

console.log(
  "Using DATABASE_URL:",
  process.env.DATABASE_URL.replace(/:([^:@]+)@/, ":****@"),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "migrations");

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} migration files.\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf8");

    try {
      console.log(`Running: ${file}`);
      await pool.query(sql);
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.error(`  ✗ Failed on ${file}:`);
      console.error(`    ${err.message}\n`);
      process.exit(1);
    }
  }

  console.log("All migrations completed successfully.");
  await pool.end();
}

runMigrations();
