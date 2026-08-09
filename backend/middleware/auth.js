import jwt from "jsonwebtoken";
import pool from "../db/index.js";

// A missing JWT_SECRET used to silently fall back to a hardcoded default —
// fine for local dev, but if that fallback ever ran anywhere real, every
// token would be signed with a secret sitting in plain sight in this file,
// and anyone could forge a valid session (including an admin one). Same
// "is this actually local dev" check db/index.js already uses for SSL,
// rather than trusting NODE_ENV to be set correctly by the platform.
const isLocalDev = (process.env.DATABASE_URL || "").includes("localhost");
if (!process.env.JWT_SECRET && !isLocalDev) {
  throw new Error(
    "JWT_SECRET is not set. Refusing to start with a default/guessable secret — set JWT_SECRET in your environment."
  );
}
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
}

// Every authenticated request re-checks the user's current role and standing
// against the database instead of trusting the JWT claim alone. Two things
// need that: (1) a ban or removal (see routes/adminUsers.js) has to block
// the very next request, not whenever their 30-day token happens to expire;
// (2) a role change — e.g. an admin promoting a donor to manager — should
// unlock the new permissions immediately, without asking them to log out
// and back in. req.userRole always reflects the database, never the token.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "You need to be logged in for this." });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }

  const result = await pool.query(
    "SELECT role, banned_at, deleted_at FROM users WHERE id = $1",
    [payload.id]
  );
  const user = result.rows[0];

  if (!user || user.deleted_at) {
    return res.status(401).json({ error: "This account no longer exists." });
  }
  if (user.banned_at) {
    return res.status(403).json({ error: "This account has been suspended." });
  }

  req.userId = payload.id;
  req.userRole = user.role;
  next();
}
