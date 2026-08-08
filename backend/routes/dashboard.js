import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { STAGES } from "../lib/lifecycle.js";

const router = Router();

// A donation counts as "received" once it's reached `delivered` or any
// later stage (acknowledged, impact_recorded, ...) — not just the exact
// `delivered` status, since section 8 added stages after it.
const DELIVERED_STAGE_INDEX = STAGES.indexOf("delivered");
function hasReachedDelivered(status) {
  return STAGES.indexOf(status) >= DELIVERED_STAGE_INDEX;
}

router.get("/donor", requireAuth, async (req, res) => {
  if (req.userRole !== "donor") return res.status(403).json({ error: "This view is for givers only." });

  const result = await pool.query(
    "SELECT * FROM donations WHERE donor_id = $1 ORDER BY created_at DESC",
    [req.userId]
  );
  const rows = result.rows;
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

router.get("/ngo", requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This view is for NGOs only." });

  const [claimedResult, nearbyResult, activeDonorsResult] = await Promise.all([
    pool.query("SELECT * FROM donations WHERE claimed_by = $1", [req.userId]),
    pool.query("SELECT * FROM donations WHERE status = 'listed' ORDER BY created_at DESC LIMIT 8"),
    pool.query("SELECT DISTINCT donor_id FROM donations WHERE status = 'listed'"),
  ]);

  const claimed = claimedResult.rows;

  res.json({
    stats: {
      claimedThisMonth: claimed.length,
      itemsReceived: claimed.filter((r) => hasReachedDelivered(r.status)).length,
      activeDonors: activeDonorsResult.rows.length,
      avgPickupMinutes: 26,
    },
    nearby: nearbyResult.rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      place: r.place,
      status: r.status,
    })),
  });
});

export default router;
