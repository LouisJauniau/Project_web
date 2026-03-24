const app = require("./app");
const env = require("./config/env");
const pool = require("./db/pool");
const initializeDatabase = require("./db/initDb");

async function bootstrap() {
  try {
    await pool.query("SELECT 1");
    if (env.initDb) {
      await initializeDatabase();
    }

    app.listen(env.port, () => {
      console.log(`Node API running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

bootstrap();
