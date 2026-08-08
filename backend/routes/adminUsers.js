import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { updateUserRoleSchema } from "../lib/schemas.js";

const router = Router();

// Every route here is requireAdmin only. A manager can see the read-only
// donations/NGO queues (admin.js, ngos.js) and can now verify NGOs too
// (ngos.js), but who gets to be staff, who's banned, and who's removed
// stays sudo-only — same tier as site settings.

function serializeUser(row) {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    org: row.org,
    email: row.email,
    city: row.city,
    emailVerified: row.email_verified,
    bannedAt: row.banned_at,
    createdAt: row.created_at,
  };
}

router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 500`
  );
  res.json({ users: result.rows.map(serializeUser) });
});

// Promote a donor to manager, or demote a manager back to donor. NGO and
// admin accounts don't go through this route — an NGO account carries a
// whole profile (see the ngos table) a staff role doesn't fit, and there's
// always exactly one admin per deployment, provisioned via seed-staff.js.
router.patch(
  "/users/:id/role",
  writeLimiter,
  requireAuth,
  requireAdmin,
  requireIntParam(),
  async (req, res) => {
    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request." });
    }
    const { role } = parsed.data;

    if (Number(req.params.id) === req.userId) {
      return res.status(400).json({ error: "You can't change your own role." });
    }

    const existing = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    const target = existing.rows[0];
    if (!target) return res.status(404).json({ error: "User not found." });
    if (!["donor", "manager"].includes(target.role)) {
      return res.status(400).json({ error: "Only donor and manager accounts can change roles here." });
    }

    const updated = await pool.query(`UPDATE users SET role = $1 WHERE id = $2 RETURNING *`, [
      role,
      req.params.id,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user_role_changed', 'user', $2, $3)`,
      [req.userId, target.id, JSON.stringify({ from: target.role, to: role })]
    );

    res.json({ user: serializeUser(updated.rows[0]) });
  }
);

router.post(
  "/users/:id/ban",
  writeLimiter,
  requireAuth,
  requireAdmin,
  requireIntParam(),
  async (req, res) => {
    if (Number(req.params.id) === req.userId) {
      return res.status(400).json({ error: "You can't ban your own account." });
    }

    const existing = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    const target = existing.rows[0];
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.role === "admin") {
      return res.status(403).json({ error: "Admin accounts can't be banned here." });
    }

    const updated = await pool.query(`UPDATE users SET banned_at = now() WHERE id = $1 RETURNING *`, [
      req.params.id,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user_banned', 'user', $2, '{}')`,
      [req.userId, target.id]
    );

    res.json({ user: serializeUser(updated.rows[0]) });
  }
);

router.post(
  "/users/:id/unban",
  writeLimiter,
  requireAuth,
  requireAdmin,
  requireIntParam(),
  async (req, res) => {
    const existing = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    const target = existing.rows[0];
    if (!target) return res.status(404).json({ error: "User not found." });

    const updated = await pool.query(`UPDATE users SET banned_at = NULL WHERE id = $1 RETURNING *`, [
      req.params.id,
    ]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user_unbanned', 'user', $2, '{}')`,
      [req.userId, target.id]
    );

    res.json({ user: serializeUser(updated.rows[0]) });
  }
);

// Soft delete — sets deleted_at rather than running a real SQL DELETE.
// Donations, documents, and audit_logs all reference users.id with no
// cascade, so a hard delete would fail outright (or silently orphan
// history) for anyone with even one donation on record. Soft delete blocks
// login on the user's very next request (see requireAuth) and drops them
// from every admin list here, while everything they're attached to keeps
// its trail intact.
router.delete(
  "/users/:id",
  writeLimiter,
  requireAuth,
  requireAdmin,
  requireIntParam(),
  async (req, res) => {
    if (Number(req.params.id) === req.userId) {
      return res.status(400).json({ error: "You can't remove your own account." });
    }

    const existing = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
      [req.params.id]
    );
    const target = existing.rows[0];
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.role === "admin") {
      return res.status(403).json({ error: "Admin accounts can't be removed here." });
    }

    await pool.query(`UPDATE users SET deleted_at = now() WHERE id = $1`, [req.params.id]);

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'user_removed', 'user', $2, '{}')`,
      [req.userId, target.id]
    );

    res.json({ message: "User removed." });
  }
);

export default router;
