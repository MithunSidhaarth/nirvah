import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageSearch, ShieldCheck, ArrowRight, Users, SlidersHorizontal } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const EMPTY_STATS = {
  donations: { total: 0, listed: 0, inProgress: 0, delivered: 0 },
  ngos: { total: 0, pendingVerification: 0, verified: 0 },
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, s] = await Promise.all([api.me(), api.adminStats()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setStats(s || EMPTY_STATS);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load the admin dashboard.");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <DashboardShell role={user?.role || "admin"} user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Nirvah operations{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
          <p className="sub">
            {user?.role === "manager"
              ? "You can view every donation, claim, and NGO in review, and verify or reject NGOs yourself."
              : "Full access: review NGOs, approve documents, manage users, and see everything moving through Nirvah."}
          </p>
        </div>
      </div>

      {error && <div className="nv-panel" style={{ marginBottom: "1.2rem", color: "#B91C1C" }}>{error}</div>}

      <div className="nv-ring-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.donations.total}</div>
          <div className="nv-ring-label">Total donations</div>
        </div>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.donations.listed}</div>
          <div className="nv-ring-label">Awaiting a claim</div>
        </div>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.donations.inProgress}</div>
          <div className="nv-ring-label">Claimed, in progress</div>
        </div>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.donations.delivered}</div>
          <div className="nv-ring-label">Delivered</div>
        </div>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.ngos.pendingVerification}</div>
          <div className="nv-ring-label">NGOs awaiting verification</div>
        </div>
        <div className="nv-panel">
          <div className="nv-ring-num">{stats.ngos.verified}</div>
          <div className="nv-ring-label">Verified NGOs</div>
        </div>
      </div>

      <div className="nv-dash-grid">
        <Link to="/dashboard/admin/donations" className="nv-panel" style={{ textDecoration: "none", color: "inherit" }}>
          <h2><PackageSearch size={18} /> Donations & claims <ArrowRight size={16} style={{ marginLeft: "auto" }} /></h2>
          <p className="sub">Every listing on Nirvah, who gave it, and which NGO claimed it.</p>
        </Link>
        <Link to="/dashboard/admin/ngos" className="nv-panel" style={{ textDecoration: "none", color: "inherit" }}>
          <h2><ShieldCheck size={18} /> NGO verification <ArrowRight size={16} style={{ marginLeft: "auto" }} /></h2>
          <p className="sub">NGOs that signed up as unclaimed/unverified and submitted documents for review.</p>
        </Link>
        {user?.role === "admin" && (
          <>
            <Link to="/dashboard/admin/users" className="nv-panel" style={{ textDecoration: "none", color: "inherit" }}>
              <h2><Users size={18} /> Users <ArrowRight size={16} style={{ marginLeft: "auto" }} /></h2>
              <p className="sub">Promote a donor to manager, or ban/remove an account.</p>
            </Link>
            <Link to="/dashboard/admin/settings" className="nv-panel" style={{ textDecoration: "none", color: "inherit" }}>
              <h2><SlidersHorizontal size={18} /> Site settings <ArrowRight size={16} style={{ marginLeft: "auto" }} /></h2>
              <p className="sub">Site name, support email, announcement banner, and maintenance mode.</p>
            </Link>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
