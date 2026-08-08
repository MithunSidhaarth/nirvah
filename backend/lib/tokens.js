import crypto from "crypto";

// Verification links are less sensitive and give people time to get to
// their inbox; reset links are short-lived since a leaked one is more
// dangerous (account takeover, not just "unverified").
export const TOKEN_TTL_MS = {
  email_verify: 24 * 60 * 60 * 1000, // 24h
  password_reset: 60 * 60 * 1000, // 1h
};

/**
 * Returns { raw, hash }. `raw` is what goes in the emailed link/param —
 * never store this. `hash` is what goes in the database — never email this.
 */
export function generateToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}
