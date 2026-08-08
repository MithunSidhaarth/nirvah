import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  UtensilsCrossed,
  Shirt,
  BookOpen,
  MapPin,
  Info,
  Users2,
  BarChart3,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import StatRing from "../components/StatRing";
import { api } from "../lib/api";

const MOCK_STATS = { claimedThisMonth: 21, itemsReceived: 640, activeDonors: 34, avgPickupMinutes: 26 };
const MOCK_NEARBY = [
  { id: 1, title: "Vegetable biryani, 40 portions", category: "food", place: "HSR Layout, 1.2 km away", status: "listed" },
  { id: 2, title: "Winter jackets and sweaters", category: "clothing", place: "Indiranagar, 3.8 km away", status: "listed" },
  { id: 3, title: "Notebooks and geometry sets", category: "supplies", place: "Whitefield, 6.1 km away", status: "claimed" },
];

const ICONS = { food: UtensilsCrossed, clothing: Shirt, supplies: BookOpen };

export default function NgoDashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [nearby, setNearby] = useState(MOCK_NEARBY);
  const [demoMode, setDemoMode] = useState(true);
  const [user, setUser] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, dash] = await Promise.all([api.me(), api.ngoStats()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setStats(dash?.stats || MOCK_STATS);
        setNearby(dash?.nearby || MOCK_NEARBY);
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onClaim = async (id) => {
    setClaimingId(id);
    try {
      await api.claimDonation(id);
      setNearby((list) => list.map((d) => (d.id === id ? { ...d, status: "claimed" } : d)));
    } catch {
      // In demo mode there is no backend yet, so just reflect the claim locally.
      setNearby((list) => list.map((d) => (d.id === id ? { ...d, status: "claimed" } : d)));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <DashboardShell role="ngo" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Your work gives things a second life.</h1>
          <p className="sub">Here is what is waiting nearby, and what your organisation has already put to use.</p>
        </div>
        <Link to="/browse" className="nv-btn sage">
          <Compass size={17} /> Browse the network
        </Link>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", display: "flex", gap: "0.8rem", alignItems: "flex-start", background: "rgba(13,148,136,0.08)", borderColor: "rgba(13,148,136,0.3)" }}>
          <Info size={18} color="var(--sage-deep)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
            <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Point <code>VITE_API_BASE_URL</code> at your backend in the frontend .env file to replace this with live listings.
          </div>
        </div>
      )}

      <div className="nv-ring-grid">
        <div className="nv-ring-card">
          <StatRing value={(stats.claimedThisMonth / 40) * 100} color="#0D9488" />
          <div>
            <div className="nv-ring-num">{stats.claimedThisMonth}</div>
            <div className="nv-ring-label">Claimed this month</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={(stats.itemsReceived / 800) * 100} color="#34D399" />
          <div>
            <div className="nv-ring-num">{stats.itemsReceived}</div>
            <div className="nv-ring-label">Items received in total</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={(stats.activeDonors / 50) * 100} color="#10B981" />
          <div>
            <div className="nv-ring-num">{stats.activeDonors}</div>
            <div className="nv-ring-label">Active donors nearby</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={100 - stats.avgPickupMinutes} color="#115E59" />
          <div>
            <div className="nv-ring-num">{stats.avgPickupMinutes}m</div>
            <div className="nv-ring-label">Average pickup time</div>
          </div>
        </div>
      </div>

      <div className="nv-dash-grid">
        <div className="nv-panel">
          <h2>
            Nearby right now
            <Link to="/browse" className="see-all">See all</Link>
          </h2>
          {nearby.length === 0 ? (
            <div className="nv-empty">
              <div className="ic"><Compass size={22} /></div>
              <h3>Nothing nearby yet</h3>
              <p>New listings from your area will show up here the moment they go live.</p>
            </div>
          ) : (
            nearby.map((d) => {
              const Icon = ICONS[d.category] || Compass;
              return (
                <div className="nv-row" key={d.id}>
                  <div className="nv-row-icon sage"><Icon size={19} /></div>
                  <div className="nv-row-body">
                    <div className="nv-row-title">{d.title}</div>
                    <div className="nv-row-sub"><MapPin size={11} style={{ display: "inline", marginRight: 4 }} />{d.place}</div>
                  </div>
                  {d.status === "listed" ? (
                    <button className="nv-btn sage sm" disabled={claimingId === d.id} onClick={() => onClaim(d.id)}>
                      {claimingId === d.id ? "Claiming..." : "I can use this"}
                    </button>
                  ) : (
                    <span className="nv-row-status claimed">{d.status}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
          <div className="nv-panel" style={{ textAlign: "center" }}>
            <h2 style={{ justifyContent: "center", marginBottom: "0.4rem" }}>Monthly goal</h2>
            <p className="sub" style={{ marginBottom: "1.4rem", fontSize: "0.86rem" }}>Forty claims closes this month's circle</p>
            <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
              <StatRing value={(stats.claimedThisMonth / 40) * 100} size={160} stroke={12} color="#0D9488" />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: "1.6rem", fontWeight: 600 }}>{stats.claimedThisMonth}/40</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>claimed so far</div>
                </div>
              </div>
            </div>
          </div>

          <div className="nv-panel" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", borderColor: "rgba(13,148,136,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Users2 size={18} color="var(--sage-deep)" />
              <strong style={{ fontFamily: "Fraunces, serif", fontSize: "1.05rem" }}>Grow your team</strong>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Add volunteers to your account so claims can be picked up faster during busy hours.
            </p>
            <Link to="/dashboard/ngo/team" className="nv-btn sage sm">Manage team</Link>
          </div>

          <div className="nv-panel" style={{ background: "linear-gradient(135deg, var(--char-2), var(--char))", borderColor: "transparent", color: "var(--parchment)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <BarChart3 size={18} color="var(--gold)" />
              <strong style={{ fontFamily: "Fraunces, serif", fontSize: "1.05rem" }}>Share your impact</strong>
            </div>
            <p style={{ fontSize: "0.88rem", color: "#BFE3D3", lineHeight: 1.6, marginBottom: "1rem" }}>
              A public page with your delivery stats — link it in funding pitches or your own site.
            </p>
            {/* Demo slug — once NGOs have a real id/slug from the backend, link to /impact/:ngoId for this org. */}
            <Link to="/impact/asha-foundation" className="nv-btn ghost-dark sm">View your impact page</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
