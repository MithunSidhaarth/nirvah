import React, { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

export default function AdminNgoVerification() {
  const [user, setUser] = useState(null);
  const [ngos, setNgos] = useState([]);
  const [docsByNgo, setDocsByNgo] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "admin" || user?.role === "manager";

  async function load() {
    try {
      const [me, res] = await Promise.all([api.me(), api.adminPendingNgos()]);
      setUser(me?.user || null);
      setNgos(res?.ngos || []);
    } catch (err) {
      setError(err.message || "Could not load the NGO verification queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function loadDocs(ngoId) {
    if (docsByNgo[ngoId]) return;
    try {
      const res = await api.adminNgoDocuments(ngoId);
      setDocsByNgo((prev) => ({ ...prev, [ngoId]: res?.documents || [] }));
    } catch {
      setDocsByNgo((prev) => ({ ...prev, [ngoId]: [] }));
    }
  }

  async function decide(ngoId, status) {
    setBusyId(ngoId);
    try {
      await api.verifyNgo(ngoId, { status });
      await load();
    } catch (err) {
      setError(err.message || "Could not record that decision.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell role={user?.role || "manager"} user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">NGO verification queue</h1>
          <p className="sub">
            An NGO stays unverified from signup until Nirvah checks its submitted documents.
            {!isStaff && " You can review what's been submitted here; only staff can approve or reject."}
          </p>
        </div>
      </div>

      {error && <div className="nv-panel" style={{ color: "#B91C1C" }}>{error}</div>}
      {loading && !error && <div className="nv-panel">Loading…</div>}

      {!loading && !error && ngos.length === 0 && (
        <div className="nv-panel">Nothing waiting on review right now.</div>
      )}

      {!loading && ngos.map((ngo) => (
        <div className="nv-panel" key={ngo.userId} style={{ marginBottom: "1rem" }}>
          <h2>{ngo.org || ngo.name} <span style={{ fontWeight: 400, fontSize: "0.8rem", opacity: 0.6 }}>({ngo.verificationStatus})</span></h2>
          <p className="sub" style={{ marginBottom: "0.6rem" }}>
            {ngo.email} · {ngo.city || "no city on file"}<br />
            Reg. no: {ngo.registrationNumber || "—"} · 12AB: {ngo.form12abNumber || "—"} · 80G: {ngo.form80gNumber || "—"}
          </p>

          <button
            type="button"
            className="nv-link-btn"
            onClick={() => loadDocs(ngo.userId)}
            style={{ marginBottom: "0.6rem" }}
          >
            View submitted documents
          </button>

          {docsByNgo[ngo.userId] && (
            <ul style={{ marginBottom: "0.8rem", fontSize: "0.85rem" }}>
              {docsByNgo[ngo.userId].length === 0 && <li style={{ opacity: 0.6 }}>No documents uploaded yet.</li>}
              {docsByNgo[ngo.userId].map((d) => (
                <li key={d.id}>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer">{d.fileName || d.type}</a>: {d.type} ({d.status})
                </li>
              ))}
            </ul>
          )}

          {isStaff ? (
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button className="nv-btn spark sm" disabled={busyId === ngo.userId} onClick={() => decide(ngo.userId, "verified")}>
                Mark verified
              </button>
              <button className="nv-btn ghost sm" disabled={busyId === ngo.userId} onClick={() => decide(ngo.userId, "rejected")}>
                Reject
              </button>
            </div>
          ) : (
            <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>Read-only. Ask an admin to approve or reject.</div>
          )}
        </div>
      ))}
    </DashboardShell>
  );
}
