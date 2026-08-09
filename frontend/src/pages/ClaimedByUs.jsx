import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, UtensilsCrossed, Shirt, BookOpen, Search, ListChecks } from "lucide-react";
import DashboardShell from "../components/DashboardShell";
import { api } from "../lib/api";

const MOCK_CLAIMED = [
  { id: 1, title: "Vegetable biryani, 40 portions", category: "food", place: "HSR Layout", status: "claimed", donor: "Green Leaf Kitchen" },
  { id: 3, title: "Notebooks and geometry sets", category: "supplies", place: "Whitefield", status: "delivered", donor: "Lakeview School" },
];

const ICONS = { food: UtensilsCrossed, clothing: Shirt, supplies: BookOpen };
const LOGISTICS_TAG = { donor_drop: "giver drops off", ngo_pickup: "we pick up" };

const STATUS_LABEL = {
  claimed: "Awaiting acceptance", accepted: "Ready for pickup", pickup: "Picked up",
  delivered: "Delivered ✓", acknowledged: "Delivered ✓",
  impact_recorded: "Impact logged ✓", documentation_complete: "Impact logged ✓",
  closed: "Closed",
};
const STATUS_STYLE_CLASS = {
  claimed: "claimed", accepted: "claimed", pickup: "claimed",
  delivered: "delivered", acknowledged: "delivered",
  impact_recorded: "delivered", documentation_complete: "delivered", closed: "delivered",
};

const TABS = [
  { key: "all", label: "All" },
  { key: "progress", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "closed", label: "Closed" },
];

function matchesTab(status, tab) {
  if (tab === "all") return true;
  if (tab === "progress") return ["claimed", "accepted", "pickup"].includes(status);
  if (tab === "delivered") return ["delivered", "acknowledged", "impact_recorded", "documentation_complete"].includes(status);
  if (tab === "closed") return status === "closed";
  return true;
}

export default function ClaimedByUs() {
  const [claimed, setClaimed] = useState(MOCK_CLAIMED);
  const [demoMode, setDemoMode] = useState(true);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, mine] = await Promise.all([api.me(), api.myClaimed()]);
        if (cancelled) return;
        setUser(me?.user || null);
        setClaimed(mine?.donations || []);
        setDemoMode(false);
      } catch {
        setDemoMode(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return claimed.filter((c) => {
      if (!matchesTab(c.status, tab)) return false;
      if (!q) return true;
      return (c.title || "").toLowerCase().includes(q) || (c.place || "").toLowerCase().includes(q) || (c.donor || "").toLowerCase().includes(q);
    });
  }, [claimed, tab, query]);

  return (
    <DashboardShell role="ngo" user={user}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">Claimed by us</h1>
          <p className="sub">Everything your organisation has claimed and delivered.</p>
        </div>
        <Link to="/browse" className="nv-btn sage">
          <Compass size={17} /> Browse donations
        </Link>
      </div>

      {demoMode && (
        <div className="nv-panel" style={{ marginBottom: "1.4rem", fontSize: "0.86rem", color: "var(--ink-soft)", background: "rgba(13,148,136,0.08)", borderColor: "rgba(13,148,136,0.3)" }}>
          <strong style={{ color: "var(--ink)" }}>Showing demo data.</strong> Connect the backend to see what you've actually claimed.
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
            <input placeholder="Search what you've claimed" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="nv-empty">
            <div className="ic"><ListChecks size={22} /></div>
            <h3>Nothing here yet</h3>
            <p>{claimed.length === 0 ? "Claim your first donation to start building this list." : "Nothing matches this filter right now."}</p>
            <Link to="/browse" className="nv-btn sage sm">Browse donations</Link>
          </div>
        ) : (
          filtered.map((c) => {
            const Icon = ICONS[c.category] || Compass;
            return (
              <Link to={`/browse/${c.id}`} className="nv-row" key={c.id} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="nv-row-icon sage">{c.photoUrl ? <img src={c.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : <Icon size={19} />}</div>
                <div className="nv-row-body">
                  <div className="nv-row-title">{c.title}</div>
                  <div className="nv-row-sub">
                    {c.place}{c.donor ? ` · from ${c.donor}` : ""}{LOGISTICS_TAG[c.logisticsMode] ? ` · ${LOGISTICS_TAG[c.logisticsMode]}` : ""}
                  </div>
                </div>
                <span className={`nv-row-status ${STATUS_STYLE_CLASS[c.status] || "claimed"}`}>{STATUS_LABEL[c.status] || c.status}</span>
              </Link>
            );
          })
        )}
      </div>
    </DashboardShell>
  );
}
