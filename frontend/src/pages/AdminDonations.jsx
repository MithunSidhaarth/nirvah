import React, { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

export default function AdminDonations() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, res] = await Promise.all([api.me(), api.adminDonations()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setDonations(res?.donations || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load donations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardShell role={user?.role || "admin"} user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Donations & claims</h1>
          <p className="sub">Every listing on Nirvah, view only. {donations.length} shown.</p>
        </div>
      </div>

      {error && <div className="nv-panel" style={{ color: "#B91C1C" }}>{error}</div>}
      {loading && !error && <div className="nv-panel">Loading…</div>}

      {!loading && !error && (
        <div className="nv-panel" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line, #e5e5e5)" }}>
                <th style={{ padding: "0.6rem" }}>Listing</th>
                <th style={{ padding: "0.6rem" }}>Category</th>
                <th style={{ padding: "0.6rem" }}>Given by</th>
                <th style={{ padding: "0.6rem" }}>Claimed by</th>
                <th style={{ padding: "0.6rem" }}>Status</th>
                <th style={{ padding: "0.6rem" }}>Listed</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} style={{ borderBottom: "1px solid var(--line, #f0f0f0)" }}>
                  <td style={{ padding: "0.6rem" }}>{d.title}</td>
                  <td style={{ padding: "0.6rem" }}>{d.category}</td>
                  <td style={{ padding: "0.6rem" }}>{d.donor?.org || d.donor?.name}<br /><span style={{ opacity: 0.6 }}>{d.donor?.email}</span></td>
                  <td style={{ padding: "0.6rem" }}>{d.claimedBy ? (d.claimedBy.org || d.claimedBy.name) : "—"}</td>
                  <td style={{ padding: "0.6rem" }}>{d.status}</td>
                  <td style={{ padding: "0.6rem" }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {donations.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "1rem", textAlign: "center", opacity: 0.6 }}>No donations yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
