import pool from "../db/index.js";

// There's no admin role in the users enum yet (adding one is a one-line
// ALTER TYPE per the comment in schema.sql, but it's still a migration).
// Until that lands, admins are just users whose email is listed in
// ADMIN_EMAILS. This runs after requireAuth, so req.userId is already set.
function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireAdmin(req, res, next) {
  const allowed = adminEmails();
  if (allowed.size === 0) {
    return res.status(503).json({ error: "Admin access isn't configured on this server yet." });
  }

  const result = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
  const user = result.rows[0];
  if (!user || !allowed.has(user.email.toLowerCase())) {
    return res.status(403).json({ error: "Admin access required." });
  }

  next();
}
