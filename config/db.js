import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch(err => {
    console.error("❌ DB CONNECTION ERROR:", err);
    process.exit(1);
  });
