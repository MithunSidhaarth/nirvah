import { Router } from "express";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function serialize(row) {
  const donor = db.prepare("SELECT name, org, city FROM users WHERE id = ?").get(row.donor_id);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    quantity: row.quantity,
    description: row.description,
    place: row.place,
    status: row.status,
    expiresAt: row.expires_at,
    donor: donor?.org || donor?.name || "A giver on Nirvah",
    createdAt: row.created_at,
  };
}

router.get("/", (req, res) => {
  const { category, status } = req.query;
  let sql = "SELECT * FROM donations WHERE 1 = 1";
  const args = [];
  if (category && category !== "all") { sql += " AND category = ?"; args.push(category); }
  if (status) { sql += " AND status = ?"; args.push(status); }
  sql += " ORDER BY created_at DESC";
  const rows = db.prepare(sql).all(...args);
  res.json({ donations: rows.map(serialize) });
});

router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  res.json({ donation: serialize(row) });
});

router.post("/", requireAuth, (req, res) => {
  if (req.userRole !== "donor") return res.status(403).json({ error: "Only givers can post a listing." });
  const { title, category, quantity, description, place, expiresInMs } = req.body || {};
  if (!title || !category || !place) return res.status(400).json({ error: "Please fill in the required fields." });

  const expiresAt = expiresInMs ? new Date(Date.now() + Number(expiresInMs)).toISOString() : null;
  const info = db
    .prepare("INSERT INTO donations (donor_id, title, category, quantity, description, place, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(req.userId, title, category, quantity || null, description || null, place, expiresAt);

  const row = db.prepare("SELECT * FROM donations WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ donation: serialize(row) });
});

router.post("/:id/claim", requireAuth, (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "Only NGOs can claim a listing." });
  const row = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.status !== "listed") return res.status(409).json({ error: "This listing has already been claimed." });

  db.prepare("UPDATE donations SET status = 'claimed', claimed_by = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.userId, req.params.id);
  const updated = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  res.json({ donation: serialize(updated) });
});

router.post("/:id/complete", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.claimed_by !== req.userId) return res.status(403).json({ error: "Only the NGO that claimed this can mark it delivered." });

  db.prepare("UPDATE donations SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  const updated = db.prepare("SELECT * FROM donations WHERE id = ?").get(req.params.id);
  res.json({ donation: serialize(updated) });
});

export default router;
