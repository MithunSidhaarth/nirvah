import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { addTeamMemberSchema } from "../lib/schemas.js";

const router = Router();

function serializeMember(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function getOwnNgoId(userId) {
  const result = await pool.query("SELECT id FROM ngos WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

router.get("/me/team", requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });

  const ngoId = await getOwnNgoId(req.userId);
  if (!ngoId) return res.status(404).json({ error: "NGO profile not found." });

  const result = await pool.query(
    "SELECT * FROM ngo_team_members WHERE ngo_id = $1 ORDER BY created_at ASC",
    [ngoId]
  );
  res.json({ team: result.rows.map(serializeMember) });
});

router.post("/me/team", writeLimiter, requireAuth, validate(addTeamMemberSchema), async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });

  const ngoId = await getOwnNgoId(req.userId);
  if (!ngoId) return res.status(404).json({ error: "NGO profile not found." });

  const { name, email, role } = req.body;

  const existing = await pool.query(
    "SELECT id FROM ngo_team_members WHERE ngo_id = $1 AND email = $2",
    [ngoId, email]
  );
  if (existing.rows.length) {
    return res.status(409).json({ error: "That person is already on your team." });
  }

  const inserted = await pool.query(
    `INSERT INTO ngo_team_members (ngo_id, name, email, role, added_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [ngoId, name, email, role, req.userId]
  );

  res.status(201).json({ member: serializeMember(inserted.rows[0]) });
});

router.delete("/me/team/:id", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });

  const ngoId = await getOwnNgoId(req.userId);
  if (!ngoId) return res.status(404).json({ error: "NGO profile not found." });

  const result = await pool.query(
    "DELETE FROM ngo_team_members WHERE id = $1 AND ngo_id = $2 RETURNING id",
    [req.params.id, ngoId]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Team member not found." });

  res.json({ message: "Removed from your team." });
});

export default router;
