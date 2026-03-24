const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number.parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  initDb: (process.env.INIT_DB || "true").toLowerCase() === "true",
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL must be set in the environment.");
}

module.exports = env;
