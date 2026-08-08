import { Router } from "express";
import db from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/donor", requireAuth, (req, res) => {
  if (req.userRole !== "donor") return res.status(403).json({ error: "This view is for givers only." });

  const rows = db.prepare("SELECT * FROM donations WHERE donor_id = ? ORDER BY created_at DESC").all(req.userId);
  const activeListings = rows.filter((r) => r.status === "listed").length;
  const ngosMatched = new Set(rows.filter((r) => r.claimed_by).map((r) => r.claimed_by)).size;

  res.json({
    stats: {
      activeListings,
      itemsGiven: rows.length,
      ngosMatched,
      avgMatchMinutes: 18,
    },
    listings: rows.slice(0, 6).map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      place: r.place,
      status: r.status,
    })),
  });
});

router.get("/ngo", requireAuth, (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This view is for NGOs only." });

  const claimed = db.prepare("SELECT * FROM donations WHERE claimed_by = ?").all(req.userId);
  const nearby = db.prepare("SELECT * FROM donations WHERE status = 'listed' ORDER BY created_at DESC LIMIT 8").all();
  const activeDonors = new Set(db.prepare("SELECT DISTINCT donor_id FROM donations WHERE status = 'listed'").all().map((r) => r.donor_id)).size;

  res.json({
    stats: {
      claimedThisMonth: claimed.length,
      itemsReceived: claimed.filter((r) => r.status === "delivered").length,
      activeDonors,
      avgPickupMinutes: 26,
    },
    nearby: nearby.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      place: r.place,
      status: r.status,
    })),
  });
});

export default router;
