import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import Magnetic from "./motion/Magnetic";

/**
 * Shared chrome for every page that isn't the marketing landing (which has
 * its own scroll-linked hero nav). Same visual language — dark bar, gradient
 * logo, pill CTA — so hopping between pages never feels like leaving the site.
 */
const NAV_LINKS = [
  { label: "How it works", to: "/how-it-works" },
  { label: "Explore", to: "/browse" },
  { label: "Donate", to: "/donate" },
  { label: "For NGOs", to: "/for-ngos" },
  { label: "Contact", to: "/contact" },
];

export function PageNav({ active }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="pc-nav-wrap">
      <style>{`
        .pc-nav-wrap { position: sticky; top: 0; z-index: 60; }
        .pc-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.15rem 6vw; background: var(--char);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .pc-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-family: 'Fraunces', serif; font-size: 1.15rem; font-weight: 600; }
        .pc-links { display: flex; align-items: center; gap: 1.8rem; }
        .pc-links a.pc-link { font-size: 0.94rem; font-weight: 500; color: #fff; opacity: 0.78; text-decoration: none; transition: opacity 0.2s ease; }
        .pc-links a.pc-link:hover, .pc-links a.pc-link.active { opacity: 1; color: var(--gold); }
        .pc-links a.pc-login { font-size: 0.94rem; font-weight: 600; color: #fff; text-decoration: none; padding: 9px 16px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.28); transition: all 0.2s ease; }
        .pc-links a.pc-login:hover { border-color: var(--gold); color: var(--gold); background: rgba(52,211,153,0.08); }
        .pc-menu-btn { display: none; background: none; border: none; color: #fff; }
        @media (max-width: 900px) { .pc-links { display: none; } .pc-menu-btn { display: block; } }
      `}</style>

      <nav className="pc-nav">
        <Link to="/" className="pc-brand">
          <Logo size={30} />
          Nirvah
        </Link>
        <div className="pc-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.label} to={l.to} className={`pc-link ${active === l.label ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
          <Link to="/login" className="pc-login">Log in</Link>
          <Magnetic strength={0.4}>
            <Link to="/signup" className="nv-btn spark sm">Start giving <ArrowRight size={15} /></Link>
          </Magnetic>
        </div>
        <button className="pc-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
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
            style={{ background: "var(--char)", padding: "0 6vw", overflow: "hidden" }}
          >
            <div style={{ padding: "1.2rem 0 1.8rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {NAV_LINKS.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)} style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }}>
                  {l.label}
                </Link>
              ))}
              <Link to="/login" style={{ color: "var(--parchment)", textDecoration: "none", fontWeight: 500 }}>Log in</Link>
              <Link to="/signup" className="nv-btn spark sm" style={{ width: "fit-content" }}>Start giving <ArrowRight size={15} /></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FOUNDERS = [
  { name: "Mithun Sidhaarth", href: "https://mithunsidhaarth.in", icon: Globe },
  { name: "Nidhi Sahare", href: "https://www.linkedin.com/in/nidhi-sahare-6688a8331", icon: Linkedin },
  { name: "Pramish Bhusal", href: "https://www.linkedin.com/in/pramish-bhusal-36397b39a/", icon: Linkedin },
];

export function PageFooter() {
  return (
    <footer className="nv-footer" id="footer">
      <style>{`
        .nv-footer { background: var(--char); color: var(--parchment); padding: 5rem 6vw 2.4rem; }
        .nv-footer-grid { max-width: 1200px; margin: 0 auto 3rem; display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 3rem; }
        .nv-footer h5 { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin: 0 0 1.1rem; }
        .nv-footer a, .nv-footer .line { display: flex; align-items: center; gap: 8px; color: #BFE3D3; text-decoration: none; font-size: 0.92rem; margin-bottom: 10px; }
        .nv-footer a:hover { color: var(--gold); }
        .nv-footer-bottom { max-width: 1200px; margin: 0 auto; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 0.8rem; color: #84BEA2; font-family: 'IBM Plex Mono', monospace; }
        @media (max-width: 900px) { .nv-footer-grid { grid-template-columns: 1fr 1fr; gap: 2.2rem; } }
        @media (max-width: 560px) { .nv-footer-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="nv-footer-grid">
        <div>
          <div className="pc-brand" style={{ marginBottom: "1rem" }}>
            <Logo size={30} />
            Nirvah
          </div>
          <p style={{ color: "#8FCDB2", fontSize: "0.92rem", lineHeight: 1.6, maxWidth: 320 }}>
            A network connecting givers and NGOs, so surplus finds its way to
            someone who needs it instead of a bin.
          </p>
        </div>
        <div>
          <h5>Contact</h5>
          <a href="mailto:hello.nirvah@gmail.com"><Mail size={14} /> hello.nirvah@gmail.com</a>
          <a href="tel:+917619249879"><Phone size={14} /> +91 76192 49879</a>
          <div className="line"><MapPin size={14} /> Bengaluru, India</div>
        </div>
        <div>
          <h5>Quick links</h5>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/browse">Explore donations</Link>
          <Link to="/for-ngos">For NGOs</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h5>Founders</h5>
          {FOUNDERS.map((f) => (
            <a key={f.name} href={f.href} target="_blank" rel="noopener noreferrer">
              <f.icon size={14} /> {f.name}
            </a>
          ))}
        </div>
      </div>
      <div className="nv-footer-bottom">
        <span>2026 Nirvah. Made for the cause. Free, always.</span>
        <span>Terms and Privacy</span>
      </div>
    </footer>
  );
}
