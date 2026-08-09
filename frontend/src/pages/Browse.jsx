import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, UtensilsCrossed, Shirt, BookOpen, PackageSearch, ArrowLeft, LocateFixed } from "lucide-react";
import Logo from "../components/Logo";
import { api } from "../lib/api";
import "../styles/tokens.css";

const MOCK_DONATIONS = [
  { id: 1, title: "Vegetable biryani, 40 portions", category: "food", donor: "Green Leaf Kitchen", place: "HSR Layout, Bengaluru", status: "listed" },
  { id: 2, title: "Winter jackets and sweaters", category: "clothing", donor: "The Fernandes Family", place: "Indiranagar, Bengaluru", status: "listed" },
  { id: 3, title: "Notebooks and geometry sets", category: "supplies", donor: "Lakeview School", place: "Whitefield, Bengaluru", status: "claimed" },
  { id: 4, title: "Leftover festival sweets, 15kg", category: "food", donor: "Sundar Sweets", place: "Koramangala, Bengaluru", status: "delivered" },
];

const ICONS = { food: UtensilsCrossed, clothing: Shirt, supplies: BookOpen, other: PackageSearch };
const FILTERS = [
  { key: "all", label: "All" },
  { key: "food", label: "Food" },
  { key: "clothing", label: "Clothing" },
  { key: "supplies", label: "Supplies" },
];

export default function Browse() {
  const [donations, setDonations] = useState(MOCK_DONATIONS);
  const [filter, setFilter] = useState("all");
  const [nearMe, setNearMe] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  function load(params = {}) {
    api.listDonations(params).then((data) => {
      if (data?.donations?.length) setDonations(data.donations);
    }).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  // Sorts the whole list by distance from the viewer's own browser
  // location against each listing's stored latitude/longitude (see
  // NewListing.jsx) — no external geocoding service, so it only works for
  // listings whose donor opted in to sharing a location when posting.
  const toggleNearMe = () => {
    if (nearMe) {
      setNearMe(false);
      load();
      return;
    }
    if (!navigator.geolocation) {
      setLocateError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMe(true);
        setLocating(false);
        load({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setLocateError(err.code === 1 ? "Location access was denied." : "Couldn't get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const filtered = filter === "all" ? donations : donations.filter((d) => d.category === filter);

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .nv-browse-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.4rem 6vw; background: var(--char); }
        .nv-browse-hero { padding: 3.6rem 6vw 2rem; text-align: center; background: var(--char); color: var(--parchment); }
        .nv-browse-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 3.6vw, 2.8rem); margin: 0 0 0.8rem; }
        .nv-browse-hero p { color: #BFE3D3; max-width: 560px; margin: 0 auto; }
        .nv-filters { display: flex; gap: 10px; justify-content: center; padding: 1.6rem 6vw; background: var(--char); flex-wrap: wrap; align-items: center; }
        .nv-filter-btn { padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.25); background: transparent; color: var(--parchment); font-size: 0.86rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .nv-filter-btn.active { background: var(--spark); border-color: var(--spark); }
        .nv-nearme-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(52,211,153,0.5); background: transparent; color: var(--gold); font-size: 0.86rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .nv-nearme-btn.active { background: var(--spark); border-color: var(--spark); color: #06231A; }
        .nv-browse-grid { max-width: 1180px; margin: 0 auto; padding: 3rem 6vw; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6rem; }
        .nv-bcard { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; text-decoration: none; color: var(--ink); transition: transform 0.25s ease, box-shadow 0.25s ease; display: block; }
        .nv-bcard:hover { transform: translateY(-5px); box-shadow: var(--shadow-soft); }
        .nv-bcard-media { height: 120px; display: grid; place-items: center; background: linear-gradient(135deg, #D1FAE5, #A7F3D0); color: var(--spark-deep); overflow: hidden; }
        .nv-bcard-media img { width: 100%; height: 100%; object-fit: cover; }
        .nv-bcard-body { padding: 1.3rem; }
        .nv-bcard h4 { font-family: 'Fraunces', serif; margin: 8px 0 4px; font-size: 1.05rem; }
        .nv-bcard .donor { font-size: 0.84rem; color: var(--ink-soft); margin-bottom: 10px; }
        .nv-bcard .place { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--ink-soft); border-top: 1px solid var(--line); padding-top: 10px; justify-content: space-between; }
        .nv-bcard .distance { font-weight: 600; color: var(--spark-deep); white-space: nowrap; }
        @media (max-width: 900px) { .nv-browse-grid { grid-template-columns: 1fr; } }
      `}</style>

      <nav className="nv-browse-nav">
        <Link to="/" className="nv-brand"><Logo size={28} /> Nirvah</Link>
        <Link to="/" className="nv-btn ghost-dark sm"><ArrowLeft size={15} /> Home</Link>
      </nav>

      <section className="nv-browse-hero">
        <h1>Explore the network</h1>
        <p>Everything currently listed on Nirvah. NGOs can claim a listing straight from here once they are logged in.</p>
      </section>

      <div className="nv-filters">
        {FILTERS.map((f) => (
          <button key={f.key} className={`nv-filter-btn ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <button className={`nv-nearme-btn ${nearMe ? "active" : ""}`} onClick={toggleNearMe} disabled={locating}>
          <LocateFixed size={14} /> {locating ? "Locating…" : nearMe ? "Sorted by distance" : "Near me"}
        </button>
      </div>
      {locateError && <div style={{ textAlign: "center", color: "#F87171", fontSize: "0.82rem", paddingBottom: "0.6rem", background: "var(--char)" }}>{locateError}</div>}

      <div className="nv-browse-grid">
        {filtered.map((d) => {
          const Icon = ICONS[d.category] || PackageSearch;
          return (
            <Link to={`/browse/${d.id}`} className="nv-bcard" key={d.id}>
              <div className="nv-bcard-media">
                {d.photoUrl ? <img src={d.photoUrl} alt={d.title} /> : <Icon size={30} strokeWidth={1.6} />}
              </div>
              <div className="nv-bcard-body">
                <span className="nv-pill spark">{d.status}</span>
                <h4>{d.title}</h4>
                <div className="donor">{d.donor}</div>
                <div className="place">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={12} /> {d.place}</span>
                  {d.distanceKm != null && <span className="distance">{d.distanceKm} km away</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
