import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
// Patches Express so a rejected promise in an async route handler is routed
// to the error-handling middleware below instead of crashing the process.
// Without this, a single failed DB query (or any unhandled rejection in a
// route) takes the entire API down for every user, not just that request.
import "express-async-errors";

import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import dashboardRoutes from "./routes/dashboard.js";
import ngoRoutes from "./routes/ngos.js";
import documentRoutes from "./routes/documents.js";
import impactRoutes from "./routes/impact.js";
import taxRoutes from "./routes/tax.js";
import csrRoutes from "./routes/csr.js";
import settingsRoutes from "./routes/settings.js";
import teamRoutes from "./routes/team.js";
import adminRoutes from "./routes/admin.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import siteSettingsRoutes from "./routes/siteSettings.js";
import contactRoutes from "./routes/contact.js";
import paymentProofRoutes from "./routes/paymentProof.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { UPLOAD_DIR } from "./lib/uploads.js";

const app = express();

// Render/Railway/Vercel etc. sit behind a reverse proxy. Without this,
// express-rate-limit (and req.ip generally) sees the proxy's IP for every
// request instead of the client's, which makes rate limiting useless in
// production. `1` trusts exactly one hop, which matches those platforms.
if (process.env.TRUST_PROXY !== "false") {
  app.set("trust proxy", 1);
}

// Uploaded files (QR codes, NGO verification documents) are served from
// this API's own domain but embedded/viewed on the frontend's domain —
// helmet's default Cross-Origin-Resource-Policy: same-origin blocks exactly
// that, so <img> tags pointing at /uploads/* fail with
// ERR_BLOCKED_BY_RESPONSE.NotSameOrigin even though the file loads fine.
// These files are intentionally public, so relax it to cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS is an allowlist, not a wildcard. ALLOWED_ORIGINS is a comma-separated
// list; FRONTEND_URL is always included so the deployed frontend keeps
// working with zero extra config. Requests with no Origin header (health
// checks, curl, server-to-server) are allowed through since there's no
// browser cookie/credential context to protect there.
const configuredOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...configuredOrigins,
  process.env.FRONTEND_URL || "http://localhost:5173",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Caps request bodies well above any real payload here (the largest is a
// donation description) so a client can't hand the server a multi-MB blob.
app.use(express.json({ limit: "100kb" }));

app.use("/api", generalLimiter);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "nirvah-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ngos", ngoRoutes);
// documents.js and impact.js each define their own /donations/:id/... and
// /ngos/... sub-paths, mounted at /api so those full paths line up.
app.use("/api", documentRoutes);
app.use("/api", impactRoutes);
// tax.js and csr.js each define one summary GET route apiece, mounted at
// /api for the same reason as documents/impact above.
app.use("/api", taxRoutes);
app.use("/api", csrRoutes);
app.use("/api/settings", settingsRoutes);
// team.js defines its own /ngos/me/team sub-paths, mounted at /api/ngos so
// they sit alongside ngos.js's /me route.
app.use("/api/ngos", teamRoutes);
app.use("/api/admin", adminRoutes);
// adminUsers.js (/users/...) and siteSettings.js (/settings) each define
// their own sub-paths, mounted at /api/admin so they sit alongside admin.js.
app.use("/api/admin", adminUsersRoutes);
app.use("/api/admin", siteSettingsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment-proof", paymentProofRoutes);

// Uploaded documents/photos. Local disk today (see lib/uploads.js); swap
// this for a signed-URL redirect to S3/Cloudinary later without touching
// any route that calls fileUrlFor().
app.use("/uploads", express.static(UPLOAD_DIR));

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Centralized error handler catches CORS rejections, malformed JSON bodies,
// oversized payloads, and anything an async handler throws, so the client
// always gets a JSON error instead of an HTML stack trace or a hung request.
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "This origin is not allowed to access the API." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large." });
  }
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Malformed JSON in request body." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

// Belt-and-suspenders: express-async-errors covers rejections inside route
// handlers, but a rejection from code outside the request cycle (a stray
// timer, a fire-and-forget promise) would still crash the process without
// this. Log it loudly instead of taking the whole API down.
process.on("unhandledRejection", (err) => {
  console.error("Unhandled promise rejection:", err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Nirvah backend running on port ${PORT}`));
