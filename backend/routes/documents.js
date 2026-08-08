import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireStaff } from "../middleware/admin.js";
import { requireIntParam } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { upload, fileUrlFor, handleUploadErrors } from "../lib/uploads.js";
import { ngoDocumentTypeSchema, donationDocumentTypeSchema, documentReviewSchema } from "../lib/schemas.js";

const router = Router();

function serializeDocument(row) {
  return {
    id: row.id,
    donationId: row.donation_id,
    ngoId: row.ngo_id,
    uploadedBy: row.uploaded_by,
    type: row.type,
    fileUrl: row.file_url,
    fileName: row.file_name,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function validateType(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ type: req.body?.type });
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || "Invalid document type." });
    }
    req.body.type = result.data.type;
    next();
  };
}

// ---- NGO verification documents (registration cert, 12AB, 80G proof) ----

router.post(
  "/ngos/me/documents",
  writeLimiter,
  requireAuth,
  upload.single("file"),
  handleUploadErrors,
  validateType(ngoDocumentTypeSchema),
  async (req, res) => {
    if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });
    if (!req.file) return res.status(400).json({ error: "Please attach a file." });

    const ngoResult = await pool.query("SELECT id FROM ngos WHERE user_id = $1", [req.userId]);
    const ngo = ngoResult.rows[0];
    if (!ngo) return res.status(404).json({ error: "NGO profile not found." });

    const inserted = await pool.query(
      `INSERT INTO documents (ngo_id, uploaded_by, type, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ngo.id, req.userId, req.body.type, fileUrlFor(req.file.filename), req.file.originalname]
    );

    res.status(201).json({ document: serializeDocument(inserted.rows[0]) });
  }
);

router.get("/ngos/me/documents", requireAuth, async (req, res) => {
  if (req.userRole !== "ngo") return res.status(403).json({ error: "This is for NGO accounts only." });

  const ngoResult = await pool.query("SELECT id FROM ngos WHERE user_id = $1", [req.userId]);
  const ngo = ngoResult.rows[0];
  if (!ngo) return res.status(404).json({ error: "NGO profile not found." });

  const result = await pool.query(
    "SELECT * FROM documents WHERE ngo_id = $1 ORDER BY created_at DESC",
    [ngo.id]
  );
  res.json({ documents: result.rows.map(serializeDocument) });
});

router.get(
  "/ngos/:id/documents",
  requireAuth,
  requireStaff,
  requireIntParam(),
  async (req, res) => {
    const ngoResult = await pool.query("SELECT id FROM ngos WHERE user_id = $1", [req.params.id]);
    const ngo = ngoResult.rows[0];
    if (!ngo) return res.status(404).json({ error: "NGO not found." });

    const result = await pool.query(
      "SELECT * FROM documents WHERE ngo_id = $1 ORDER BY created_at DESC",
      [ngo.id]
    );
    res.json({ documents: result.rows.map(serializeDocument) });
  }
);

// ---- documents scoped to a specific donation (receipts, acknowledgements, proofs) ----

router.post(
  "/donations/:id/documents",
  writeLimiter,
  requireIntParam(),
  requireAuth,
  upload.single("file"),
  handleUploadErrors,
  validateType(donationDocumentTypeSchema),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Please attach a file." });

    const donationResult = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
    const donation = donationResult.rows[0];
    if (!donation) return res.status(404).json({ error: "That listing could not be found." });

    const isParty = req.userId === donation.donor_id || req.userId === donation.claimed_by;
    if (!isParty) {
      return res.status(403).json({ error: "Only the giver or the claiming NGO can attach documents here." });
    }

    const inserted = await pool.query(
      `INSERT INTO documents (donation_id, uploaded_by, type, file_url, file_name)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [donation.id, req.userId, req.body.type, fileUrlFor(req.file.filename), req.file.originalname]
    );

    res.status(201).json({ document: serializeDocument(inserted.rows[0]) });
  }
);

router.get("/donations/:id/documents", requireIntParam(), requireAuth, async (req, res) => {
  const donationResult = await pool.query("SELECT * FROM donations WHERE id = $1", [req.params.id]);
  const donation = donationResult.rows[0];
  if (!donation) return res.status(404).json({ error: "That listing could not be found." });

  const isParty = req.userId === donation.donor_id || req.userId === donation.claimed_by;
  if (!isParty) {
    return res.status(403).json({ error: "Only the giver or the claiming NGO can view these documents." });
  }

  const result = await pool.query(
    "SELECT * FROM documents WHERE donation_id = $1 ORDER BY created_at DESC",
    [req.params.id]
  );
  res.json({ documents: result.rows.map(serializeDocument) });
});

// ---- admin review of any document (approve/reject with notes) ----

router.patch(
  "/documents/:id",
  requireAuth,
  requireAdmin,
  requireIntParam(),
  async (req, res) => {
    const result = documentReviewSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0]?.message || "Invalid request." });
    }
    const { status, notes } = result.data;

    const existing = await pool.query("SELECT * FROM documents WHERE id = $1", [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: "Document not found." });

    const updated = await pool.query(
      `UPDATE documents SET status = $1, notes = COALESCE($2, notes) WHERE id = $3 RETURNING *`,
      [status, notes ?? null, req.params.id]
    );

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'document_review_decision', 'document', $2, $3)`,
      [req.userId, req.params.id, JSON.stringify({ status, notes: notes || null })]
    );

    res.json({ document: serializeDocument(updated.rows[0]) });
  }
);

export default router;
