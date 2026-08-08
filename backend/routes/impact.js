import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { upload, fileUrlFor, handleUploadErrors } from "../lib/uploads.js";
import { impactRecordSchema } from "../lib/schemas.js";
import { advanceDonation, canTransition, LifecycleError } from "../lib/lifecycle.js";

const router = Router();

function serializeImpact(row) {
  return {
    id: row.id,
    donationId: row.donation_id,
    ngoId: row.ngo_id,
    beneficiaryCount: row.beneficiary_count,
    location: row.location,
    itemsDelivered: row.items_delivered,
    photos: row.photos,
    ngoAcknowledged: row.ngo_acknowledged,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// NGO reports what actually happened with a delivered donation: how many
// people it reached, where, and photo proof. Requires the donation to
// already be delivered — this doesn't move the donation's own lifecycle
// stage forward (that state machine is handled separately); it just
// attaches an impact record any donor/NGO/admin can read afterward.
router.post(
  "/donations/:id/impact",
  writeLimiter,
  requireIntParam(),
  requireAuth,
  upload.array("photos", 5),
  handleUploadErrors,
  async (req, res) => {
    if (req.userRole !== "ngo") return res.status(403).json({ error: "Only the claiming NGO can log impact." });

    const parsed = impactRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request." });
    }
    const { beneficiaryCount, location, itemsDelivered, notes } = parsed.data;

    const donationResult = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = donationResult.rows[0];
    if (!donation) return res.status(404).json({ error: "That listing could not be found." });
    if (donation.claimed_by !== req.userId) {
      return res.status(403).json({ error: "Only the NGO that claimed this can log impact for it." });
    }
    if (!["delivered", "acknowledged"].includes(donation.status)) {
      return res.status(409).json({ error: "Mark this donation as delivered before logging impact." });
    }

    const ngoResult = await pool.query("SELECT id FROM ngos WHERE user_id = $1", [req.userId]);
    const ngo = ngoResult.rows[0];
    if (!ngo) return res.status(404).json({ error: "NGO profile not found." });

    const photoUrls = (req.files || []).map((f) => fileUrlFor(f.filename));

    const inserted = await pool.query(
      `INSERT INTO impact_records
         (donation_id, ngo_id, beneficiary_count, location, items_delivered, photos, ngo_acknowledged, notes)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, TRUE, $7)
       RETURNING *`,
      [
        donation.id,
        ngo.id,
        beneficiaryCount ?? null,
        location ?? null,
        itemsDelivered ?? null,
        JSON.stringify(photoUrls),
        notes ?? null,
      ]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'impact_logged', 'donation', $2, $3)`,
      [req.userId, donation.id, JSON.stringify({ impactRecordId: inserted.rows[0].id })]
    );

    // Logging impact moves the donation's own lifecycle stage forward too
    // (TODO section 8) — from either `delivered` or `acknowledged` to
    // `impact_recorded`. If something else already moved it there first
    // (e.g. a concurrent request), that's fine — the impact record itself
    // still saved, so don't fail the request over a no-op transition.
    if (canTransition(donation.status, "impact_recorded")) {
      try {
        await advanceDonation({
          donationId: donation.id,
          toStatus: "impact_recorded",
          userId: req.userId,
          action: "donation_impact_recorded",
          metadata: { impactRecordId: inserted.rows[0].id },
        });
      } catch (err) {
        if (!(err instanceof LifecycleError)) throw err;
      }
    }

    res.status(201).json({ impact: serializeImpact(inserted.rows[0]) });
  }
);

router.get("/donations/:id/impact", requireIntParam(), async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM impact_records WHERE donation_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json({ impact: result.rows.map(serializeImpact) });
});

export default router;
