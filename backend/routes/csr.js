import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// Section 11 — CSR
//
// `csr_eligible` already exists on ngos (verified + an 80G number on file —
// see routes/ngos.js). What was missing is anywhere for a CSR-eligible NGO
// to actually see the donations it can report against, and the csr_evidence
// documents backing them up. Like tax.js, this is a read-only rollup over
// existing tables, grouped by category so it's ready to paste into a CSR
// report — no new schema.
// ---------------------------------------------------------------------------

const ELIGIBLE_STATUSES = [
  "delivered", "acknowledged", "impact_recorded", "documentation_complete", "closed",
];

function serializeRow(row) {
  return {
    donationId: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    deliveredAt: row.delivered_at,
    closedAt: row.closed_at,
    donorName: row.donor_org || row.donor_name,
    csrEvidence: row.csr_evidence || [],
    hasImpactRecord: row.has_impact,
  };
}

router.get("/ngos/me/csr-summary", requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") {
    return res.status(403).json({ error: "This is for NGO accounts only." });
  }

  const ngoResult = await pool.query(
    "SELECT id, csr_eligible FROM ngos WHERE user_id = $1",
    [req.userId]
  );
  const ngo = ngoResult.rows[0];
  if (!ngo) return res.status(404).json({ error: "NGO profile not found." });
  if (!ngo.csr_eligible) {
    return res.status(403).json({
      error: "CSR reporting is only available once your NGO is verified with an 80G number on file.",
    });
  }

  const result = await pool.query(
    `SELECT
       d.id, d.title, d.category, d.status, d.delivered_at, d.closed_at,
       u.org AS donor_org, u.name AS donor_name,
       EXISTS(SELECT 1 FROM impact_records ir WHERE ir.donation_id = d.id) AS has_impact,
       COALESCE(
         (SELECT json_agg(json_build_object(
            'id', doc.id, 'fileUrl', doc.file_url, 'fileName', doc.file_name, 'status', doc.status
          ) ORDER BY doc.created_at DESC)
          FROM documents doc
          WHERE doc.donation_id = d.id AND doc.type = 'csr_evidence'),
         '[]'
       ) AS csr_evidence
     FROM donations d
     LEFT JOIN users u ON u.id = d.donor_id
     WHERE d.claimed_by = $1 AND d.status = ANY($2::donation_status[])
     ORDER BY d.delivered_at DESC NULLS LAST, d.created_at DESC`,
    [req.userId, ELIGIBLE_STATUSES]
  );

  const donations = result.rows.map(serializeRow);
  const byCategory = donations.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});

  res.json({
    donations,
    summary: {
      totalDonations: donations.length,
      uniqueDonors: new Set(donations.map((d) => d.donorName).filter(Boolean)).size,
      withCsrEvidence: donations.filter((d) => d.csrEvidence.length > 0).length,
      byCategory,
    },
  });
});

export default router;
