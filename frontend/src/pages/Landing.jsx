import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  PackagePlus,
  Radar,
  HeartHandshake,
  ArrowRight,
  Menu,
  X,
  UtensilsCrossed,
  Shirt,
  BookOpen,
  Users2,
  Sparkles,
  Flame,
  ShieldCheck,
  Activity,
  Bell,
  BarChart3,
  Lock,
  CheckCircle2,
  Zap,
  Leaf,
  FileText,
  Search,
} from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Logo from "../components/Logo";
import { PageFooter } from "../components/PageChrome";
import Magnetic from "../components/motion/Magnetic";
import Marquee from "../components/motion/Marquee";
import TiltCard from "../components/motion/TiltCard";
import ClickSpark from "../components/motion/ClickSpark";
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

/* ---------- animation variants ---------- */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } },
};
const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: "0.6em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.2, 0.75, 0.15, 1] } },
};

function SplitHeadline({ text, className = "", delayStart = 0 }) {
  const words = text.split(" ");
  return (
    <motion.span
      className={className}
      style={{ display: "inline" }}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.055, delayChildren: delayStart } } }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "top",
            // Buffer room inside the clipped box for descenders (g, y) and
            // tall ascenders in Fraunces, which the h1's tight line-height
            // (1.05, set for multi-line headline spacing) doesn't leave
            // room for on its own — without this, overflow: hidden here
            // (needed for the slide-up reveal) silently crops the bottom
            // of letters like the "g" in "good" and "going". The negative
            // margin cancels the added height back out so it doesn't
            // introduce extra gap in the headline.
            lineHeight: 1.25,
            paddingBottom: "0.14em",
            marginBottom: "-0.14em",
          }}
        >
          <motion.span variants={wordVariant} style={{ display: "inline-block" }}>
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/* Ambient mesh blobs drifting slowly behind the hero content */
function MeshBlobs() {
  return (
    <div className="nv-mesh" aria-hidden="true">
      <motion.div
        className="nv-blob nv-blob-1"
        animate={{ x: [0, 60, -20, 0], y: [0, -40, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="nv-blob nv-blob-2"
        animate={{ x: [0, -50, 40, 0], y: [0, 40, -30, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="nv-blob nv-blob-3"
        animate={{ x: [0, 30, -40, 0], y: [0, -25, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function EmberField({ count = 16 }) {
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const effectiveCount = isSmall ? Math.ceil(count / 2.5) : count;
  const particles = useMemo(
    () =>
      Array.from({ length: effectiveCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 3 + Math.random() * 5,
        duration: 7 + Math.random() * 8,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 60,
      })),
    [effectiveCount]
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

/* Signature visual: a spark travelling a closed ring, with light
   cursor-parallax so it feels like it is floating in the scene. */
function CircleGraphic({ parallaxX, parallaxY }) {
  const r = 92;
  const cx = 130;
  const cy = 130;
  return (
    <motion.svg
      className="circle-graphic"
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ x: parallaxX, y: parallaxY }}
    >
      <defs>
        <filter id="nvGlow" x="-140%" y="-140%" width="380%" height="380%">
          <feGaussianBlur stdDeviation="4.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <radialGradient id="ballCore" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F0FFF9" />
          <stop offset="45%" stopColor="#D1FAE5" />
          <stop offset="100%" stopColor="#10B981" />
        </radialGradient>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={r} stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="1.5" />
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

      {/* DONOR node */}
      <circle cx={cx} cy={cy - r} r="15" fill="url(#nodeGlow)" />
      <circle cx={cx} cy={cy - r} r="6" fill="#FFFFFF" />
      <text x={cx} y={cy - r - 16} textAnchor="middle" className="circle-label">DONOR</text>

      {/* DELIVERED node */}
      <circle cx={cx} cy={cy + r} r="15" fill="url(#nodeGlow)" />
      <circle cx={cx} cy={cy + r} r="6" fill="#FFFFFF" />
      <text x={cx} y={cy + r + 24} textAnchor="middle" className="circle-label">DELIVERED</text>

      {/* NGO node */}
      <circle cx={cx + r} cy={cy} r="15" fill="url(#nodeGlow)" />
      <circle cx={cx + r} cy={cy} r="6" fill="#FFFFFF" />
      <text x={cx + r + 34} y={cy + 4} textAnchor="middle" className="circle-label">NGO</text>

      {/* traveling spark: a glowing comet with a soft trailing tail,
          running Donor -> NGO -> Delivered -> Donor, on loop */}
      <g filter="url(#nvGlow)">
        <circle r="9" fill="url(#ballCore)" opacity="0.35">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" begin="-0.15s">
            <mpath xlinkHref="#ringPath" />
          </animateMotion>
        </circle>
        <circle r="6.5" fill="url(#ballCore)">
          <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
            <mpath xlinkHref="#ringPath" />
          </animateMotion>
        </circle>
      </g>

      <text x={cx} y={cy - 6} textAnchor="middle" className="circle-center-1 font-display">Full circle</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="circle-center-2 font-mono">giving</text>
    </motion.svg>
  );
}

/* Small glass toasts that drift beside the hero graphic, cycling through
   live-sounding activity so the hero feels alive rather than static. */
const TOAST_MESSAGES = [
  { icon: UtensilsCrossed, text: "40 meals matched", place: "HSR Layout", tone: "spark" },
  { icon: Shirt, text: "30 jackets claimed", place: "Indiranagar", tone: "gold" },
  { icon: BookOpen, text: "180 notebooks delivered", place: "Whitefield", tone: "sage" },
  { icon: HeartHandshake, text: "Rice & dal picked up", place: "Koramangala", tone: "spark" },
];

function HeroToast({ side, offset }) {
  const [index, setIndex] = useState(offset);
  useEffect(() => {
    const iv = setInterval(() => setIndex((i) => (i + 1) % TOAST_MESSAGES.length), 3400);
    return () => clearInterval(iv);
  }, []);
  const item = TOAST_MESSAGES[index];
  const Icon = item.icon;
  return (
    <motion.div
      className={`nv-hero-toast ${side}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: [0, -9, 0] }}
      transition={{ opacity: { duration: 0.6, delay: 1.5 }, y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 } }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="nv-glass toast-card"
          initial={{ opacity: 0, x: side === "left" ? -14 : 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: side === "left" ? 14 : -14 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span className={`toast-icon ${item.tone}`}><Icon size={15} /></span>
          <span className="toast-text">
            <strong>{item.text}</strong>
            <em>{item.place}</em>
          </span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
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

  const heroRef = useRef(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const parallaxX = useSpring(useTransform(mvX, [-1, 1], [-14, 14]), { stiffness: 60, damping: 18 });
  const parallaxY = useSpring(useTransform(mvY, [-1, 1], [-14, 14]), { stiffness: 60, damping: 18 });
  const spotX = useSpring(useTransform(mvX, [-1, 1], [30, 70]), { stiffness: 40, damping: 20 });
  const spotY = useSpring(useTransform(mvY, [-1, 1], [30, 70]), { stiffness: 40, damping: 20 });

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleHeroMouseMove(e) {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mvX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mvY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  const navLinks = [
    { label: "How it works", to: "/how-it-works" },
    { label: "Explore", to: "/browse" },
    { label: "Donate", to: "/donate" },
    { label: "For NGOs", to: "/for-ngos" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <div className="nv-app nv-landing">
      <style>{`
        .nv-landing .nv-nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 6vw;
          background: linear-gradient(180deg, rgba(6,42,31,0.86) 0%, rgba(6,42,31,0.6) 100%);
          backdrop-filter: blur(12px) saturate(160%);
          -webkit-backdrop-filter: blur(12px) saturate(160%);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          transition: background 0.4s ease, padding 0.4s ease, box-shadow 0.4s ease, backdrop-filter 0.4s ease;
        }
        .nv-landing .nv-nav.scrolled {
          background: rgba(6,42,31, 0.94); backdrop-filter: blur(16px) saturate(160%);
          padding: 13px 6vw; box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        }
        .nv-brand {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Fraunces', serif; font-weight: 700; font-size: 1.5rem;
          color: #FFFFFF; text-decoration: none;
        }
        .nv-links { display: flex; align-items: center; gap: 1.9rem; }
        .nv-links a.nav-link { font-size: 0.95rem; font-weight: 500; color: #FFFFFF; opacity: 0.82; text-decoration: none; transition: opacity 0.2s ease; }
        .nv-links a.nav-link:hover { opacity: 1; }
        .nv-links a.nav-login { font-size: 0.95rem; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 9px 16px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.28); transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease; }
        .nv-links a.nav-login:hover { border-color: var(--gold); color: var(--gold); background: rgba(52,211,153,0.08); }
        .nv-menu-btn { display: none; background: none; border: none; color: #FFFFFF; }
        @media (max-width: 900px) { .nv-links { display: none; } .nv-menu-btn { display: block; } }

        /* ---------- CINEMATIC HERO ---------- */
        .nv-hero {
          position: relative;
          background: radial-gradient(120% 100% at 15% 0%, #0B3D2C 0%, var(--char) 55%, #06231A 100%);
          padding: 4vw 6vw 6vw; overflow: hidden;
          min-height: 92vh; display: flex; flex-direction: column;
        }
        .nv-hero-spotlight {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: radial-gradient(600px circle at var(--sx, 50%) var(--sy, 30%), rgba(16,185,129,0.14), transparent 60%);
        }
        .nv-grain {
          position: absolute; inset: 0; z-index: 3; pointer-events: none; opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .nv-mesh { position: absolute; inset: 0; z-index: 0; }
        .nv-blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.35; }
        .nv-blob-1 { width: 420px; height: 420px; top: 5%; left: 8%; background: radial-gradient(circle, var(--spark), transparent 70%); }
        .nv-blob-2 { width: 380px; height: 380px; bottom: 4%; right: 9%; background: radial-gradient(circle, var(--gold), transparent 70%); }
        .nv-blob-3 { width: 300px; height: 300px; top: 30%; right: 18%; background: radial-gradient(circle, var(--sage), transparent 72%); opacity: 0.18; }
        .ember-field { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .ember-particle {
          position: absolute; bottom: -20px; border-radius: 50%;
          background: radial-gradient(circle, #D1FAE5 0%, var(--spark) 60%, transparent 100%);
          opacity: 0; animation-name: emberRise; animation-timing-function: ease-in; animation-iteration-count: infinite;
        }
        @keyframes emberRise {
          0% { opacity: 0; transform: translate(0,0) scale(0.6); }
          12% { opacity: 0.9; } 80% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(var(--drift), -520px) scale(1.1); }
        }
        .nv-hero-inner { position: relative; z-index: 2; max-width: 1180px; margin: 0 auto; padding-top: 4.5rem; text-align: center; flex: 1; }
        .nv-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold); background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.35);
          padding: 7px 16px; border-radius: 999px; margin-bottom: 2rem;
        }
        .nv-eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spark); animation: pulseDot 1.8s infinite; }
        @keyframes pulseDot { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55);} 70% { box-shadow: 0 0 0 8px rgba(16,185,129,0);} 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0);} }
        .nv-hero h1 {
          font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(2.6rem, 5.4vw, 4.6rem);
          line-height: 1.15; color: var(--parchment); letter-spacing: -0.01em; margin: 0 0 1.6rem;
        }
        .nv-hero h1 em {
          font-style: italic; font-weight: 500;
          background: linear-gradient(120deg, var(--gold), var(--spark));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .nv-hero p.lede { font-size: clamp(1.05rem, 1.6vw, 1.28rem); color: #BFE3D3; max-width: 620px; margin: 0 auto 2.6rem; line-height: 1.6; }
        .nv-hero-ctas { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; margin-bottom: 2.6rem; }
        .circle-graphic { width: 300px; height: 300px; margin: 0 auto; display: block; filter: drop-shadow(0 12px 30px rgba(16,185,129,0.16)); }
        .circle-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; fill: #BFE3D3; }
        .circle-center-1 { fill: var(--parchment); font-size: 15px; font-style: italic; }
        .circle-center-2 { fill: var(--gold); font-size: 10px; letter-spacing: 0.1em; }

        .nv-hero-graphic-wrap { position: relative; }
        .nv-hero-toast { position: absolute; top: 50%; z-index: 4; pointer-events: none; }
        .nv-hero-toast.left { left: -6%; transform: translateY(-140%); }
        .nv-hero-toast.right { right: -6%; transform: translateY(40%); }
        .toast-card {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px 10px 10px;
          border-radius: 13px; box-shadow: 0 14px 30px rgba(0,0,0,0.28); white-space: nowrap;
        }
        .toast-icon { width: 28px; height: 28px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
        .toast-icon.spark { background: rgba(16,185,129,0.18); color: var(--spark); }
        .toast-icon.gold { background: rgba(52,211,153,0.18); color: var(--gold); }
        .toast-icon.sage { background: rgba(13,148,136,0.2); color: var(--sage); }
        .toast-text { display: flex; flex-direction: column; gap: 1px; line-height: 1.25; }
        .toast-text strong { font-size: 0.8rem; font-weight: 600; color: var(--parchment); }
        .toast-text em { font-style: normal; font-size: 0.7rem; color: #8FCDB2; }
        @media (max-width: 1080px) {
          .nv-hero-toast.left { left: -2%; }
          .nv-hero-toast.right { right: -2%; }
        }

        .nv-ticker-wrap { margin-top: 1.2rem; position: relative; z-index: 2; border-top: 1px solid rgba(255,255,255,0.08); }
        .nv-marquee { overflow: hidden; padding: 14px 0; }
        .nv-marquee-track { display: flex; width: max-content; }
        .nv-marquee-set { display: flex; align-items: center; flex-shrink: 0; }
        .nv-ticker-item { display: inline-flex; align-items: center; gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 0.82rem; color: #BFE3D3; padding: 0 2.4rem; white-space: nowrap; }
        .nv-ticker-item .flame-ico { color: var(--spark); flex-shrink: 0; }
        .nv-ticker-item .sep { color: #2F6B54; }

        /* ---------- BEFORE YOU THROW IT AWAY ---------- */
        .nv-hook { padding: 6rem 6vw 6.5rem; background: var(--parchment); text-align: center; position: relative; overflow: hidden; }
        .nv-hook::before {
          content: ''; position: absolute; top: -30%; left: 50%; transform: translateX(-50%);
          width: 560px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.14), transparent 68%); filter: blur(10px); pointer-events: none;
        }
        .nv-hook-inner { position: relative; max-width: 640px; margin: 0 auto; }
        .nv-hook h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem,3.6vw,2.7rem); font-weight: 600; color: var(--ink); margin: 0 0 1.2rem; }
        .nv-hook-ask { font-family: 'Fraunces', serif; font-style: italic; font-weight: 500; font-size: clamp(1.4rem,2.6vw,1.9rem); color: var(--spark-deep); margin: 0 0 1.6rem; }
        .nv-hook p.sub { color: var(--ink-soft); font-size: 1.02rem; line-height: 1.65; margin: 0 0 2rem; }
        .nv-hook-tags { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 2.4rem; }
        .nv-hook-tags span {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; color: var(--ink-soft);
          background: var(--surface); border: 1px solid var(--line); padding: 7px 15px; border-radius: 999px;
        }

        /* ---------- THREE RETURNS ---------- */
        .nv-returns { padding: 7rem 6vw; background: radial-gradient(120% 100% at 50% 0%, #0B3D2C 0%, var(--char) 60%, #06231A 100%); }
        .nv-returns .nv-section-head h2 { color: var(--parchment); max-width: 720px; margin-left: auto; margin-right: auto; }
        .nv-returns .nv-section-head p { color: #A9D6C3; }
        .nv-returns-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.8rem; }
        .nv-return-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 2.1rem 1.8rem; display: flex; flex-direction: column; }
        .nv-return-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; color: var(--gold); text-transform: uppercase; margin-bottom: 1.2rem; }
        .nv-return-icon { width: 48px; height: 48px; border-radius: 13px; display: grid; place-items: center; margin-bottom: 1.3rem; background: rgba(52,211,153,0.14); color: var(--gold); }
        .nv-return-card h3 { font-family: 'Fraunces', serif; font-size: 1.2rem; font-weight: 600; color: var(--parchment); margin: 0 0 10px; }
        .nv-return-card p { color: #A9D6C3; font-size: 0.92rem; line-height: 1.6; margin: 0; flex: 1; }
        .nv-return-card a.see-more { margin-top: 1.2rem; font-size: 0.84rem; font-weight: 600; color: var(--gold); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .nv-returns-close { text-align: center; max-width: 520px; margin: 3rem auto 0; color: #BFE3D3; font-size: 0.98rem; font-style: italic; font-family: 'Fraunces', serif; }

        /* ---------- TRUST BAR ---------- */
        .nv-trust {
          background: linear-gradient(180deg, var(--parchment-2) 0%, var(--parchment) 100%);
          padding: 2.4rem 6vw; border-top: 1px solid rgba(16,185,129,0.16); border-bottom: 1px solid rgba(16,185,129,0.16);
        }
        .nv-trust-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.4rem; }
        .nv-trust-item { display: flex; align-items: center; gap: 10px; font-size: 0.86rem; font-weight: 600; color: var(--spark-deep); }
        .nv-trust-item svg { color: var(--sage-deep); flex-shrink: 0; }

        .nv-how {
          padding: 7rem 6vw; background: var(--surface);
          background-image: radial-gradient(50% 60% at 85% 0%, rgba(13,148,136,0.06), transparent 70%), radial-gradient(45% 50% at 5% 100%, rgba(16,185,129,0.07), transparent 70%);
        }
        .nv-section-head { max-width: 640px; margin: 0 auto 4rem; text-align: center; }
        .nv-kicker { font-family: 'IBM Plex Mono', monospace; font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--spark-deep); margin-bottom: 1rem; display: block; }
        .nv-section-head h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem,3.6vw,2.8rem); font-weight: 600; color: var(--ink); margin: 0 0 1rem; }
        .nv-section-head p { color: var(--ink-soft); font-size: 1.05rem; line-height: 1.6; }
        .nv-legs-wrap { position: relative; max-width: 1080px; margin: 0 auto; }
        .nv-legs-connector {
          position: absolute; top: 60px; left: calc(8.33% + 26px); right: calc(8.33% + 26px);
          height: 2px; transform-origin: left center;
          background: repeating-linear-gradient(90deg, var(--spark) 0 8px, transparent 8px 16px);
          opacity: 0.55; z-index: 0;
        }
        .nv-legs { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3,1fr); gap: 2.4rem; }
        .nv-leg { background: #fff; border: 1px solid var(--parchment-2); border-radius: 20px; padding: 2.2rem 1.9rem; }
        .nv-leg .leg-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; color: var(--gold); text-transform: uppercase; }
        .nv-leg .leg-icon { width: 52px; height: 52px; border-radius: 14px; display: grid; place-items: center; background: linear-gradient(145deg,#D1FAE5,#A7F3D0); color: var(--spark-deep); margin: 14px 0 18px; }
        .nv-leg h3 { font-family: 'Fraunces', serif; font-size: 1.3rem; font-weight: 600; margin: 0 0 10px; color: var(--ink); }
        .nv-leg p { color: var(--ink-soft); font-size: 0.96rem; line-height: 1.55; margin: 0; }

        /* ---------- LIVE OPS PREVIEW ---------- */
        .nv-ops {
          padding: 6rem 6vw 7.5rem;
          background: radial-gradient(120% 100% at 50% 0%, #0B3D2C 0%, var(--char) 60%, #06231A 100%);
          position: relative;
        }
        .nv-ops .nv-section-head h2 { color: var(--parchment); }
        .nv-ops .nv-section-head p { color: #A9D6C3; }
        .nv-ops-panel {
          max-width: 1080px; margin: 0 auto; border-radius: 20px; overflow: hidden;
          box-shadow: var(--shadow-deep);
        }
        .nv-ops-chrome {
          display: flex; align-items: center; gap: 7px;
          padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .nv-ops-chrome .dot { width: 9px; height: 9px; border-radius: 50%; }
        .nv-ops-chrome .dot.r { background: #E8604A; }
        .nv-ops-chrome .dot.y { background: #34D399; }
        .nv-ops-chrome .dot.g { background: #0D9488; }
        .nv-ops-chrome-label { margin-left: 12px; font-size: 0.74rem; color: #8FCDB2; letter-spacing: 0.02em; }
        .nv-ops-body { display: grid; grid-template-columns: 1.5fr 1fr; gap: 0; }
        .nv-ops-feed { padding: 1.6rem 1.8rem; border-right: 1px solid rgba(255,255,255,0.08); }
        .nv-ops-feed-head { display: flex; align-items: center; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; color: #8FCDB2; margin-bottom: 1.1rem; }
        .live-dot { display: inline-flex; align-items: center; gap: 6px; color: var(--sage); }
        .live-dot .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--sage); animation: pulseDot 1.8s infinite; }
        .nv-ops-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .nv-ops-row:last-child { border-bottom: none; }
        .nv-ops-row-icon { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex-shrink: 0; }
        .nv-ops-row-icon.spark { background: rgba(16,185,129,0.14); color: var(--spark); }
        .nv-ops-row-icon.gold { background: rgba(52,211,153,0.14); color: var(--gold); }
        .nv-ops-row-icon.sage { background: rgba(13,148,136,0.14); color: var(--sage); }
        .nv-ops-row-text { flex: 1; font-size: 0.86rem; color: #D6F0E4; line-height: 1.4; }
        .nv-ops-row-tag { font-family: 'IBM Plex Mono', monospace; font-size: 0.66rem; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; flex-shrink: 0; }
        .nv-ops-row-tag.spark { background: rgba(16,185,129,0.14); color: var(--spark); }
        .nv-ops-row-tag.gold { background: rgba(52,211,153,0.14); color: var(--gold); }
        .nv-ops-row-tag.sage { background: rgba(13,148,136,0.14); color: var(--sage); }
        .nv-ops-side { padding: 1.6rem 1.8rem; display: flex; flex-direction: column; gap: 1rem; }
        .nv-ops-stat { display: flex; align-items: center; gap: 10px; color: var(--gold); }
        .nv-ops-stat .num { font-size: 1.1rem; font-weight: 600; color: var(--parchment); line-height: 1.1; }
        .nv-ops-stat .lbl { font-size: 0.74rem; color: #8FCDB2; margin-top: 2px; }
        .nv-ops-chart { padding-top: 0.4rem; }
        .nv-ops-chart-head { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: #8FCDB2; margin-bottom: 10px; }
        .nv-ops-bars { display: flex; align-items: flex-end; gap: 6px; height: 64px; }
        .nv-ops-bars span { flex: 1; background: linear-gradient(180deg, var(--gold), var(--spark-deep)); border-radius: 3px; transform-origin: bottom; }
        .nv-ops-notif { display: flex; align-items: center; gap: 9px; margin-top: 0.4rem; padding: 10px 12px; border-radius: 10px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2); color: var(--gold); font-size: 0.78rem; }
        @media (max-width: 780px) {
          .nv-ops-body { grid-template-columns: 1fr; }
          .nv-ops-feed { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
        }

        .nv-feed { background: var(--char); padding: 7rem 6vw; }
        .nv-feed .nv-section-head h2 { color: var(--parchment); }
        .nv-feed .nv-section-head p { color: #A9D6C3; }
        .nv-feed-grid { max-width: 1180px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 1.8rem; }
        .nv-tilt-card { position: relative; transform-style: preserve-3d; }
        .nv-tilt-glow { position: absolute; inset: 0; z-index: 1; border-radius: 18px; pointer-events: none; }
        .nv-card2 { position: relative; z-index: 2; background: var(--char-2); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; height: 100%; }
        .nv-card2-media { height: 130px; display: grid; place-items: center; background: linear-gradient(135deg, var(--char-3), var(--char-2)); color: var(--gold); position: relative; }
        .nv-card2-media::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 30% 20%, rgba(16,185,129,0.18), transparent 60%); }
        .nv-card2-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .nv-card2 h4 { font-family: 'Fraunces', serif; color: var(--parchment); font-size: 1.1rem; margin: 0; font-weight: 600; }
        .nv-card2 p.desc { color: #A9D6C3; font-size: 0.9rem; line-height: 1.55; margin: 0; flex: 1; }
        .nv-card2 .place { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #8FCDB2; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
        .countdown-chip { display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 0.76rem; font-weight: 600; color: var(--gold); background: rgba(52,211,153,0.1); padding: 6px 10px; border-radius: 8px; width: fit-content; }
        .countdown-chip.urgent { color: #10B981; background: rgba(16,185,129,0.14); }

        .nv-split { display: grid; grid-template-columns: 1fr 1fr; }
        .nv-split-panel { padding: 6rem 4.5vw; }
        .nv-split-panel.giver { background: var(--parchment); }
        .nv-split-panel.ngo { background: var(--ink); color: var(--parchment); }
        .nv-split-panel .panel-icon { width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; margin-bottom: 1.6rem; }
        .nv-split-panel.giver .panel-icon { background: linear-gradient(145deg,#D1FAE5,#A7F3D0); color: var(--spark-deep); }
        .nv-split-panel.ngo .panel-icon { background: rgba(13,148,136,0.16); color: var(--sage); }
        .nv-split-panel h3 { font-family: 'Fraunces', serif; font-size: clamp(1.6rem,2.6vw,2.1rem); font-weight: 600; margin: 0 0 1rem; }
        .nv-split-panel p.copy { line-height: 1.65; margin-bottom: 1.8rem; max-width: 460px; }
        .nv-split-panel.giver p.copy { color: var(--ink-soft); }
        .nv-split-panel.ngo p.copy { color: #BFE3D3; }
        .nv-split-list { list-style: none; padding: 0; margin: 0 0 2.2rem; display: flex; flex-direction: column; gap: 12px; max-width: 460px; }
        .nv-split-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 0.95rem; line-height: 1.5; }
        .nv-split-panel.giver .nv-split-list li .bullet { color: var(--spark); }
        .nv-split-panel.ngo .nv-split-list li .bullet { color: var(--sage); }
        .nv-split-list li .bullet { flex-shrink: 0; margin-top: 3px; }

        .nv-notes { padding: 7rem 6vw; background: var(--parchment); }
        .nv-notes-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; }
        .nv-note { background: #FFFFFF; border: 1px solid var(--parchment-2); border-radius: 4px 4px 16px 16px; padding: 2rem 1.7rem; box-shadow: 0 16px 30px rgba(11,43,33,0.06); position: relative; }
        .nv-note .tape { position: absolute; top: -10px; left: 50%; transform: translateX(-50%) rotate(-2deg); width: 54px; height: 20px; background: rgba(52,211,153,0.35); border: 1px solid rgba(52,211,153,0.5); }
        .nv-note-avatar { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 0.95rem; background: linear-gradient(145deg, var(--gold), var(--spark-deep)); color: var(--char); margin-bottom: 14px; }
        .nv-note p.quote { font-size: 0.98rem; line-height: 1.6; color: var(--ink); margin: 0 0 16px; font-style: italic; }
        .nv-note .who { font-size: 0.86rem; color: var(--ink-soft); font-weight: 600; }
        .nv-note .role { font-size: 0.8rem; color: var(--spark-deep); }

        .nv-banner { position: relative; background: linear-gradient(120deg, var(--spark-deep), var(--spark) 60%, var(--gold)); padding: 5.5rem 6vw; text-align: center; overflow: hidden; }
        .nv-banner h2 { font-family: 'Fraunces', serif; font-size: clamp(2rem,4vw,3rem); font-weight: 600; color: #06231A; margin: 0 0 1.4rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .nv-banner p { color: rgba(6,35,26,0.72); font-size: 1.05rem; margin-bottom: 2.2rem; }
        .nv-banner .nv-btn.spark { background: var(--char); box-shadow: 0 14px 30px rgba(0,0,0,0.25); }

        @media (max-width: 900px) {
          .nv-legs-connector { display: none; }
          .nv-legs { grid-template-columns: 1fr; }
          .nv-feed-grid { grid-template-columns: 1fr; }
          .nv-returns-grid { grid-template-columns: 1fr; }
          .nv-split { grid-template-columns: 1fr; }
          .nv-notes-grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nv-mesh, .nv-hero-spotlight { display: none; }
        }

        /* ---------- mobile performance: heavy blur/backdrop-filter is the
           #1 cause of janky, "slow-feeling" scroll on phones. Cut the
           radii and layer count down here so compositing stays cheap. ---------- */
        @media (max-width: 720px) {
          .nv-landing .nv-nav, .nv-landing .nv-nav.scrolled { backdrop-filter: blur(7px) saturate(140%); -webkit-backdrop-filter: blur(7px) saturate(140%); }
          .nv-blob { filter: blur(36px); opacity: 0.28; }
          .nv-blob-1, .nv-blob-2 { width: 260px; height: 260px; }
          .nv-blob-3 { width: 190px; height: 190px; }
          .nv-grain { opacity: 0.035; }
          .nv-glass { backdrop-filter: blur(10px) saturate(130%); -webkit-backdrop-filter: blur(10px) saturate(130%); }
          .nv-hero { min-height: auto; padding-top: 2rem; }
          .circle-graphic { width: 240px; height: 240px; }
          .nv-hero-toast { display: none; }
        }
        .nv-mesh, .nv-hero-spotlight, .ember-particle, .circle-graphic { will-change: transform; transform: translateZ(0); }
      `}</style>

      {/* ---------- NAV ---------- */}
      <nav className={`nv-nav ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="nv-brand">
          <Logo size={32} />
          Nirvah
        </Link>
        <div className="nv-links">
          {navLinks.map((l) => <Link key={l.label} to={l.to} className="nav-link">{l.label}</Link>)}
          <Link to="/login" className="nav-login">Log in</Link>
          <Magnetic strength={0.4}>
            <Link to="/signup" className="nv-btn spark sm">Start giving <ArrowRight size={15} /></Link>
          </Magnetic>
        </div>
        <button className="nv-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ background: "var(--char)", padding: "0 6vw", display: "flex", flexDirection: "column", gap: "1rem", overflow: "hidden" }}
          >
            <div style={{ padding: "1.4rem 0 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {navLinks.map((l) => (
                <Link key={l.label} to={l.to} style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <Link to="/login" style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
              <Link to="/signup" className="nv-btn spark sm" style={{ width: "fit-content" }}>Start giving <ArrowRight size={15} /></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- CINEMATIC HERO ---------- */}
      <motion.header
        className="nv-hero"
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      >
        <div className="nv-life-wash" style={{ position: "absolute", inset: 0, zIndex: 0 }} aria-hidden="true" />
        <MeshBlobs />
        <EmberField count={16} />
        <motion.div className="nv-hero-spotlight" style={{ "--sx": useTransform(spotX, (v) => `${v}%`), "--sy": useTransform(spotY, (v) => `${v}%`) }} />
        <div className="nv-grain" />

        <ClickSpark sparkColor="#34D399" sparkCount={10} sparkRadius={22} duration={550} className="nv-hero-inner">
          <motion.span
            className="nv-eyebrow"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="dot" /> Live matching, right now
          </motion.span>

          <h1 className="font-display">
            <SplitHeadline text="Nothing good" delayStart={0.1} />
            <br />
            <SplitHeadline text="should go" delayStart={0.42} />{" "}
            <motion.em
              initial={{ opacity: 0, y: "0.6em" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.62, ease: [0.2, 0.75, 0.15, 1] }}
              style={{ display: "inline-block" }}
            >
              to waste.
            </motion.em>
          </h1>

          <motion.p
            className="lede"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
          >
            Nirvah connects surplus food, clothing and supplies from people who have
            more to neighbours who have less. Matched to a verified NGO in minutes,
            tracked until it is actually delivered.
          </motion.p>

          <motion.div
            className="nv-hero-ctas"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0 }}
          >
            <Magnetic strength={0.3}>
              <Link to="/signup?role=donor" className="nv-btn spark">I am a giver <ArrowRight size={17} /></Link>
            </Magnetic>
            <Magnetic strength={0.3}>
              <Link to="/signup?role=ngo" className="nv-btn ghost-dark">I am an NGO <ArrowRight size={17} /></Link>
            </Magnetic>
          </motion.div>

          <motion.div
            className="nv-hero-graphic-wrap"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <HeroToast side="left" offset={0} />
            <CircleGraphic parallaxX={parallaxX} parallaxY={parallaxY} />
            <HeroToast side="right" offset={2} />
          </motion.div>
        </ClickSpark>

        <div className="nv-ticker-wrap">
          <Marquee speed={70}>
            {RELAY_EVENTS.map((msg, i) => (
              <span className="nv-ticker-item" key={i}>
                <Flame size={13} className="flame-ico" /> {msg} <span className="sep">•</span>
              </span>
            ))}
          </Marquee>
        </div>
      </motion.header>

      {/* ---------- BEFORE YOU THROW IT AWAY ---------- */}
      <section className="nv-hook" id="before">
        <motion.div className="nv-hook-inner" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
          <h2 className="font-display">Before you throw it away&hellip;</h2>
          <p className="nv-hook-ask">Could someone else use this?</p>
          <p className="sub">Because sometimes the difference between waste and worth is simply finding the right person.</p>
          <div className="nv-hook-tags">
            <span>That old laptop</span>
            <span>Clothes you haven't worn in months</span>
            <span>Books you no longer open</span>
            <span>Food that won't be used</span>
          </div>
          <Magnetic strength={0.3}>
            <Link to="/browse" className="nv-btn spark"><Search size={16} /> Find someone who needs it</Link>
          </Magnetic>
        </motion.div>
      </section>

      {/* ---------- TRUST BAR ---------- */}
      <section className="nv-trust">
        <div className="nv-trust-grid">
          <div className="nv-trust-item">
            <ShieldCheck size={18} />
            <span>Every NGO manually verified before it can claim</span>
          </div>
          <div className="nv-trust-item">
            <Lock size={18} />
            <span>Nothing sold, nothing warehoused, direct handoff only</span>
          </div>
          <div className="nv-trust-item">
            <Activity size={18} />
            <span>Every listing tracked from post to confirmed delivery</span>
          </div>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section className="nv-how" id="how">
        <motion.div className="nv-section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
          <span className="nv-kicker">The full circle, in three steps</span>
          <h2 className="font-display">From your shelf to their table</h2>
          <p>No warehouses, no waiting lists. Nirvah is built for the gap between "we have extra" and "someone needs it right now."</p>
        </motion.div>
        <div className="nv-legs-wrap">
          <motion.div
            className="nv-legs-connector"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1], delay: 0.2 }}
            aria-hidden="true"
          />
          <motion.div className="nv-legs" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.14 }} variants={staggerParent}>
          <motion.div className="nv-leg" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 22px 40px rgba(11,43,33,0.1)" }} transition={{ duration: 0.25 }}>
            <span className="leg-tag">Step one</span>
            <div className="leg-icon"><PackagePlus size={24} /></div>
            <h3>List what you have</h3>
            <p>Snap a photo, pick a category and drop a pin. Perishable food gets an automatic expiry countdown so timing is never a guess.</p>
          </motion.div>
          <motion.div className="nv-leg" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 22px 40px rgba(11,43,33,0.1)" }} transition={{ duration: 0.25 }}>
            <span className="leg-tag">Step two</span>
            <div className="leg-icon"><Radar size={24} /></div>
            <h3>Get matched instantly</h3>
            <p>Nearby verified NGOs see your listing the moment it goes live, ranked by distance and need. No cold calls, no phone trees.</p>
          </motion.div>
          <motion.div className="nv-leg" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 22px 40px rgba(11,43,33,0.1)" }} transition={{ duration: 0.25 }}>
            <span className="leg-tag">Step three</span>
            <div className="leg-icon"><HeartHandshake size={24} /></div>
            <h3>Watch it get delivered</h3>
            <p>An NGO claims it, picks it up and delivers it. You see the handoff through: a name, a place, a reason it mattered.</p>
          </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------- LIVE OPS PREVIEW ---------- */}
      <section className="nv-ops">
        <motion.div className="nv-section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
          <span className="nv-kicker">Behind every row, someone waiting</span>
          <h2 className="font-display">This is what fighting waste and hunger looks like</h2>
          <p>Every donation on Nirvah is moving toward a family, a shelter or a classroom that needs it today. Here is what that looks like, happening live.</p>
        </motion.div>

        <motion.div
          className="nv-ops-panel nv-glass"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.14 }}
          transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="nv-ops-chrome">
            <span className="dot r" /><span className="dot y" /><span className="dot g" />
            <span className="nv-ops-chrome-label font-mono">nirvah.org / today's impact / live</span>
          </div>

          <div className="nv-ops-body">
            <div className="nv-ops-feed">
              <div className="nv-ops-feed-head">
                <span>Happening right now</span>
                <span className="live-dot">
                  <span className="pulse" /> Live
                </span>
              </div>
              {[
                { icon: PackagePlus, text: "Green Leaf Kitchen listed 40 meals, still warm", tag: "New", tone: "spark" },
                { icon: Radar, text: "Asha Foundation matched with a family in Whitefield", tag: "Matched", tone: "gold" },
                { icon: CheckCircle2, text: "Notebooks reached Lakeview's students today", tag: "Delivered", tone: "sage" },
              ].map((row, i) => (
                <motion.div
                  className="nv-ops-row"
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                >
                  <span className={`nv-ops-row-icon ${row.tone}`}><row.icon size={15} /></span>
                  <span className="nv-ops-row-text">{row.text}</span>
                  <span className={`nv-ops-row-tag ${row.tone}`}>{row.tag}</span>
                </motion.div>
              ))}
            </div>

            <div className="nv-ops-side">
              <div className="nv-ops-stat">
                <Zap size={16} />
                <div>
                  <div className="num font-mono">18 min</div>
                  <div className="lbl">avg. time someone waits</div>
                </div>
              </div>
              <div className="nv-ops-stat">
                <ShieldCheck size={16} />
                <div>
                  <div className="num font-mono">340+</div>
                  <div className="lbl">verified NGOs on the ground</div>
                </div>
              </div>
              <div className="nv-ops-chart">
                <div className="nv-ops-chart-head">
                  <BarChart3 size={14} /> <span>Given away this week</span>
                </div>
                <div className="nv-ops-bars">
                  {[38, 52, 44, 68, 60, 82, 71].map((h, i) => (
                    <motion.span
                      key={i}
                      style={{ height: `${h}%` }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 + i * 0.05, ease: "easeOut" }}
                    />
                  ))}
                </div>
              </div>
              <div className="nv-ops-notif">
                <Bell size={14} />
                <span>Reminder: tonight's dinner pickup closes in 42 min</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------- LIVE FEED ---------- */}
      <section className="nv-feed" id="feed">
        <motion.div className="nv-section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
          <span className="nv-kicker">Happening on Nirvah right now</span>
          <h2 className="font-display">A few things waiting for a match</h2>
          <p>A live style preview of what is currently listed on the network. Real listings look exactly like this.</p>
        </motion.div>
        <motion.div className="nv-feed-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={staggerParent}>
          {DONATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <motion.div key={d.id} variants={fadeUp}>
                <TiltCard maxTilt={6}>
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
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ---------- SPLIT: GIVER / NGO ---------- */}
      <section className="nv-split" id="split">
        <div className="nv-split-panel giver">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
            <div className="panel-icon"><Sparkles size={26} /></div>
            <h3 className="font-display">For givers</h3>
            <p className="copy">Whatever is in surplus, a kitchen's evening extras, a closet clearout, last term's supplies, takes minutes to list and finds a real recipient instead of a landfill.</p>
            <ul className="nv-split-list">
              <li><span className="bullet">◆</span> List in under two minutes, no approval wait</li>
              <li><span className="bullet">◆</span> Automatic urgency countdowns for perishables</li>
              <li><span className="bullet">◆</span> See exactly which NGO claimed your donation</li>
            </ul>
            <Magnetic strength={0.3}>
              <Link to="/signup?role=donor" className="nv-btn spark">Become a giver <ArrowRight size={16} /></Link>
            </Magnetic>
          </motion.div>
        </div>
        <div className="nv-split-panel ngo">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
            <div className="panel-icon"><Users2 size={26} /></div>
            <h3 className="font-display">For NGOs</h3>
            <p className="copy">Stop chasing leads. Verified organisations get a live feed of nearby donations, filterable by category and distance, so your team spends time delivering, not searching.</p>
            <ul className="nv-split-list">
              <li><span className="bullet">◆</span> Live alerts for listings near your service area</li>
              <li><span className="bullet">◆</span> Single tap claim, with the giver notified immediately</li>
              <li><span className="bullet">◆</span> A dashboard of everything your org has delivered</li>
            </ul>
            <Magnetic strength={0.3}>
              <Link to="/signup?role=ngo" className="nv-btn sage">Register your NGO <ArrowRight size={16} /></Link>
            </Magnetic>
          </motion.div>
        </div>
      </section>

      {/* ---------- THREE RETURNS ---------- */}
      <section className="nv-returns" id="returns">
        <motion.div className="nv-section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
          <span className="nv-kicker">What you get back</span>
          <h2 className="font-display">Some returns can't be deposited into a bank account. They stay with people.</h2>
          <p>Giving on Nirvah pays back in three ways, none of them measured in rupees.</p>
        </motion.div>
        <motion.div className="nv-returns-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={staggerParent}>
          <motion.div className="nv-return-card" variants={fadeUp}>
            <span className="nv-return-tag">Return 01</span>
            <div className="nv-return-icon"><HeartHandshake size={22} /></div>
            <h3>Human return</h3>
            <p>You helped someone. Not a statistic, but a name, a place and a reason it mattered.</p>
          </motion.div>
          <motion.div className="nv-return-card" variants={fadeUp}>
            <span className="nv-return-tag">Return 02</span>
            <div className="nv-return-icon"><Leaf size={22} /></div>
            <h3>Environmental return</h3>
            <p>You kept something useful from becoming waste, and gave it a second life instead.</p>
          </motion.div>
          <motion.div className="nv-return-card" variants={fadeUp}>
            <span className="nv-return-tag">Return 03</span>
            <div className="nv-return-icon"><FileText size={22} /></div>
            <h3>Practical return</h3>
            <p>You can see exactly what you gave, who received it and when. Every donation keeps its own record.</p>
            <Link to="/dashboard/donor" className="see-more">View my giving <ArrowRight size={14} /></Link>
          </motion.div>
        </motion.div>
        <p className="nv-returns-close">"Doing good shouldn't mean losing track of what you gave."</p>
      </section>

      {/* ---------- TESTIMONIALS ---------- */}
      <section className="nv-notes">
        <motion.div className="nv-section-head" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
          <span className="nv-kicker">Notes from the network</span>
          <h2 className="font-display">People who have passed it on</h2>
        </motion.div>
        <motion.div className="nv-notes-grid" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={staggerParent}>
          {[
            { initials: "SJ", quote: "I listed our restaurant's evening surplus at 9pm and it was claimed before we had finished closing up. Genuinely did not expect it to be that fast.", who: "Sarah Johnson", role: "Giver, Bengaluru", rotate: 0.8 },
            { initials: "MB", quote: "We used to spend hours cold calling donors. Now listings come to us, sorted by distance, the moment they go up.", who: "Michael Brown", role: "NGO Coordinator, Asha Foundation", rotate: -0.6 },
            { initials: "LM", quote: "The countdown on perishable listings changed everything for us. We know exactly what needs picking up first.", who: "Lisa Miller", role: "Volunteer Lead", rotate: -0.3 },
          ].map((t) => (
            <motion.div
              key={t.who}
              variants={fadeUp}
              className="nv-note"
              style={{ rotate: t.rotate }}
              whileHover={{ y: -6, rotate: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="tape" />
              <div className="nv-note-avatar">{t.initials}</div>
              <p className="quote">"{t.quote}"</p>
              <div className="who">{t.who}</div>
              <div className="role">{t.role}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------- CTA BANNER ---------- */}
      <section className="nv-banner">
        <ClickSpark sparkColor="#06231A" sparkCount={9} sparkRadius={20} duration={480}>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} variants={fadeUp}>
            <h2 className="font-display">Your surplus is someone's tonight.</h2>
            <p>Free to join. Takes two minutes. The next circle starts with you.</p>
            <Magnetic strength={0.3}>
              <Link to="/signup" className="nv-btn spark">Get started, it is free <ArrowRight size={17} /></Link>
            </Magnetic>
          </motion.div>
        </ClickSpark>
      </section>

      {/* ---------- FOOTER ---------- */}
      <PageFooter />
    </div>
  );
}
