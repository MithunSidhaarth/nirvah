import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, UtensilsCrossed, Shirt, BookOpen, PackageSearch, ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    api.listDonations().then((data) => {
      if (data?.donations?.length) setDonations(data.donations);
    }).catch(() => {});
  }, []);

  const filtered = filter === "all" ? donations : donations.filter((d) => d.category === filter);

  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .nv-browse-nav { display: flex; align-items: center; justify-content: space-between; padding: 1.4rem 6vw; background: var(--char); }
        .nv-browse-hero { padding: 3.6rem 6vw 2rem; text-align: center; background: var(--char); color: var(--parchment); }
        .nv-browse-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 3.6vw, 2.8rem); margin: 0 0 0.8rem; }
        .nv-browse-hero p { color: #CFC3B0; max-width: 560px; margin: 0 auto; }
        .nv-filters { display: flex; gap: 10px; justify-content: center; padding: 1.6rem 6vw; background: var(--char); flex-wrap: wrap; }
        .nv-filter-btn { padding: 8px 18px; border-radius: 999px; border: 1px solid rgba(247,239,227,0.25); background: transparent; color: var(--parchment); font-size: 0.86rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .nv-filter-btn.active { background: var(--spark); border-color: var(--spark); }
        .nv-browse-grid { max-width: 1180px; margin: 0 auto; padding: 3rem 6vw; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.6rem; }
        .nv-bcard { background: var(--surface); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; text-decoration: none; color: var(--ink); transition: transform 0.25s ease, box-shadow 0.25s ease; display: block; }
        .nv-bcard:hover { transform: translateY(-5px); box-shadow: var(--shadow-soft); }
        .nv-bcard-media { height: 120px; display: grid; place-items: center; background: linear-gradient(135deg, #FFE6D2, #FFD3AE); color: var(--spark-deep); }
        .nv-bcard-body { padding: 1.3rem; }
        .nv-bcard h4 { font-family: 'Fraunces', serif; margin: 8px 0 4px; font-size: 1.05rem; }
        .nv-bcard .donor { font-size: 0.84rem; color: var(--ink-soft); margin-bottom: 10px; }
        .nv-bcard .place { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--ink-soft); border-top: 1px solid var(--line); padding-top: 10px; }
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
      </div>

      <div className="nv-browse-grid">
        {filtered.map((d) => {
          const Icon = ICONS[d.category] || PackageSearch;
          return (
            <Link to={`/browse/${d.id}`} className="nv-bcard" key={d.id}>
              <div className="nv-bcard-media"><Icon size={30} strokeWidth={1.6} /></div>
              <div className="nv-bcard-body">
                <span className="nv-pill spark">{d.status}</span>
                <h4>{d.title}</h4>
                <div className="donor">{d.donor}</div>
                <div className="place"><MapPin size={12} /> {d.place}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
