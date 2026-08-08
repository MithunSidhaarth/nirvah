/**
 * Creates (or updates) the three staff accounts:
 *   mithun  -> admin   (full sudo: NGO verification decisions, document
 *                        approval, anything that edits site state)
 *   nidhi, pramish -> manager (read-only: can see all donations, claims,
 *                        and the NGO verification queue; cannot approve/
 *                        reject anything or change any site settings)
 *
 * There's no signup form for these — /api/auth/signup only accepts
 * role donor/ngo (see lib/schemas.js) — so staff accounts are provisioned
 * here, directly against the database, run once by whoever operates it.
 *
 * Usage:
 *   ADMIN_EMAIL=mithun@nirvah.org \
 *   MANAGER1_EMAIL=nidhi@nirvah.org \
 *   MANAGER2_EMAIL=pramish@nirvah.org \
 *   npm run seed:staff
 *
 * If you don't pass ADMIN_PASSWORD / MANAGER1_PASSWORD / MANAGER2_PASSWORD,
 * a random password is generated for each account and printed ONCE below.
 * Save it immediately — it isn't stored anywhere in recoverable form, only
 * as a bcrypt hash. Anyone can change their own password afterward via the
 * normal "forgot password" flow at /forgot-password.
 */
import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import pool from "./index.js";

function randomPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

const STAFF = [
  {
    key: "ADMIN",
    role: "admin",
    name: process.env.ADMIN_NAME || "Mithun",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  {
    key: "MANAGER1",
    role: "manager",
    name: process.env.MANAGER1_NAME || "Nidhi",
    email: process.env.MANAGER1_EMAIL,
    password: process.env.MANAGER1_PASSWORD,
  },
  {
    key: "MANAGER2",
    role: "manager",
    name: process.env.MANAGER2_NAME || "Pramish",
    email: process.env.MANAGER2_EMAIL,
    password: process.env.MANAGER2_PASSWORD,
  },
];

async function upsertStaff({ role, name, email, password }) {
  if (!email) {
    console.log(`Skipping ${role} — set ${role.toUpperCase()}_EMAIL (and optionally _PASSWORD) to create it.`);
    return;
  }

  const plainPassword = password || randomPassword();
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

  if (existing.rows.length) {
    await pool.query(
      `UPDATE users SET role = $1, name = $2, password_hash = $3, email_verified = TRUE WHERE email = $4`,
      [role, name, passwordHash, email]
    );
    console.log(`Updated existing account for ${email} -> role ${role}.`);
  } else {
    await pool.query(
      `INSERT INTO users (role, name, email, password_hash, email_verified)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [role, name, email, passwordHash]
    );
    console.log(`Created ${role} account: ${email}`);
  }

  if (!password) {
    console.log(`  -> generated password (save this now, it will not be shown again): ${plainPassword}`);
  }
}

async function main() {
  for (const staff of STAFF) {
    await upsertStaff(staff);
  }
  await pool.end();
}

main().catch((err) => {
  console.error("Seeding staff accounts failed:", err.message);
  process.exit(1);
});
