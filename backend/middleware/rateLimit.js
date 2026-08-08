import rateLimit from "express-rate-limit";

const jsonHandler = (req, res) => {
  res.status(429).json({ error: "Too many requests. Please try again later." });
};

// Baseline for every /api route: generous enough for normal browsing/polling,
// tight enough to blunt scraping and accidental client loops.
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Signup / login / password-reset / verification-resend are the endpoints an
// attacker actually wants: credential stuffing, account enumeration, or
// spamming a stranger's inbox with reset links. Much tighter budget.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

// Creating/claiming/completing listings is authenticated, but still worth
// capping so one compromised or buggy client can't flood the feed.
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
