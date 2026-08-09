import React, { useEffect, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const EMPTY = { siteName: "", supportEmail: "", announcementBanner: "", maintenanceMode: false };

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, res] = await Promise.all([api.me(), api.getSiteSettings()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setForm({ ...EMPTY, ...(res?.settings || {}) });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load site settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onChange = (e) => {
    setSaved(false);
    const { name, type, checked, value } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await api.updateSiteSettings(form);
      if (res?.settings) setForm({ ...EMPTY, ...res.settings });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Couldn't save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell role="admin" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Site settings</h1>
          <p className="sub">Applies across Nirvah for everyone. Admin only.</p>
        </div>
      </div>

      {error && <div className="nv-panel" style={{ marginBottom: "1.2rem", color: "#B91C1C" }}>{error}</div>}
      {loading && !error && <div className="nv-panel">Loading…</div>}

      {!loading && (
        <div className="nv-panel nv-settings-section" style={{ maxWidth: 560 }}>
          <h2><SlidersHorizontal size={18} style={{ marginRight: 6 }} /> General</h2>
          <form onSubmit={onSubmit}>
            <div className="nv-field">
              <label htmlFor="siteName">Site name</label>
              <input id="siteName" name="siteName" value={form.siteName} onChange={onChange} required />
            </div>
            <div className="nv-field">
              <label htmlFor="supportEmail">Support email</label>
              <input
                id="supportEmail"
                name="supportEmail"
                type="email"
                value={form.supportEmail || ""}
                onChange={onChange}
                placeholder="help@nirvah.org"
              />
              <div className="hint">Shown to donors and NGOs who need help.</div>
            </div>
            <div className="nv-field">
              <label htmlFor="announcementBanner">Announcement banner</label>
              <textarea
                id="announcementBanner"
                name="announcementBanner"
                rows={3}
                value={form.announcementBanner || ""}
                onChange={onChange}
                placeholder="Optional, leave blank to hide it."
              />
            </div>
            <div className="nv-field" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <input
                id="maintenanceMode"
                name="maintenanceMode"
                type="checkbox"
                checked={!!form.maintenanceMode}
                onChange={onChange}
                style={{ width: "auto" }}
              />
              <label htmlFor="maintenanceMode" style={{ margin: 0 }}>Maintenance mode</label>
            </div>
            <div className="hint" style={{ marginTop: "-0.8rem", marginBottom: "1.1rem" }}>
              Blocks donor and NGO logins while it's on. Admin and manager accounts can still sign in.
            </div>

            <button type="submit" className="nv-btn spark" disabled={saving}>
              <Save size={17} /> {saving ? "Saving..." : "Save settings"}
            </button>
            {saved && <div className="nv-form-success">Saved.</div>}
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
