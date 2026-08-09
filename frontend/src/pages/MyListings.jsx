import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackagePlus, UtensilsCrossed, Shirt, BookOpen, Search, ListChecks } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const MOCK_LISTINGS = [
  { id: 1, title: "Vegetable biryani, 40 portions", category: "food", place: "HSR Layout", status: "claimed" },
  { id: 2, title: "Winter jackets and sweaters", category: "clothing", place: "Indiranagar", status: "listed" },
  { id: 3, title: "Notebooks and geometry sets", category: "supplies", place: "Whitefield", status: "delivered" },
  { id: 4, title: "Leftover festival sweets, 15kg", category: "food", place: "Koramangala", status: "closed" },
];

const ICONS = { food: UtensilsCrossed, clothing: Shirt, supplies: BookOpen };
const LOGISTICS_TAG = { donor_drop: "you drop off", ngo_pickup: "NGO picks up" };

const STATUS_LABEL = {
  listed: "Finding a match",
  claimed: "On its way", accepted: "On its way", pickup: "On its way",
  delivered: "Reached them ✓", acknowledged: "Reached them ✓",
  impact_recorded: "Impact logged ✓", documentation_complete: "Impact logged ✓",
  closed: "Closed",
};
const STATUS_STYLE_CLASS = {
  listed: "listed",
  claimed: "claimed", accepted: "claimed", pickup: "claimed",
  delivered: "delivered", acknowledged: "delivered",
  impact_recorded: "delivered", documentation_complete: "delivered", closed: "delivered",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "listed", label: "Active" },
  { key: "claimed", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "closed", label: "Closed" },
];

// The dashboard's four exact statuses map onto the tabs above the same way
// the row badges do — "in progress" covers claimed/accepted/pickup and
// "delivered" covers everything from delivered through documentation.
function matchesTab(status, tab) {
  if (tab === "all") return true;
  if (tab === "listed") return status === "listed";
  if (tab === "claimed") return ["claimed", "accepted", "pickup"].includes(status);
  if (tab === "delivered") return ["delivered", "acknowledged", "impact_recorded", "documentation_complete"].includes(status);
  if (tab === "closed") return status === "closed";
  return true;
}

export default function MyListings() {
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [demoMode, setDemoMode] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, mine] = await Promise.all([api.me(), api.myListings()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setListings(mine?.donations || []);
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (!matchesTab(l.status, tab)) return false;
      if (!q) return true;
      return (l.title || "").toLowerCase().includes(q) || (l.place || "").toLowerCase().includes(q);
    });
  }, [listings, tab, query]);

  return (
    <DashboardShell role="donor" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">My listings</h1>
          <p className="sub">Every donation you have ever posted, in one place.</p>
        </div>
        <Link to="/dashboard/donor/new" className="nv-btn spark">
          <PackagePlus size={17} /> Give something
        </Link>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", fontSize: "0.86rem", color: "var(--ink-soft)", background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.3)" }}>
          <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Connect the backend to see your real listings.
        </div>
      )}

      <div className="nv-panel">
        <div className="nv-filter-bar">
          <div className="nv-filter-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`nv-filter-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="nv-search-box">
            <Search size={15} />
            <input placeholder="Search your listings" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="nv-empty">
            <div className="ic"><ListChecks size={22} /></div>
            <h3>Nothing here yet</h3>
            <p>{listings.length === 0 ? "Your first gift usually finds someone within twenty minutes." : "Nothing matches this filter right now."}</p>
            <Link to="/dashboard/donor/new" className="nv-btn spark sm">Give something</Link>
          </div>
        ) : (
          filtered.map((l) => {
            const Icon = ICONS[l.category] || PackagePlus;
            return (
              <Link to={`/browse/${l.id}`} className="nv-row" key={l.id} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="nv-row-icon">{l.photoUrl ? <img src={l.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : <Icon size={19} />}</div>
                <div className="nv-row-body">
                  <div className="nv-row-title">{l.title}</div>
                  <div className="nv-row-sub">
                    {l.place}{l.ngo ? ` · claimed by ${l.ngo}` : ""}{LOGISTICS_TAG[l.logisticsMode] ? ` · ${LOGISTICS_TAG[l.logisticsMode]}` : ""}
                  </div>
                </div>
                <span className={`nv-row-status ${STATUS_STYLE_CLASS[l.status] || "listed"}`}>{STATUS_LABEL[l.status] || l.status}</span>
              </Link>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
