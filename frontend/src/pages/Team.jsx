import React, { useEffect, useState } from "react";
import { Users2, UserPlus, Trash2 } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const MOCK_TEAM = [
  { id: 1, name: "Anita Rao", email: "anita@ashafoundation.org", role: "admin" },
  { id: 2, name: "Vikram Nair", email: "vikram@ashafoundation.org", role: "member" },
];

function initialsFor(name) {
  return (name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export default function Team() {
  const [team, setTeam] = useState(MOCK_TEAM);
  const [demoMode, setDemoMode] = useState(true);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", role: "member" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, roster] = await Promise.all([api.me(), api.listTeam()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setTeam(roster?.team || []);
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.addTeamMember(form);
      if (res?.member) setTeam((t) => [...t, res.member]);
      setForm({ name: "", email: "", role: "member" });
    } catch (err) {
      if (demoMode) {
        setTeam((t) => [...t, { id: Date.now(), ...form }]);
        setForm({ name: "", email: "", role: "member" });
      } else {
        setError(err?.message || "Couldn't add them. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (id) => {
    setRemovingId(id);
    try {
      await api.removeTeamMember(id);
    } catch {
      // demo mode / already gone — remove locally regardless
    } finally {
      setTeam((t) => t.filter((m) => m.id !== id));
      setRemovingId(null);
    }
  };

  return (
    <DashboardShell role="ngo" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Our team</h1>
          <p className="sub">Add volunteers so claims move faster during busy hours.</p>
        </div>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", fontSize: "0.86rem", color: "var(--ink-soft)", background: "rgba(13,148,136,0.08)", borderColor: "rgba(13,148,136,0.3)" }}>
          <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Connect the backend to manage your real roster.
        </div>
      )}

      <div className="nv-dash-grid">
        <div className="nv-panel">
          <h2>Team members</h2>
          {team.length === 0 ? (
            <div className="nv-empty">
              <div className="ic"><Users2 size={22} /></div>
              <h3>Nobody added yet</h3>
              <p>Add your first teammate using the form.</p>
            </div>
          ) : (
            team.map((m) => (
              <div className="nv-team-row" key={m.id}>
                <div className="nv-team-avatar">{initialsFor(m.name)}</div>
                <div className="nv-team-body">
                  <div className="nv-team-name">{m.name}</div>
                  <div className="nv-team-email">{m.email}</div>
                </div>
                <span className={`nv-team-role ${m.role === "admin" ? "admin" : ""}`}>{m.role}</span>
                <button className="nv-team-remove" disabled={removingId === m.id} onClick={() => onRemove(m.id)} title="Remove from team">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="nv-panel">
          <h2>Add a teammate</h2>
          <form onSubmit={onSubmit}>
            {error && <div className="nv-detail-error">{error}</div>}
            <div className="nv-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" value={form.name} onChange={onChange} placeholder="Their full name" required />
            </div>
            <div className="nv-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="them@yourorg.org" required />
            </div>
            <div className="nv-field">
              <label htmlFor="role">Role</label>
              <select id="role" name="role" value={form.role} onChange={onChange}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="nv-btn sage" disabled={submitting}>
              <UserPlus size={17} /> {submitting ? "Adding..." : "Add to team"}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
