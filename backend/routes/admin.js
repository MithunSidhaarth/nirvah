import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireStaff } from "../middleware/admin.js";

const router = Router();

// Read-only overview for the admin/manager dashboard. Every route here is
// requireStaff (admin OR manager) — there is nothing to write. Actions that
// change state (verifying an NGO, approving a document) stay on their own
// routes in ngos.js / documents.js, gated by requireAdmin only.

router.get("/donations", requireAuth, requireStaff, async (req, res) => {
  const result = await pool.query(
    `SELECT d.id, d.title, d.category, d.place, d.status, d.created_at,
            donor.name AS donor_name, donor.org AS donor_org, donor.email AS donor_email,
            claimer.name AS claimed_by_name, claimer.org AS claimed_by_org
     FROM donations d
     JOIN users donor ON donor.id = d.donor_id
     LEFT JOIN users claimer ON claimer.id = d.claimed_by
     ORDER BY d.created_at DESC
     LIMIT 200`
  );

  res.json({
    donations: result.rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      place: r.place,
      status: r.status,
      createdAt: r.created_at,
      donor: { name: r.donor_name, org: r.donor_org, email: r.donor_email },
      claimedBy: r.claimed_by_name ? { name: r.claimed_by_name, org: r.claimed_by_org } : null,
    })),
  });
});

router.get("/stats", requireAuth, requireStaff, async (req, res) => {
  const [donationCounts, ngoCounts] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'listed') AS listed,
         COUNT(*) FILTER (WHERE claimed_by IS NOT NULL AND status NOT IN ('delivered','acknowledged','impact_recorded','documentation_complete','closed')) AS in_progress,
         COUNT(*) FILTER (WHERE status IN ('delivered','acknowledged','impact_recorded','documentation_complete','closed')) AS delivered
       FROM donations`
    ),
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE verification_status IN ('pending','under_review')) AS pending,
         COUNT(*) FILTER (WHERE verification_status = 'verified') AS verified
       FROM ngos`
    ),
  ]);

  res.json({
    donations: {
      total: Number(donationCounts.rows[0].total),
      listed: Number(donationCounts.rows[0].listed),
      inProgress: Number(donationCounts.rows[0].in_progress),
      delivered: Number(donationCounts.rows[0].delivered),
    },
    ngos: {
      total: Number(ngoCounts.rows[0].total),
      pendingVerification: Number(ngoCounts.rows[0].pending),
      verified: Number(ngoCounts.rows[0].verified),
    },
  });
});

export default router;
