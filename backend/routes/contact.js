import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { contactMessageSchema } from "../lib/schemas.js";
import { sendEmail } from "../lib/email.js";

const router = Router();

// Where every contact-form submission gets routed. Overridable via env
// (comma-separated) without a code change; falls back to the founders'
// inboxes so this works out of the box.
const CONTACT_TO_EMAILS = (process.env.CONTACT_TO_EMAILS || "mithunsidhaartham@gmail.com,hello.nirvah@gmail.com")
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

// Public — anyone reaching the site can use this, so it's rate-limited like
// the other unauthenticated endpoints rather than the looser general limit.
router.post("/", authLimiter, validate(contactMessageSchema), async (req, res) => {
  const { name, email, reason, message } = req.body;

  const result = await sendEmail({
    to: CONTACT_TO_EMAILS,
    replyTo: email,
    subject: `[Nirvah contact] ${reason} — ${name}`,
    text: `New message from the Nirvah contact form.\n\nName: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`,
    html: `
      <div style="font-family: sans-serif; font-size: 14px; color: #111;">
        <p><strong>New message from the Nirvah contact form.</strong></p>
        <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
        <strong>Email:</strong> ${escapeHtml(email)}<br/>
        <strong>Reason:</strong> ${escapeHtml(reason)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  });

  // Don't fail the request just because Resend isn't configured yet (local
  // dev / not-yet-deployed) — the message is still printed to the console
  // via the dev stub, and the person filling in the form doesn't need to
  // know or care about that detail.
  if (!result.delivered && result.reason === "resend_error") {
    return res.status(502).json({ error: "Couldn't send your message right now. Please try again in a moment." });
  }

  res.status(201).json({ message: "Message sent." });
});

export default router;
