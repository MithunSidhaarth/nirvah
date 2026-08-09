import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { paymentProofSchema } from "../lib/schemas.js";
import { sendEmail } from "../lib/email.js";
import { upload, fileUrlFor, handleUploadErrors } from "../lib/uploads.js";

const router = Router();

// Same destination as the general contact form (routes/contact.js) —
// overridable via env, falls back to the founders' inboxes.
const PROOF_TO_EMAILS = (process.env.CONTACT_TO_EMAILS || "mithunsidhaartham@gmail.com,hello.nirvah@gmail.com")
  .split(",")
  .map((addr) => addr.trim())
  .filter(Boolean);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Public, unauthenticated — anyone who just paid an NGO directly (see
// DonateMoney.jsx) lands here to hand over their proof of payment. We don't
// try to reconcile this against a ledger; a human on the team checks with
// the NGO and emails back a real invoice. This route's only job is to get
// the screenshot + donor email into that person's inbox reliably, so it's
// rate-limited like the other public write endpoints (contact, auth).
router.post(
  "/",
  authLimiter,
  upload.single("screenshot"),
  handleUploadErrors,
  validate(paymentProofSchema),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Please attach a screenshot or photo of your payment." });
    }

    const { donorEmail, ngoName, note } = req.body;
    const proofUrl = fileUrlFor(req.file.filename);

    const result = await sendEmail({
      to: PROOF_TO_EMAILS,
      replyTo: donorEmail,
      subject: `[Nirvah] Payment proof from ${donorEmail}`,
      text: `A donor submitted proof of a direct money donation.\n\nDonor email: ${donorEmail}\nNGO paid: ${ngoName || "Not specified"}\nNote: ${note || "-"}\nProof: ${proofUrl}\n\nVerify with the NGO, then email the donor their invoice.`,
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #111;">
          <p><strong>A donor submitted proof of a direct money donation.</strong></p>
          <p><strong>Donor email:</strong> ${escapeHtml(donorEmail)}<br/>
          <strong>NGO paid:</strong> ${escapeHtml(ngoName || "Not specified")}</p>
          ${note ? `<p><strong>Note:</strong><br/>${escapeHtml(note)}</p>` : ""}
          <p><a href="${proofUrl}">View the payment proof</a></p>
          <p>Verify with the NGO, then email the donor their invoice.</p>
        </div>
      `,
    });

    if (!result.delivered && result.reason === "resend_error") {
      return res.status(502).json({ error: "Couldn't submit your proof right now. Please try again in a moment." });
    }

    res.status(201).json({ message: "Thanks — we'll verify this with the NGO and email your invoice soon." });
  }
);

export default router;
