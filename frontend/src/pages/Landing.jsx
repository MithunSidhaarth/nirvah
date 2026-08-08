import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  MapPin,
  Clock,
  PackagePlus,
  Radar,
  HeartHandshake,
  ArrowRight,
  Mail,
  Phone,
  Menu,
  X,
  UtensilsCrossed,
  Shirt,
  BookOpen,
  Users2,
  Sparkles,
  Circle,
} from "lucide-react";
import Reveal from "../components/Reveal";
import "../styles/tokens.css";

/* ---------------------------------------------------------
   NIRVAH — donor / NGO matching platform, marketing site
   Theme: "full circle giving". A spark passes from someone
   who has more to someone who needs it, and the circle closes
   the moment it is delivered.
--------------------------------------------------------- */

const RELAY_EVENTS = [
  "12 warm meals just left a kitchen in Indiranagar",
  "A box of winter coats matched with Asha Foundation",
  "Bakery surplus claimed 4 minutes after listing",
  "200 notebooks sent to a shelter in Whitefield",
  "A restaurant's evening surplus found a home tonight",
  "Rice and dal for 30 people picked up in Koramangala",
];

const DONATIONS = [
  {
    id: 1,
    category: "Perishable Food",
    icon: UtensilsCrossed,
    donor: "Green Leaf Kitchen",
    desc: "40 portions of vegetable biryani, packed and ready. Cooked this evening, needs pickup soon.",
    place: "HSR Layout, Bengaluru",
    expiresInMs: 3 * 60 * 60 * 1000 + 24 * 60 * 1000,
  },
  {
    id: 2,
    category: "Clothing",
    icon: Shirt,
    donor: "The Fernandes Family",
    desc: "30 winter jackets and sweaters, sizes kids to adult. Clean, folded and boxed by size.",
    place: "Indiranagar, Bengaluru",
    expiresInMs: null,
  },
  {
    id: 3,
    category: "Books and Supplies",
    icon: BookOpen,
    donor: "Lakeview School",
    desc: "180 notebooks, 40 geometry sets and a box of storybooks cleared from last term.",
    place: "Whitefield, Bengaluru",
    expiresInMs: null,
  },
];

function formatCountdown(ms) {
  if (ms === null) return null;
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function EmberField({ count = 18 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 5,
        duration: 7 + Math.random() * 8,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 60,
      })),
    [count]
  );
  return (
    <div className="ember-field" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="ember-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* Signature visual: a spark travelling a closed ring, "full circle giving" */
function CircleGraphic() {
  const r = 92;
  const cx = 130;
  const cy = 130;
  return (
    <svg className="circle-graphic" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="nvGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4B942" />
          <stop offset="100%" stopColor="#FF7A45" />
        </linearGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r} stroke="#F7EFE3" strokeOpacity="0.14" strokeWidth="1.5" />
      <circle
        id="ringPath"
        cx={cx}
        cy={cy}
        r={r}
        stroke="url(#ringGrad)"
        strokeWidth="1.5"
        strokeDasharray="2 9"
        strokeLinecap="round"
        opacity="0.7"
      />

      <circle cx={cx} cy={cy - r} r="6" fill="#F7EFE3" />
      <text x={cx} y={cy - r - 16} textAnchor="middle" className="circle-label">GIVER</text>

      <circle cx={cx} cy={cy + r} r="6" fill="#F7EFE3" />
      <text x={cx} y={cy + r + 24} textAnchor="middle" className="circle-label">DELIVERED</text>

      <circle cx={cx + r} cy={cy} r="6" fill="#F7EFE3" />
      <text x={cx + r + 34} y={cy + 4} textAnchor="middle" className="circle-label">NGO</text>

      <g filter="url(#nvGlow)">
        <circle r="5" fill="#FFD9A0">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath xlinkHref="#ringPath" />
          </animateMotion>
        </circle>
      </g>

      <text x={cx} y={cy - 6} textAnchor="middle" className="circle-center-1 font-display">Full circle</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="circle-center-2 font-mono">giving</text>
    </svg>
  );
}

function CountdownChip({ ms }) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    if (ms === null) return;
    const iv = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(iv);
  }, [ms]);
  if (ms === null) return null;
  const text = formatCountdown(remaining);
  const urgent = remaining < 60 * 60 * 1000;
  return (
    <div className={`countdown-chip ${urgent ? "urgent" : ""}`}>
      <Clock size={13} strokeWidth={2.4} />
      <span>{text === "Expired" ? "Expired" : `${text} left`}</span>
    </div>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex((i) => (i + 1) % RELAY_EVENTS.length);
        setTickerVisible(true);
      }, 400);
    }, 4200);
    return () => clearInterval(iv);
  }, []);

  const navLinks = [
    { label: "How it works", href: "#how" },
    { label: "Explore", href: "#feed" },
    { label: "For NGOs", href: "#split" },
    { label: "Contact", href: "#footer" },
  ];

  return (
    <div className="nv-app nv-landing">
      <style>{`
        .nv-landing .nv-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 6vw; background: transparent;
          transition: background 0.4s ease, padding 0.4s ease, box-shadow 0.4s ease;
        }
        .nv-landing .nv-nav.scrolled {
          background: rgba(20, 17, 12, 0.92); backdrop-filter: blur(10px);
          padding: 14px 6vw; box-shadow: 0 8px 30px rgba(0,0,0,0.25);
        }
        .nv-brand {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.5rem;
          color: var(--parchment); text-decoration: none;
        }
        .nv-brand .badge {
          display: grid; place-items: center; width: 34px; height: 34px;
          border-radius: 10px;
          background: linear-gradient(145deg, var(--gold), var(--spark-deep));
          color: var(--char);
        }
        .nv-links { display: flex; align-items: center; gap: 2.2rem; }
        .nv-links a { font-size: 0.95rem; font-weight: 500; color: var(--parchment); opacity: 0.82; text-decoration: none; transition: opacity 0.2s ease; }
        .nv-links a:hover { opacity: 1; }
        .nv-menu-btn { display: none; background: none; border: none; color: var(--parchment); }
        @media (max-width: 900px) { .nv-links { display: none; } .nv-menu-btn { display: block; } }

        .nv-hero {
          position: relative;
          background: radial-gradient(120% 100% at 15% 0%, #241C13 0%, var(--char) 55%, #0d0b08 100%);
          padding: 4vw 6vw 6vw; overflow: hidden;
        }
        .ember-field { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .ember-particle {
          position: absolute; bottom: -20px; border-radius: 50%;
          background: radial-gradient(circle, #FFD9A0 0%, var(--spark) 60%, transparent 100%);
          opacity: 0; animation-name: emberRise; animation-timing-function: ease-in; animation-iteration-count: infinite;
        }
        @keyframes emberRise {
          0% { opacity: 0; transform: translate(0,0) scale(0.6); }
          12% { opacity: 0.9; } 80% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(var(--drift), -520px) scale(1.1); }
        }
        .nv-hero-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding-top: 4.5rem; text-align: center; }
        .nv-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold); background: rgba(244,185,66,0.08); border: 1px solid rgba(244,185,66,0.35);
          padding: 7px 16px; border-radius: 999px; margin-bottom: 2rem;
        }
        .nv-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spark); animation: pulseDot 1.8s infinite; }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 rgba(255,122,69,0.55);} 70% { box-shadow: 0 0 0 8px rgba(255,122,69,0);} 100% { box-shadow: 0 0 0 0 rgba(255,122,69,0);} }
        .nv-hero h1 {
          font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(2.6rem, 5.4vw, 4.6rem);
          line-height: 1.05; color: var(--parchment); letter-spacing: -0.01em; margin: 0 0 1.6rem;
        }
        .nv-hero h1 em {
          font-style: italic; font-weight: 500;
          background: linear-gradient(120deg, var(--gold), var(--spark));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .nv-hero p.lede { font-size: clamp(1.05rem, 1.6vw, 1.28rem); color: #CFC3B0; max-width: 620px; margin: 0 auto 2.6rem; line-height: 1.6; }
        .nv-hero-ctas { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; margin-bottom: 2.6rem; }
        .circle-graphic { width: 260px; height: 260px; margin: 0 auto; display: block; }
        .circle-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; fill: #CFC3B0; }
        .circle-center-1 { fill: var(--parchment); font-size: 15px; font-style: italic; }
        .circle-center-2 { fill: var(--gold); font-size: 10px; letter-spacing: 0.1em; }
        .nv-live-ticker { margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; color: #CFC3B0; min-height: 20px; }
        .nv-live-ticker .flame-ico { color: var(--spark); flex-shrink: 0; }
        .nv-live-ticker span.msg { transition: opacity 0.4s ease, transform 0.4s ease; }
        .nv-live-ticker span.msg.hidden { opacity: 0; transform: translateY(4px); }
        .nv-live-ticker span.msg.shown { opacity: 1; transform: translateY(0); }

        .nv-stats { background: var(--parchment); padding: 3.4rem 6vw; border-bottom: 1px solid var(--parchment-2); }
        .nv-stats-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; text-align: center; }
        .nv-stat-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: clamp(1.9rem,3.4vw,2.6rem); color: var(--spark-deep); }
        .nv-stat-label { margin-top: 6px; font-size: 0.92rem; color: var(--ink-soft); font-weight: 500; }
        .nv-stats-note { text-align: center; margin-top: 1.6rem; font-size: 0.78rem; color: var(--ink-soft); opacity: 0.7; }

        .nv-how { padding: 7rem 6vw; background: var(--parchment); }
        .nv-section-head { max-width: 640px; margin: 0 auto 4rem; text-align: center; }
        .nv-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--spark-deep); margin-bottom: 1rem; display: block; }
        .nv-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem,3.6vw,2.8rem); font-weight: 600; color: var(--ink); margin: 0 0 1rem; }
        .nv-section-head p { color: var(--ink-soft); font-size: 1.05rem; line-height: 1.6; }
        .nv-legs { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 2.4rem; }
        .nv-leg { background: #fff; border: 1px solid var(--parchment-2); border-radius: 20px; padding: 2.2rem 1.9rem; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .nv-leg:hover { transform: translateY(-6px); box-shadow: 0 22px 40px rgba(36,28,21,0.08); }
        .nv-leg .leg-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; color: var(--gold); text-transform: uppercase; }
        .nv-leg .leg-icon { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(145deg,#FFE6D2,#FFCBA4); color: var(--spark-deep); margin: 14px 0 18px; }
        .nv-leg h3 { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 600; margin: 0 0 10px; color: var(--ink); }
        .nv-leg p { color: var(--ink-soft); font-size: 0.96rem; line-height: 1.55; margin: 0; }

        .nv-feed { background: var(--char); padding: 7rem 6vw; }
        .nv-feed .nv-section-head h2 { color: var(--parchment); }
        .nv-feed .nv-section-head p { color: #B9AC98; }
        .nv-feed-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.8rem; }
        .nv-card2 { background: var(--char-2); border: 1px solid rgba(247,239,227,0.08); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.3s ease, border-color 0.3s ease; }
        .nv-card2:hover { transform: translateY(-5px); border-color: rgba(255,122,69,0.4); }
        .nv-card2-media { height: 130px; display: grid; place-items: center; background: linear-gradient(135deg, var(--char-3), var(--char-2)); color: var(--gold); position: relative; }
        .nv-card2-media::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(255,122,69,0.18), transparent 60%); }
        .nv-card2-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .nv-card2 h4 { font-family: 'Fraunces', serif; color: var(--parchment); font-size: 1.1rem; margin: 0; font-weight: 600; }
        .nv-card2 p.desc { color: #B9AC98; font-size: 0.9rem; line-height: 1.55; margin: 0; flex: 1; }
        .nv-card2 .place { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #9C8E79; padding-top: 10px; border-top: 1px solid rgba(247,239,227,0.08); }
        .countdown-chip { display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; font-weight: 600; color: var(--gold); background: rgba(244,185,66,0.1); padding: 6px 10px; border-radius: 8px; width: fit-content; }
        .countdown-chip.urgent { color: #FF8B6B; background: rgba(255,122,69,0.14); }

        .nv-split { display: grid; grid-template-columns: 1fr 1fr; }
        .nv-split-panel { padding: 6rem 4.5vw; }
        .nv-split-panel.giver { background: var(--parchment); }
        .nv-split-panel.ngo { background: var(--ink); color: var(--parchment); }
        .nv-split-panel .panel-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin-bottom: 1.6rem; }
        .nv-split-panel.giver .panel-icon { background: linear-gradient(145deg,#FFE6D2,#FFCBA4); color: var(--spark-deep); }
        .nv-split-panel.ngo .panel-icon { background: rgba(111,162,135,0.16); color: var(--sage); }
        .nv-split-panel h3 { font-family: 'Fraunces', serif; font-size: clamp(1.6rem,2.6vw,2.1rem); font-weight: 600; margin: 0 0 1rem; }
        .nv-split-panel p.copy { line-height: 1.65; margin-bottom: 1.8rem; max-width: 460px; }
        .nv-split-panel.giver p.copy { color: var(--ink-soft); }
        .nv-split-panel.ngo p.copy { color: #C9BEAC; }
        .nv-split-list { list-style: none; padding: 0; margin: 0 0 2.2rem; display: flex; flex-direction: column; gap: 12px; max-width: 460px; }
        .nv-split-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; line-height: 1.5; }
        .nv-split-panel.giver .nv-split-list li .bullet { color: var(--spark); }
        .nv-split-panel.ngo .nv-split-list li .bullet { color: var(--sage); }
        .nv-split-list li .bullet { flex-shrink: 0; margin-top: 3px; }

        .nv-notes { padding: 7rem 6vw; background: var(--parchment); }
        .nv-notes-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; }
        .nv-note { background: #FFFDF8; border: 1px solid var(--parchment-2); border-radius: 4px 4px 16px 16px; padding: 2rem 1.7rem; box-shadow: 0 16px 30px rgba(36,28,21,0.06); position: relative; transition: transform 0.3s ease; }
        .nv-note:nth-child(2) { transform: rotate(-0.6deg); }
        .nv-note:nth-child(1) { transform: rotate(0.8deg); }
        .nv-note:nth-child(3) { transform: rotate(-0.3deg); }
        .nv-note:hover { transform: translateY(-6px) rotate(0deg); }
        .nv-note .tape { position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(-2deg); width: 54px; height: 20px; background: rgba(244,185,66,0.35); border: 1px solid rgba(244,185,66,0.5); }
        .nv-note-avatar { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 0.95rem; background: linear-gradient(145deg, var(--gold), var(--spark-deep)); color: var(--char); margin-bottom: 14px; }
        .nv-note p.quote { font-size: 0.98rem; line-height: 1.6; color: var(--ink); margin: 0 0 16px; font-style: italic; }
        .nv-note .who { font-size: 0.86rem; color: var(--ink-soft); font-weight: 600; }
        .nv-note .role { font-size: 0.8rem; color: var(--spark-deep); }

        .nv-banner { position: relative; background: linear-gradient(120deg, var(--spark-deep), var(--spark) 60%, var(--gold)); padding: 5.5rem 6vw; text-align: center; overflow: hidden; }
        .nv-banner h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem,4vw,3rem); font-weight: 600; color: #241205; margin: 0 0 1.4rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .nv-banner p { color: rgba(36,18,5,0.75); font-size: 1.05rem; margin-bottom: 2.2rem; }
        .nv-banner .nv-btn.spark { background: var(--char); box-shadow: 0 14px 30px rgba(0,0,0,0.25); }

        .nv-footer { background: var(--char); color: var(--parchment); padding: 5rem 6vw 2.4rem; }
        .nv-footer-grid { max-width: 1080px; margin: 0 auto 3rem; display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 3rem; }
        .nv-footer h5 { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin: 0 0 1.1rem; }
        .nv-footer a, .nv-footer .line { display: flex; align-items: center; gap: 8px; color: #CFC3B0; text-decoration: none; font-size: 0.92rem; margin-bottom: 10px; }
        .nv-footer a:hover { color: var(--gold); }
        .nv-footer-bottom { max-width: 1080px; margin: 0 auto; padding-top: 2rem; border-top: 1px solid rgba(247,239,227,0.1); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 0.8rem; color: #8C7E6A; font-family: 'IBM Plex Mono', monospace; }

        @media (max-width: 900px) {
          .nv-stats-grid { grid-template-columns: 1fr; gap: 2.2rem; }
          .nv-legs { grid-template-columns: 1fr; }
          .nv-feed-grid { grid-template-columns: 1fr; }
          .nv-split { grid-template-columns: 1fr; }
          .nv-notes-grid { grid-template-columns: 1fr; }
          .nv-footer-grid { grid-template-columns: 1fr; gap: 2.2rem; }
        }
      `}</style>

      {/* ---------- NAV ---------- */}
      <nav className={`nv-nav ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="nv-brand">
          <span className="badge"><Flame size={18} strokeWidth={2.4} /></span>
          Nirvah
        </Link>
        <div className="nv-links">
          {navLinks.map((l) => <a key={l.label} href={l.href}>{l.label}</a>)}
          <Link to="/login" style={{ textDecoration: "none" }}>Log in</Link>
          <Link to="/signup" className="nv-btn spark sm">Start giving <ArrowRight size={15} /></Link>
        </div>
        <button className="nv-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {menuOpen && (
        <div style={{ background: "var(--char)", padding: "1.4rem 6vw 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link to="/login" style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
          <Link to="/signup" className="nv-btn spark sm" style={{ width: "fit-content" }}>Start giving <ArrowRight size={15} /></Link>
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <header className="nv-hero">
        <EmberField count={18} />
        <div className="nv-hero-inner">
          <span className="nv-eyebrow"><span className="dot" /> Live matching, right now</span>
          <h1 className="font-display">
            Nothing good <br /> should go <em>to waste.</em>
          </h1>
          <p className="lede">
            Nirvah connects surplus food, clothing and supplies from people who have
            more to neighbours who have less. Matched to a verified NGO in minutes,
            tracked until it is actually delivered.
          </p>
          <div className="nv-hero-ctas">
            <Link to="/signup?role=donor" className="nv-btn spark">I am a giver <ArrowRight size={17} /></Link>
            <Link to="/signup?role=ngo" className="nv-btn ghost-dark">I am an NGO <ArrowRight size={17} /></Link>
          </div>

          <CircleGraphic />

          <div className="nv-live-ticker">
            <Flame size={15} className="flame-ico" />
            <span className={`msg ${tickerVisible ? "shown" : "hidden"}`}>{RELAY_EVENTS[tickerIndex]}</span>
          </div>
        </div>
      </header>

      {/* ---------- STATS ---------- */}
      <section className="nv-stats">
        <Reveal className="nv-stats-grid">
          <div>
            <div className="nv-stat-num">12,480</div>
            <div className="nv-stat-label">meals delivered since launch</div>
          </div>
          <div>
            <div className="nv-stat-num">340+</div>
            <div className="nv-stat-label">verified NGOs on the network</div>
          </div>
          <div>
            <div className="nv-stat-num">18 min</div>
            <div className="nv-stat-label">average time to first match</div>
          </div>
        </Reveal>
        <p className="nv-stats-note">Illustrative platform figures, updated as the Nirvah network grows.</p>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="nv-how" id="how">
        <Reveal className="nv-section-head">
          <span className="nv-kicker">The full circle, in three steps</span>
          <h2 className="font-display">From your shelf to their table</h2>
          <p>No warehouses, no waiting lists. Nirvah is built for the gap between "we have extra" and "someone needs it right now."</p>
        </Reveal>
        <div className="nv-legs">
          <Reveal delay={0}>
            <div className="nv-leg">
              <span className="leg-tag">Step one</span>
              <div className="leg-icon"><PackagePlus size={24} /></div>
              <h3>List what you have</h3>
              <p>Snap a photo, pick a category and drop a pin. Perishable food gets an automatic expiry countdown so timing is never a guess.</p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="nv-leg">
              <span className="leg-tag">Step two</span>
              <div className="leg-icon"><Radar size={24} /></div>
              <h3>Get matched instantly</h3>
              <p>Nearby verified NGOs see your listing the moment it goes live, ranked by distance and need. No cold calls, no phone trees.</p>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="nv-leg">
              <span className="leg-tag">Step three</span>
              <div className="leg-icon"><HeartHandshake size={24} /></div>
              <h3>Watch it get delivered</h3>
              <p>An NGO claims it, picks it up and delivers it. You see the handoff through: a name, a place, a reason it mattered.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- LIVE FEED ---------- */}
      <section className="nv-feed" id="feed">
        <Reveal className="nv-section-head">
          <span className="nv-kicker">Happening on Nirvah right now</span>
          <h2 className="font-display">A few things waiting for a match</h2>
          <p>A live style preview of what is currently listed on the network. Real listings look exactly like this.</p>
        </Reveal>
        <div className="nv-feed-grid">
          {DONATIONS.map((d, i) => {
            const Icon = d.icon;
            return (
              <Reveal key={d.id} delay={i * 0.1}>
                <div className="nv-card2">
                  <div className="nv-card2-media"><Icon size={34} strokeWidth={1.6} /></div>
                  <div className="nv-card2-body">
                    <span className="nv-pill gold">{d.category}</span>
                    <h4>{d.donor}</h4>
                    <p className="desc">{d.desc}</p>
                    {d.expiresInMs !== null && <CountdownChip ms={d.expiresInMs} />}
                    <div className="place"><MapPin size={13} /> {d.place}</div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------- SPLIT: GIVER / NGO ---------- */}
      <section className="nv-split" id="split">
        <div className="nv-split-panel giver">
          <Reveal>
            <div className="panel-icon"><Sparkles size={26} /></div>
            <h3 className="font-display">For givers</h3>
            <p className="copy">Whatever is in surplus, a kitchen's evening extras, a closet clearout, last term's supplies, takes minutes to list and finds a real recipient instead of a landfill.</p>
            <ul className="nv-split-list">
              <li><span className="bullet">◆</span> List in under two minutes, no approval wait</li>
              <li><span className="bullet">◆</span> Automatic urgency countdowns for perishables</li>
              <li><span className="bullet">◆</span> See exactly which NGO claimed your donation</li>
            </ul>
            <Link to="/signup?role=donor" className="nv-btn spark">Become a giver <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
        <div className="nv-split-panel ngo">
          <Reveal>
            <div className="panel-icon"><Users2 size={26} /></div>
            <h3 className="font-display">For NGOs</h3>
            <p className="copy">Stop chasing leads. Verified organisations get a live feed of nearby donations, filterable by category and distance, so your team spends time delivering, not searching.</p>
            <ul className="nv-split-list">
              <li><span className="bullet">◆</span> Live alerts for listings near your service area</li>
              <li><span className="bullet">◆</span> Single tap claim, with the giver notified immediately</li>
              <li><span className="bullet">◆</span> A dashboard of everything your org has delivered</li>
            </ul>
            <Link to="/signup?role=ngo" className="nv-btn sage">Register your NGO <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="nv-notes">
        <Reveal className="nv-section-head">
          <span className="nv-kicker">Notes from the network</span>
          <h2 className="font-display">People who have passed it on</h2>
        </Reveal>
        <div className="nv-notes-grid">
          {[
            { initials: "SJ", quote: "I listed our restaurant's evening surplus at 9pm and it was claimed before we had finished closing up. Genuinely did not expect it to be that fast.", who: "Sarah Johnson", role: "Giver, Bengaluru" },
            { initials: "MB", quote: "We used to spend hours cold calling donors. Now listings come to us, sorted by distance, the moment they go up.", who: "Michael Brown", role: "NGO Coordinator, Asha Foundation" },
            { initials: "LM", quote: "The countdown on perishable listings changed everything for us. We know exactly what needs picking up first.", who: "Lisa Miller", role: "Volunteer Lead" },
          ].map((t, i) => (
            <Reveal key={t.who} delay={i * 0.1}>
              <div className="nv-note">
                <div className="tape" />
                <div className="nv-note-avatar">{t.initials}</div>
                <p className="quote">"{t.quote}"</p>
                <div className="who">{t.who}</div>
                <div className="role">{t.role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- CTA BANNER ---------- */}
      <section className="nv-banner">
        <Reveal>
          <h2 className="font-display">Your surplus is someone's tonight.</h2>
          <p>Free to join. Takes two minutes. The next circle starts with you.</p>
          <Link to="/signup" className="nv-btn spark">Get started, it is free <ArrowRight size={17} /></Link>
        </Reveal>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="nv-footer" id="footer">
        <div className="nv-footer-grid">
          <div>
            <div className="nv-brand" style={{ marginBottom: "1rem" }}>
              <span className="badge"><Flame size={18} /></span>
              Nirvah
            </div>
            <p style={{ color: "#9C8E79", fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 320 }}>
              A network connecting givers and NGOs, so surplus finds its way to
              someone who needs it instead of a bin.
            </p>
          </div>
          <div>
            <h5>Contact</h5>
            <a href="mailto:hello@nirvah.org"><Mail size={14} /> hello@nirvah.org</a>
            <a href="tel:+919987654321"><Phone size={14} /> +91 99876 54321</a>
            <div className="line"><MapPin size={14} /> Bengaluru, India</div>
          </div>
          <div>
            <h5>Quick links</h5>
            <a href="#how">How it works</a>
            <a href="#feed">Explore donations</a>
            <Link to="/login">Log in or register</Link>
          </div>
        </div>
        <div className="nv-footer-bottom">
          <span>2026 Nirvah. Made for the cause. Free, always.</span>
          <span>Terms and Privacy</span>
        </div>
      </footer>
    </div>
  );
}
