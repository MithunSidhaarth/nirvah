import React, { useEffect, useState } from "react";
import { Save, KeyRound, User as UserIcon } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(true);

  const [profileForm, setProfileForm] = useState({ name: "", org: "", city: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        const u = me?.user || null;
        setUser(u);
        setProfileForm({ name: u?.name || "", org: u?.org || "", city: u?.city || "" });
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onProfileChange = (e) => {
    setProfileSaved(false);
    setProfileForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const res = await api.updateProfile(profileForm);
      if (res?.user) setUser(res.user);
      setProfileSaved(true);
    } catch (err) {
      if (demoMode) {
        setUser((u) => ({ ...u, ...profileForm }));
        setProfileSaved(true);
      } else {
        setProfileError(err?.message || "Couldn't save your details. Please try again.");
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordChange = (e) => {
    setPasswordSaved(false);
    setPasswordForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSaved(false);
    try {
      await api.changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err?.message || "Couldn't update your password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DashboardShell role={user?.role === "ngo" ? "ngo" : "donor"} user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Settings</h1>
          <p className="sub">Manage your account, notifications and organisation details.</p>
        </div>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", fontSize: "0.86rem", color: "var(--ink-soft)", background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.3)" }}>
          <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Connect the backend to manage your real account.
        </div>
      )}

      <div className="nv-dash-grid">
        <div className="nv-panel nv-settings-section">
          <h2><UserIcon size={18} style={{ marginRight: 6 }} /> Profile</h2>
          <p className="sub">This is what givers and NGOs see about you across Nirvah.</p>
          <form onSubmit={onProfileSubmit}>
            {profileError && <div className="nv-detail-error">{profileError}</div>}
            <div className="nv-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={profileForm.name} onChange={onProfileChange} required />
            </div>
            {user?.role === "ngo" && (
              <div className="nv-field">
                <label htmlFor="org">Organisation</label>
                <input id="org" name="org" value={profileForm.org} onChange={onProfileChange} />
              </div>
            )}
            <div className="nv-field">
              <label htmlFor="city">City</label>
              <input id="city" name="city" value={profileForm.city} onChange={onProfileChange} required />
            </div>
            <div className="nv-field">
              <label>Email</label>
              <input value={user?.email || ""} disabled style={{ opacity: 0.6 }} />
              <div className="hint">Email can't be changed here.</div>
            </div>
            <button type="submit" className="nv-btn spark" disabled={profileSaving}>
              <Save size={17} /> {profileSaving ? "Saving..." : "Save changes"}
            </button>
            {profileSaved && <div className="nv-form-success">Saved.</div>}
          </form>
        </div>

        <div className="nv-panel nv-settings-section">
          <h2><KeyRound size={18} style={{ marginRight: 6 }} /> Password</h2>
          <p className="sub">Choose something you don't use anywhere else.</p>
          <form onSubmit={onPasswordSubmit}>
            {passwordError && <div className="nv-detail-error">{passwordError}</div>}
            <div className="nv-field">
              <label htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={onPasswordChange} required />
            </div>
            <div className="nv-field">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" name="newPassword" type="password" value={passwordForm.newPassword} onChange={onPasswordChange} required minLength={8} />
              <div className="hint">At least 8 characters.</div>
            </div>
            <button type="submit" className="nv-btn ghost-light" disabled={passwordSaving}>
              {passwordSaving ? "Updating..." : "Update password"}
            </button>
            {passwordSaved && <div className="nv-form-success">Password updated.</div>}
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
