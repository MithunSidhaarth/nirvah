import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { updateProfileSchema, changePasswordSchema } from "../lib/schemas.js";

const router = Router();

function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

// Same shape as GET /api/auth/me, kept here so the Settings page has its
// own dedicated endpoint to build on (e.g. once notification preferences
// or org-level settings land, they belong on this route, not on auth.js).
router.get("/profile", requireAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

router.patch("/profile", writeLimiter, requireAuth, validate(updateProfileSchema), async (req, res) => {
  const { name, org, city } = req.body;
  const updated = await pool.query(
    `UPDATE users SET name = $1, org = $2, city = $3 WHERE id = $4 RETURNING *`,
    [name, org || null, city, req.userId]
  );
  res.json({ user: publicUser(updated.rows[0]) });
});

router.post("/password", writeLimiter, requireAuth, validate(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "Account not found." });

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Your current password doesn't match." });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, req.userId]);

  res.json({ message: "Password updated." });
});

export default router;
