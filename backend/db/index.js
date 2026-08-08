import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set — the server will fail on the first query. Copy .env.example to .env.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Managed Postgres providers (Render, Neon, Supabase) require SSL but use
  // certs that aren't in Node's default trust store. Localhost doesn't need
  // SSL at all, so only turn it on when we're not talking to localhost.
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

/**
 * Thin query helper. Everything downstream (routes) calls db.query(text, params)
 * the same way the pg driver expects: $1, $2... placeholders, returns { rows }.
 */
export function query(text, params) {
  return pool.query(text, params);
}

export default pool;
