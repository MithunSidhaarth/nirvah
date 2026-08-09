import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/admin.js";
import { validate, requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { upload, fileUrlFor, handleUploadErrors } from "../lib/uploads.js";
import { createDonationSchema, listDonationsQuerySchema } from "../lib/schemas.js";
import { advanceDonation, getDonationHistory, LifecycleError } from "../lib/lifecycle.js";

const router = Router();

async function serialize(row) {
  const donorResult = await pool.query("SELECT name, org, city FROM users WHERE id = $1", [row.donor_id]);
  const donor = donorResult.rows[0];

  let ngo = null;
  if (row.claimed_by) {
    const ngoResult = await pool.query("SELECT name, org, city FROM users WHERE id = $1", [row.claimed_by]);
    ngo = ngoResult.rows[0] || null;
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    quantity: row.quantity,
    description: row.description,
    place: row.place,
    status: row.status,
    photoUrl: row.photo_url,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    // Only present when the caller supplied their own lat/lng to GET
    // /donations (see the Haversine SELECT below) — undefined otherwise,
    // so it just disappears from the JSON rather than showing null noise.
    distanceKm: row.distance_km != null ? Math.round(Number(row.distance_km) * 10) / 10 : undefined,
    expiresAt: row.expires_at,
    donor: donor?.org || donor?.name || "A giver on Nirvah",
    donorId: row.donor_id,
    ngo: ngo ? ngo.org || ngo.name : null,
    ngoCity: ngo?.city || null,
    ngoId: row.claimed_by,
    createdAt: row.created_at,
    // One timestamp per lifecycle stage (TODO section 8) so the frontend
    // can render a full "here's what happened and when" trail without a
    // second request — getDonationHistory() below is for the richer
    // who-did-it audit view.
    listedAt: row.listed_at,
    matchedAt: row.matched_at,
    claimedAt: row.claimed_at,
    acceptedAt: row.accepted_at,
    pickupAt: row.pickup_at,
    deliveredAt: row.delivered_at,
    acknowledgedAt: row.acknowledged_at,
    impactRecordedAt: row.impact_recorded_at,
    documentationCompleteAt: row.documentation_complete_at,
    closedAt: row.closed_at,
  };
}

// Every /:id/<verb> lifecycle route below follows the same shape: check who
// is allowed to make this particular move, then hand off to
// advanceDonation() for the actual state change + audit log. Centralizing
// the error handling here keeps each route to just its own permission
// check.
function handleLifecycleError(err, res) {
  if (err instanceof LifecycleError) {
    return res.status(err.status).json({ error: err.message });
  }
  throw err;
}

router.get("/", validate(listDonationsQuerySchema, "query"), async (req, res) => {
  const { category, status, lat, lng } = req.query;
  const clauses = [];
  const args = [];

  if (category && category !== "all") {
    args.push(category);
    clauses.push(`category = $${args.length}`);
  }
  if (status) {
    args.push(status);
    clauses.push(`status = $${args.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  // "Near me" — only kicks in when the viewer supplied their own
  // coordinates (Browse.jsx's location toggle, browser geolocation, no
  // external geocoding service involved). Haversine great-circle distance
  // computed right in the SELECT rather than pulled in as a Postgres
  // extension (earthdistance/postgis), since we only need "sort by
  // approximate distance," not routing. Listings without their own
  // latitude/longitude can't have a distance, so they sort after everyone
  // who does (NULLS LAST) instead of disappearing from the list.
  if (lat != null && lng != null) {
    args.push(lat, lng);
    const latIdx = args.length - 1;
    const lngIdx = args.length;
    const result = await pool.query(
      `SELECT *,
              CASE WHEN latitude IS NULL OR longitude IS NULL THEN NULL ELSE
                6371 * acos(LEAST(1, GREATEST(-1,
                  cos(radians($${latIdx})) * cos(radians(latitude)) * cos(radians(longitude) - radians($${lngIdx}))
                  + sin(radians($${latIdx})) * sin(radians(latitude))
                )))
              END AS distance_km
       FROM donations
       ${where}
       ORDER BY distance_km ASC NULLS LAST, created_at DESC`,
      args
    );
    return res.json({ donations: await Promise.all(result.rows.map(serialize)) });
  }

  const result = await pool.query(`SELECT * FROM donations ${where} ORDER BY created_at DESC`, args);
  res.json({ donations: await Promise.all(result.rows.map(serialize)) });
});

// Every listing the logged-in donor has ever posted, newest first — the
// full history behind "My listings" (the dashboard overview only shows the
// most recent 6). Ordering this before /:id matters even though
// requireIntParam() would reject "mine" anyway: it keeps the routing
// obviously correct without relying on that side effect.
router.get("/mine", requireAuth, validate(listDonationsQuerySchema, "query"), async (req, res) => {
  if (req.userRole !== "donor") return res.status(403).json({ error: "This view is for givers only." });

  const { category, status } = req.query;
  const clauses = ["donor_id = $1"];
  const args = [req.userId];

  if (category && category !== "all") {
    args.push(category);
    clauses.push(`category = $${args.length}`);
  }
  if (status) {
    args.push(status);
    clauses.push(`status = $${args.length}`);
  }

  const result = await pool.query(
    `SELECT * FROM donations WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,
    args
  );
  res.json({ donations: await Promise.all(result.rows.map(serialize)) });
});

// Everything the logged-in NGO has claimed, newest first — "Claimed by us".
router.get("/claimed", requireAuth, validate(listDonationsQuerySchema, "query"), async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This view is for NGOs only." });

  const { category, status } = req.query;
  const clauses = ["claimed_by = $1"];
  const args = [req.userId];

  if (category && category !== "all") {
    args.push(category);
    clauses.push(`category = $${args.length}`);
  }
  if (status) {
    args.push(status);
    clauses.push(`status = $${args.length}`);
  }

  const result = await pool.query(
    `SELECT * FROM donations WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`,
    args
  );
  res.json({ donations: await Promise.all(result.rows.map(serialize)) });
});

router.get("/:id", requireIntParam(), async (req, res) => {
  const result = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = result.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  res.json({ donation: await serialize(row) });
});

// Full status + audit trail: every stage change, plus document reviews and
// impact logging recorded against this donation, oldest first.
router.get("/:id/history", requireIntParam(), async (req, res) => {
  const existing = await pool.query("SELECT id FROM donations WHERE id = $1", [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: "That listing could not be found." });
  res.json({ history: await getDonationHistory(req.params.id) });
});

router.post("/", writeLimiter, requireAuth, validate(createDonationSchema), async (req, res) => {
  if (req.userRole !== "donor") return res.status(403).json({ error: "Only givers can post a listing." });
  const { title, category, quantity, description, place, expiresInMs, latitude, longitude } = req.body;

  const expiresAt = expiresInMs ? new Date(Date.now() + expiresInMs).toISOString() : null;
  const inserted = await pool.query(
    `INSERT INTO donations (donor_id, title, category, quantity, description, place, expires_at, latitude, longitude)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [req.userId, title, category, quantity || null, description || null, place, expiresAt, latitude ?? null, longitude ?? null]
  );

  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'donation_listed', 'donation', $2, '{}'::jsonb)`,
    [req.userId, inserted.rows[0].id]
  );

  res.status(201).json({ donation: await serialize(inserted.rows[0]) });
});

// A listing photo is attached after the text listing exists, same
// create-then-attach pattern as NGO/donation documents (lib/uploads.js) —
// keeps this route a plain single-file multipart upload instead of mixing
// multipart parsing into the JSON-validated POST / above. Only the donor
// who posted it can attach or replace its photo.
router.post(
  "/:id/photo",
  writeLimiter,
  requireIntParam(),
  requireAuth,
  upload.single("photo"),
  handleUploadErrors,
  async (req, res) => {
    const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const row = existing.rows[0];
    if (!row) return res.status(404).json({ error: "That listing could not be found." });
    if (row.donor_id !== req.userId) {
      return res.status(403).json({ error: "Only the giver who posted this can add a photo." });
    }
    if (!req.file) return res.status(400).json({ error: "No photo was uploaded." });

    const photoUrl = fileUrlFor(req.file.filename);
    const updated = await pool.query(`UPDATE donations SET photo_url = $1 WHERE id = $2 RETURNING *`, [
      photoUrl,
      req.params.id,
    ]);

    res.json({ donation: await serialize(updated.rows[0]) });
  }
);

// listed -> claimed: an NGO commits to a listing.
router.post("/:id/claim", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "Only NGOs can claim a listing." });

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "claimed",
      userId: req.userId,
      action: "donation_claimed",
      setColumns: { claimed_by: req.userId },
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

// claimed -> accepted: the giver confirms this NGO's claim (pickup details
// agreed). Only the giver who posted it can do this.
router.post("/:id/accept", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.donor_id !== req.userId) {
    return res.status(403).json({ error: "Only the giver who posted this can accept the claim." });
  }

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "accepted",
      userId: req.userId,
      action: "donation_accepted",
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

// accepted -> pickup: the claiming NGO marks the item as picked up.
router.post("/:id/pickup", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.claimed_by !== req.userId) {
    return res.status(403).json({ error: "Only the NGO that claimed this can mark it picked up." });
  }

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "pickup",
      userId: req.userId,
      action: "donation_picked_up",
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

// pickup -> delivered: the claiming NGO marks the handoff complete.
router.post("/:id/complete", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.claimed_by !== req.userId) {
    return res.status(403).json({ error: "Only the NGO that claimed this can mark it delivered." });
  }

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "delivered",
      userId: req.userId,
      action: "donation_delivered",
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

// delivered -> acknowledged: the giver confirms the delivery happened.
// Optional step — logging impact (routes/impact.js) can also move a
// donation straight from `delivered` to `impact_recorded` without this.
router.post("/:id/acknowledge", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });
  if (row.donor_id !== req.userId) {
    return res.status(403).json({ error: "Only the giver who posted this can acknowledge delivery." });
  }

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "acknowledged",
      userId: req.userId,
      action: "donation_acknowledged",
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

// impact_recorded -> documentation_complete: an admin signs off that every
// document this donation needs (receipt, delivery proof, CSR evidence...)
// is in and approved. There's no automatic "all required docs approved"
// check yet — see backend/routes/documents.js for the per-document review
// flow this depends on — so for now this is a deliberate admin action.
router.post(
  "/:id/documentation-complete",
  writeLimiter,
  requireIntParam(),
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const updated = await advanceDonation({
        donationId: req.params.id,
        toStatus: "documentation_complete",
        userId: req.userId,
        action: "donation_documentation_complete",
      });
      res.json({ donation: await serialize(updated) });
    } catch (err) {
      handleLifecycleError(err, res);
    }
  }
);

// documentation_complete -> closed: final stage. Either party to the
// donation, or an admin, can close it out.
router.post("/:id/close", writeLimiter, requireIntParam(), requireAuth, async (req, res) => {
  const existing = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: "That listing could not be found." });

  const isParty = req.userId === row.donor_id || req.userId === row.claimed_by;
  if (!isParty) {
    const allowed = new Set(
      (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    );
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [req.userId]);
    const email = userResult.rows[0]?.email?.toLowerCase();
    if (!email || !allowed.has(email)) {
      return res.status(403).json({ error: "Only the giver, the claiming NGO, or an admin can close this out." });
    }
  }

  try {
    const updated = await advanceDonation({
      donationId: req.params.id,
      toStatus: "closed",
      userId: req.userId,
      action: "donation_closed",
    });
    res.json({ donation: await serialize(updated) });
  } catch (err) {
    handleLifecycleError(err, res);
  }
});

export default router;
