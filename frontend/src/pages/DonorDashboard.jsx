import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PackagePlus,
  UtensilsCrossed,
  Shirt,
  BookOpen,
  ArrowRight,
  Sparkles,
  Info,
  Gift,
} from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import StatRing from "../components/StatRing";
import { api } from "../lib/api";

const MOCK_STATS = { activeListings: 3, itemsGiven: 214, ngosMatched: 12, avgMatchMinutes: 18 };
const MOCK_LISTINGS = [
  { id: 1, title: "Vegetable biryani, 40 portions", category: "food", place: "HSR Layout", status: "claimed" },
  { id: 2, title: "Winter jackets and sweaters", category: "clothing", place: "Indiranagar", status: "listed" },
  { id: 3, title: "Notebooks and geometry sets", category: "supplies", place: "Whitefield", status: "delivered" },
  { id: 4, title: "Leftover festival sweets, 15kg", category: "food", place: "Koramangala", status: "delivered" },
];

const ICONS = { food: UtensilsCrossed, clothing: Shirt, supplies: BookOpen };

export default function DonorDashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [demoMode, setDemoMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, dash] = await Promise.all([api.me(), api.donorStats()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setStats(dash?.stats || MOCK_STATS);
        setListings(dash?.listings || MOCK_LISTINGS);
        setDemoMode(false);
      } catch {
        // Backend not connected yet, keep showing demo data.
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const impactPercent = Math.min(100, Math.round((stats.itemsGiven / 300) * 100));

  return (
    <DashboardShell role="donor" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
          <p className="sub">Here is what your circle of giving looks like right now.</p>
        </div>
        <Link to="/dashboard/donor/new" className="nv-btn spark">
          <PackagePlus size={17} /> List a donation
        </Link>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", display: "flex", gap: "0.8rem", alignItems: "flex-start", background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.3)" }}>
          <Info size={18} color="#047857" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: "0.88rem", color: "var(--ink-soft)" }}>
            <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Point <code>VITE_API_BASE_URL</code> at your backend in the frontend .env file to replace this with your real listings.
          </div>
        </div>
      )}

      <div className="nv-ring-grid">
        <div className="nv-ring-card">
          <StatRing value={(stats.activeListings / 6) * 100} color="#10B981" />
          <div>
            <div className="nv-ring-num">{stats.activeListings}</div>
            <div className="nv-ring-label">Active listings</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={impactPercent} color="#34D399" />
          <div>
            <div className="nv-ring-num">{stats.itemsGiven}</div>
            <div className="nv-ring-label">Items given in total</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={(stats.ngosMatched / 20) * 100} color="#0D9488" />
          <div>
            <div className="nv-ring-num">{stats.ngosMatched}</div>
            <div className="nv-ring-label">NGOs matched with</div>
          </div>
        </div>
        <div className="nv-ring-card">
          <StatRing value={100 - stats.avgMatchMinutes} color="#047857" />
          <div>
            <div className="nv-ring-num">{stats.avgMatchMinutes}m</div>
            <div className="nv-ring-label">Average match time</div>
          </div>
        </div>
      </div>

      <div className="nv-dash-grid">
        <div className="nv-panel">
          <h2>
            Recent listings
            <Link to="/dashboard/donor/listings" className="see-all">See all</Link>
          </h2>
          {listings.length === 0 ? (
            <div className="nv-empty">
              <div className="ic"><PackagePlus size={22} /></div>
              <h3>Nothing listed yet</h3>
              <p>Your first listing usually finds a match within twenty minutes.</p>
              <Link to="/dashboard/donor/new" className="nv-btn spark sm">List your first donation</Link>
            </div>
          ) : (
            listings.map((l) => {
              const Icon = ICONS[l.category] || PackagePlus;
              return (
                <div className="nv-row" key={l.id}>
                  <div className="nv-row-icon"><Icon size={19} /></div>
                  <div className="nv-row-body">
                    <div className="nv-row-title">{l.title}</div>
                    <div className="nv-row-sub">{l.place}</div>
                  </div>
                  <span className={`nv-row-status ${l.status}`}>{l.status}</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
          <div className="nv-panel" style={{ textAlign: "center" }}>
            <h2 style={{ justifyContent: "center", marginBottom: "0.4rem" }}>Your impact ring</h2>
            <p className="sub" style={{ marginBottom: "1.4rem", fontSize: "0.86rem" }}>Three hundred items closes your first full circle</p>
            <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto" }}>
              <StatRing value={impactPercent} size={160} stroke={12} color="#10B981" />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: "1.6rem", fontWeight: 600 }}>{impactPercent}%</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--ink-soft)" }}>of the way there</div>
                </div>
              </div>
            </div>
          </div>

          <div className="nv-panel" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", borderColor: "rgba(16,185,129,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Sparkles size={18} color="var(--spark-deep)" />
              <strong style={{ fontFamily: "Fraunces, serif", fontSize: "1.05rem" }}>Tip for a faster match</strong>
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: "1rem" }}>
              Listings with a clear photo and pickup window are claimed about twice as fast. Add both next time you post.
            </p>
            <Link to="/dashboard/donor/new" className="nv-btn spark sm">List a donation <ArrowRight size={14} /></Link>
          </div>

          <div className="nv-panel" style={{ background: "linear-gradient(135deg, var(--char-2), var(--char))", borderColor: "transparent", color: "var(--parchment)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Gift size={18} color="var(--gold)" />
              <strong style={{ fontFamily: "Fraunces, serif", fontSize: "1.05rem" }}>Your year, wrapped</strong>
            </div>
            <p style={{ fontSize: "0.88rem", color: "#BFE3D3", lineHeight: 1.6, marginBottom: "1rem" }}>
              See a shareable recap of everything you've given this year.
            </p>
            <Link to="/dashboard/donor/wrapped" className="nv-btn ghost-dark sm">View your wrapped <ArrowRight size={14} /></Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
