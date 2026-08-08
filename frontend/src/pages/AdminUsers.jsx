import React, { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, UserMinus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const ROLE_LABEL = { donor: "Donor", ngo: "NGO", manager: "Manager", admin: "Admin" };

function initialsFor(name) {
  return (name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminUsers() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("all");

  async function load() {
    try {
      const [me, res] = await Promise.all([api.me(), api.adminListUsers()]);
      setUser(me?.user || null);
      setUsers(res?.users || []);
    } catch (err) {
      setError(err.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function withBusy(id, fn) {
    setBusyId(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message || "That action couldn't be completed.");
    } finally {
      setBusyId(null);
    }
  }

  const setRole = (u, role) => withBusy(u.id, () => api.adminSetUserRole(u.id, role));
  const ban = (u) => withBusy(u.id, () => api.adminBanUser(u.id));
  const unban = (u) => withBusy(u.id, () => api.adminUnbanUser(u.id));
  const remove = (u) => {
    if (!window.confirm(`Remove ${u.name || u.email}? They won't be able to log in again.`)) return;
    return withBusy(u.id, () => api.adminRemoveUser(u.id));
  };

  const visible = users.filter((u) => (filter === "all" ? true : u.role === filter));

  return (
    <DashboardShell role="admin" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Users</h1>
          <p className="sub">Make someone a manager, or ban/remove an account. Admin only.</p>
        </div>
      </div>

      {error && <div className="nv-panel" style={{ marginBottom: "1.2rem", color: "#B91C1C" }}>{error}</div>}

      <div className="nv-filter-bar">
        <div className="nv-filter-tabs">
          {["all", "donor", "ngo", "manager", "admin"].map((r) => (
            <button
              key={r}
              type="button"
              className={`nv-filter-tab ${filter === r ? "active" : ""}`}
              onClick={() => setFilter(r)}
            >
              {r === "all" ? "All" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {loading && !error && <div className="nv-panel">Loading…</div>}

      {!loading && (
        <div className="nv-panel">
          {visible.length === 0 && <div className="nv-empty"><p>No users in this view.</p></div>}

          {visible.map((u) => {
            const isSelf = u.id === user?.id;
            const busy = busyId === u.id;
            return (
              <div className="nv-team-row" key={u.id}>
                <div className="nv-team-avatar">{initialsFor(u.name || u.org)}</div>
                <div className="nv-team-body">
                  <div className="nv-team-name">
                    {u.name || u.org || "—"} {isSelf && <span style={{ opacity: 0.5, fontWeight: 400 }}>(you)</span>}
                  </div>
                  <div className="nv-team-email">
                    {u.email} · {u.city || "no city on file"}
                    {u.bannedAt && <span style={{ color: "#B91C1C", fontWeight: 600 }}> · banned</span>}
                  </div>
                </div>
                <span className={`nv-team-role ${u.role === "admin" || u.role === "manager" ? "admin" : ""}`}>
                  {ROLE_LABEL[u.role]}
                </span>

                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                  {u.role === "donor" && (
                    <button
                      type="button"
                      className="nv-btn ghost-light sm"
                      disabled={busy}
                      onClick={() => setRole(u, "manager")}
                      title="Make manager"
                    >
                      <ArrowUpCircle size={15} /> Make manager
                    </button>
                  )}
                  {u.role === "manager" && (
                    <button
                      type="button"
                      className="nv-btn ghost-light sm"
                      disabled={busy}
                      onClick={() => setRole(u, "donor")}
                      title="Demote to donor"
                    >
                      <ArrowDownCircle size={15} /> Demote
                    </button>
                  )}

                  {u.role !== "admin" && (
                    <>
                      {u.bannedAt ? (
                        <button
                          type="button"
                          className="nv-btn ghost-light sm"
                          disabled={busy}
                          onClick={() => unban(u)}
                          title="Unban"
                        >
                          <ShieldCheck size={15} /> Unban
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="nv-btn ghost-light sm"
                          disabled={busy || isSelf}
                          onClick={() => ban(u)}
                          title="Ban"
                          style={{ color: "#B91C1C" }}
                        >
                          <ShieldOff size={15} /> Ban
                        </button>
                      )}
                      <button
                        type="button"
                        className="nv-team-remove"
                        disabled={busy || isSelf}
                        onClick={() => remove(u)}
                        title="Remove user"
                      >
                        <UserMinus size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
