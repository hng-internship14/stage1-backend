import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// deep connection from above
pool.connect()
  .then(client => {
    console.log("✅ Connected to PostgreSQL");

    client.release();
  })
  .catch(err => {
    console.error("❌ DB CONNECTION ERROR:", err.message);
  });
