import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ---------------------------------------------------------------------------
// Section 10 — Tax
//
// Donations here are in-kind (food, clothing, supplies), not cash, and
// nothing in the schema puts a rupee value on a donation — so this isn't
// "compute my deduction". It's the record a donor needs to hand to their CA:
// every donation that reached an 80G-registered NGO, whether that NGO's
// verification actually cleared, and whatever tax_document paperwork (a
// receipt, an 80G certificate copy) has been attached to each one. No new
// tables — this is a read-only view over donations + ngos + documents that
// already exist.
// ---------------------------------------------------------------------------

function serializeRow(row) {
  return {
    donationId: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    deliveredAt: row.delivered_at,
    closedAt: row.closed_at,
    ngoName: row.ngo_org,
    ngoVerified: row.verification_status === "verified",
    ngo80gNumber: row.form_80g_number,
    ngo80gValidUntil: row.form_80g_valid_until,
    taxDocuments: row.tax_documents || [],
  };
}

// A donation counts toward this summary once delivery has actually
// happened — no point listing something still sitting at `listed`.
const ELIGIBLE_STATUSES = [
  "delivered", "acknowledged", "impact_recorded", "documentation_complete", "closed",
];

router.get("/donors/me/tax-summary", requireAuth, async (req, res) => {
  if (req.userRole !== "donor") {
    return res.status(403).json({ error: "This is for donor accounts only." });
  }

  const result = await pool.query(
    `SELECT
       d.id, d.title, d.category, d.status, d.delivered_at, d.closed_at,
       u.org AS ngo_org,
       n.verification_status, n.form_80g_number, n.form_80g_valid_until,
       COALESCE(
         (SELECT json_agg(json_build_object(
            'id', doc.id, 'fileUrl', doc.file_url, 'fileName', doc.file_name, 'status', doc.status
          ) ORDER BY doc.created_at DESC)
          FROM documents doc
          WHERE doc.donation_id = d.id AND doc.type = 'tax_document'),
         '[]'
       ) AS tax_documents
     FROM donations d
     LEFT JOIN users u ON u.id = d.claimed_by
     LEFT JOIN ngos n ON n.user_id = d.claimed_by
     WHERE d.donor_id = $1 AND d.status = ANY($2::donation_status[])
     ORDER BY d.delivered_at DESC NULLS LAST, d.created_at DESC`,
    [req.userId, ELIGIBLE_STATUSES]
  );

  const donations = result.rows.map(serializeRow);
  res.json({
    donations,
    summary: {
      totalDonations: donations.length,
      to80gVerifiedNgos: donations.filter((d) => d.ngoVerified && d.ngo80gNumber).length,
      withTaxDocuments: donations.filter((d) => d.taxDocuments.length > 0).length,
    },
  });
});

export default router;
