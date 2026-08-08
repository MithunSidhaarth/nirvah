import { Router } from "express";
import pool from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin, requireStaff } from "../middleware/admin.js";
import { writeLimiter } from "../middleware/rateLimit.js";
import { siteSettingsSchema } from "../lib/schemas.js";

const router = Router();

// Small fixed key set rather than an open key-value store — every setting
// Nirvah actually reads lives in this map. Add a new one by adding it here
// and to siteSettingsSchema in lib/schemas.js, not by accepting arbitrary
// keys from the client.
const KEYS = {
  siteName: "site_name",
  supportEmail: "support_email",
  announcementBanner: "announcement_banner",
  maintenanceMode: "maintenance_mode",
};

const DEFAULTS = {
  siteName: "Nirvah",
  supportEmail: "",
  announcementBanner: "",
  maintenanceMode: false,
};

async function loadSettings() {
  const result = await pool.query("SELECT key, value FROM site_settings");
  const row = Object.fromEntries(result.rows.map((r) => [r.key, r.value]));
  return {
    siteName: row[KEYS.siteName] ?? DEFAULTS.siteName,
    supportEmail: row[KEYS.supportEmail] ?? DEFAULTS.supportEmail,
    announcementBanner: row[KEYS.announcementBanner] ?? DEFAULTS.announcementBanner,
    maintenanceMode: row[KEYS.maintenanceMode] === "true",
  };
}

// Managers can see current settings — useful context when fielding a
// support question — but only an admin can change them.
router.get("/settings", requireAuth, requireStaff, async (req, res) => {
  res.json({ settings: await loadSettings() });
});

router.patch("/settings", writeLimiter, requireAuth, requireAdmin, async (req, res) => {
  const parsed = siteSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid request." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [field, key] of Object.entries(KEYS)) {
      if (!(field in parsed.data)) continue;
      const value = String(parsed.data[field] ?? "");
      await client.query(
        `INSERT INTO site_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = now()`,
        [key, value, req.userId]
      );
    }
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'site_settings_updated', 'site_settings', NULL, $2)`,
      [req.userId, JSON.stringify(parsed.data)]
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Updating site settings failed:", err.message);
    return res.status(500).json({ error: "Couldn't save settings. Please try again." });
  } finally {
    client.release();
  }

  res.json({ settings: await loadSettings() });
});

export default router;
