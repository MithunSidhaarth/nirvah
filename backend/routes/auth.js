import { Router } from "express";
import bcrypt from "bcryptjs";
import pool from "../db/index.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import {
  signupSchema,
  loginSchema,
  emailOnlySchema,
  verifyEmailSchema,
  resetPasswordSchema,
} from "../lib/schemas.js";
import { generateToken, hashToken, TOKEN_TTL_MS } from "../lib/tokens.js";
import { sendEmail } from "../lib/email.js";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

async function issueToken(client, userId, type) {
  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[type]);
  await client.query(
    `INSERT INTO auth_tokens (user_id, type, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    [userId, type, hash, expiresAt]
  );
  return raw;
}

async function sendVerificationEmail(client, user) {
  const raw = await issueToken(client, user.id, "email_verify");
  const link = `${FRONTEND_URL}/verify-email?token=${raw}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your Nirvah account",
    text: `Hi ${user.name},\n\nVerify your email to finish setting up your Nirvah account:\n${link}\n\nThis link expires in 24 hours.`,
  });
}

router.post("/signup", authLimiter, validate(signupSchema), async (req, res) => {
  const { role, name, org, email, password, city } = req.body;

  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inserted = await client.query(
      `INSERT INTO users (role, name, org, email, password_hash, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [role, name, org || null, email, passwordHash, city]
    );
    const user = inserted.rows[0];

    if (role === "ngo") {
      await client.query("INSERT INTO ngos (user_id) VALUES ($1)", [user.id]);
    }

    await sendVerificationEmail(client, user);

    await client.query("COMMIT");

    // No token/session issued at signup: the account can't log in until
    // the email is verified, so there's nothing useful to authenticate yet.
    res.status(201).json({
      user: publicUser(user),
      message: "Check your email to verify your account before logging in.",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Signup failed:", err.message);
    res.status(500).json({ error: "Something went wrong creating your account. Please try again." });
  } finally {
    client.release();
  }
});

router.post("/verify-email", authLimiter, validate(verifyEmailSchema), async (req, res) => {
  const { token } = req.body;

  const hash = hashToken(token);
  const result = await pool.query(
    `SELECT * FROM auth_tokens WHERE token_hash = $1 AND type = 'email_verify'`,
    [hash]
  );
  const tokenRow = result.rows[0];

  if (!tokenRow || tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
    return res.status(400).json({ error: "This verification link is invalid or has expired." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE users SET email_verified = TRUE WHERE id = $1", [tokenRow.user_id]);
    await client.query("UPDATE auth_tokens SET used_at = now() WHERE id = $1", [tokenRow.id]);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Email verification failed:", err.message);
    return res.status(500).json({ error: "Something went wrong verifying your email. Please try again." });
  } finally {
    client.release();
  }

  res.json({ message: "Email verified. You can now log in." });
});

router.post("/resend-verification", authLimiter, validate(emailOnlySchema), async (req, res) => {
  const { email } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  // Same response whether or not the account exists / is already verified,
  // so this endpoint can't be used to check who has signed up.
  const genericResponse = { message: "If that account needs verifying, we've sent a new link." };

  if (!user || user.email_verified) return res.json(genericResponse);

  const client = await pool.connect();
  try {
    await sendVerificationEmail(client, user);
  } finally {
    client.release();
  }

  res.json(genericResponse);
});

router.post("/forgot-password", authLimiter, validate(emailOnlySchema), async (req, res) => {
  const { email } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  const genericResponse = { message: "If that email has an account, we've sent a reset link." };
  if (!user) return res.json(genericResponse);

  const client = await pool.connect();
  try {
    const raw = await issueToken(client, user.id, "password_reset");
    const link = `${FRONTEND_URL}/reset-password?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Nirvah password",
      text: `Hi ${user.name},\n\nReset your password here:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    });
  } finally {
    client.release();
  }

  res.json(genericResponse);
});

router.post("/reset-password", authLimiter, validate(resetPasswordSchema), async (req, res) => {
  const { token, password } = req.body;

  const hash = hashToken(token);
  const result = await pool.query(
    `SELECT * FROM auth_tokens WHERE token_hash = $1 AND type = 'password_reset'`,
    [hash]
  );
  const tokenRow = result.rows[0];

  if (!tokenRow || tokenRow.used_at || new Date(tokenRow.expires_at) < new Date()) {
    return res.status(400).json({ error: "This reset link is invalid or has expired." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, tokenRow.user_id]);
    await client.query("UPDATE auth_tokens SET used_at = now() WHERE id = $1", [tokenRow.id]);
    // Any other outstanding reset tokens for this user are now stale —
    // invalidate them so an old, unused link can't also be used.
    await client.query(
      `UPDATE auth_tokens SET used_at = now()
       WHERE user_id = $1 AND type = 'password_reset' AND used_at IS NULL`,
      [tokenRow.user_id]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Password reset failed:", err.message);
    return res.status(500).json({ error: "Something went wrong resetting your password. Please try again." });
  } finally {
    client.release();
  }

  res.json({ message: "Password updated. You can now log in." });
});

router.post("/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  // Same generic message whether the email doesn't exist or the password
  // is wrong — every other auth endpoint here (forgot-password,
  // resend-verification) already avoids confirming which emails have
  // accounts; login was the one place still giving that away.
  const invalidCreds = () => res.status(401).json({ error: "That email or password is incorrect." });

  if (!user) return invalidCreds();

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return invalidCreds();

  if (!user.email_verified) {
    return res.status(403).json({
      error: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  if (user.banned_at) {
    return res.status(403).json({ error: "This account has been suspended." });
  }
  if (user.deleted_at) {
    return res.status(401).json({ error: "We could not find an account with that email." });
  }

  // Staff can still log in during maintenance mode (see routes/siteSettings.js)
  // so an admin can turn it back off; donors and NGOs are held out.
  if (user.role !== "admin" && user.role !== "manager") {
    const maint = await pool.query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
    if (maint.rows[0]?.value === "true") {
      return res.status(503).json({ error: "Nirvah is temporarily down for maintenance. Please check back soon." });
    }
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// JWTs are stateless, so there's no server-side session to destroy — this
// exists for API symmetry and so the frontend has a single place to call
// before it clears the token client-side.
router.post("/logout", requireAuth, (req, res) => {
  res.json({ message: "Logged out." });
});

router.get("/me", requireAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

export default router;
