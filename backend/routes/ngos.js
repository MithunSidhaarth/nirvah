import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { validate, requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { ngoProfileSchema, ngoVerifyDecisionSchema } from "../lib/schemas.js";

const router = Router();

function serializeNgo(row, user) {
  return {
    userId: row.user_id,
    name: user?.name,
    org: user?.org,
    city: user?.city,
    registrationNumber: row.registration_number,
    form12abNumber: row.form_12ab_number,
    form12abValidUntil: row.form_12ab_valid_until,
    form80gNumber: row.form_80g_number,
    form80gValidUntil: row.form_80g_valid_until,
    csrEligible: row.csr_eligible,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at,
  };
}

async function getOwnNgoRow(userId) {
  const result = await pool.query(
    `SELECT n.*, u.name, u.org, u.city FROM ngos n JOIN users u ON u.id = n.user_id WHERE n.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

router.get("/me", requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });
  const row = await getOwnNgoRow(req.userId);
  if (!row) return res.status(404).json({ error: "NGO profile not found." });
  res.json({ ngo: serializeNgo(row, row) });
});

// Self-reported registration / 80G / 12AB details. Submitting these moves a
// still-pending profile into review — an admin still has to actually check
// the numbers (see /:id/verify below) before csr_eligible or "verified"
// mean anything.
router.patch("/me", requireAuth, validate(ngoProfileSchema), async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });

  const existing = await getOwnNgoRow(req.userId);
  if (!existing) return res.status(404).json({ error: "NGO profile not found." });

  const {
    registrationNumber,
    form12abNumber,
    form12abValidUntil,
    form80gNumber,
    form80gValidUntil,
  } = req.body;

  const nextStatus = existing.verification_status === "pending" ? "under_review" : existing.verification_status;

  const updated = await pool.query(
    `UPDATE ngos SET
       registration_number = COALESCE($1, registration_number),
       form_12ab_number = COALESCE($2, form_12ab_number),
       form_12ab_valid_until = COALESCE($3, form_12ab_valid_until),
       form_80g_number = COALESCE($4, form_80g_number),
       form_80g_valid_until = COALESCE($5, form_80g_valid_until),
       verification_status = $6
     WHERE user_id = $7
     RETURNING *`,
    [
      registrationNumber ?? null,
      form12abNumber ?? null,
      form12abValidUntil ?? null,
      form80gNumber ?? null,
      form80gValidUntil ?? null,
      nextStatus,
      req.userId,
    ]
  );

  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'ngo_profile_updated', 'ngo', $2, $3)`,
    [req.userId, existing.id, JSON.stringify({ nextStatus })]
  );

  res.json({ ngo: serializeNgo(updated.rows[0], existing) });
});

// Public verification badge lookup — Browse/DonationDetail can show "80G
// verified" next to an NGO without exposing the raw registration numbers.
router.get("/:id/status", requireIntParam(), async (req, res) => {
  const result = await pool.query(
    `SELECT verification_status, csr_eligible, form_80g_valid_until, form_12ab_valid_until
     FROM ngos WHERE user_id = $1`,
    [req.params.id]
  );
  const row = result.rows[0];
  if (!row) return res.status(404).json({ error: "NGO not found." });
  res.json({
    verificationStatus: row.verification_status,
    csrEligible: row.csr_eligible,
    form80gValidUntil: row.form_80g_valid_until,
    form12abValidUntil: row.form_12ab_valid_until,
  });
});

// ---- admin review ----

router.get("/pending", requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT n.*, u.name, u.org, u.city, u.email FROM ngos n
     JOIN users u ON u.id = n.user_id
     WHERE n.verification_status IN ('pending', 'under_review')
     ORDER BY n.updated_at ASC`
  );
  res.json({
    ngos: result.rows.map((row) => ({ ...serializeNgo(row, row), email: row.email })),
  });
});

router.post(
  "/:id/verify",
  writeLimiter,
  requireAuth,
  requireAdmin,
  requireIntParam(),
  validate(ngoVerifyDecisionSchema),
  async (req, res) => {
    const { status, notes } = req.body;

    const existing = await pool.query("SELECT * FROM ngos WHERE user_id = $1", [req.params.id]);
    const ngoRow = existing.rows[0];
    if (!ngoRow) return res.status(404).json({ error: "NGO not found." });

    // CSR eligibility follows 80G status specifically — 12AB alone covers
    // income-tax exemption for the NGO, but a donor's CSR/tax deduction
    // claim needs a valid 80G on file, so don't flip this on for less.
    const csrEligible = status === "verified" && !!ngoRow.form_80g_number;

    const updated = await pool.query(
      `UPDATE ngos
       SET verification_status = $1,
           verified_at = CASE WHEN $1 = 'verified' THEN now() ELSE verified_at END,
           csr_eligible = $2
       WHERE user_id = $3
       RETURNING *`,
      [status, csrEligible, req.params.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'ngo_verification_decision', 'ngo', $2, $3)`,
      [req.userId, ngoRow.id, JSON.stringify({ status, notes: notes || null })]
    );

    res.json({ ngo: serializeNgo(updated.rows[0], updated.rows[0]) });
  }
);

export default router;
