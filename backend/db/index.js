import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "nirvah.sqlite"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL CHECK (role IN ('donor', 'ngo')),
    name TEXT NOT NULL,
    org TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    city TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    donor_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity TEXT,
    description TEXT,
    place TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'claimed', 'delivered')),
    expires_at TEXT,
    claimed_by INTEGER REFERENCES users(id),
    claimed_at TEXT,
    delivered_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
