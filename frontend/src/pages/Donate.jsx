import React from "react";
import { Link } from "react-router-dom";
import {
  Landmark, Gift, ArrowRight, ShieldCheck, ReceiptText, QrCode,
  Camera, Timer, HandHeart,
} from "lucide-react";
import { PageNav, PageFooter } from "../components/PageChrome";
import Reveal from "../components/Reveal";
import "../styles/tokens.css";

/* ---------------------------------------------------------
   /donate — the fork in the road. Every visitor picks one of
   two equally-weighted paths: give money straight to a
   verified NGO, or list goods so an NGO nearby can claim them.
   Neither column is the "default" — same size, same visual
   weight, same depth of copy.
--------------------------------------------------------- */

export default function Donate() {
  return (
    <div className="nv-app" style={{ minHeight: "100vh" }}>
      <style>{`
        .dn-hero {
          padding: 4.5rem 6vw 3rem; text-align: center;
          background: radial-gradient(120% 100% at 50% -10%, var(--char-2) 0%, var(--char) 60%, #06231A 100%);
          color: var(--parchment);
        }
        .dn-hero h1 { font-family: 'Fraunces', serif; font-size: clamp(2rem, 4vw, 2.8rem); margin: 0 0 0.8rem; }
        .dn-hero p { color: #BFE3D3; max-width: 560px; margin: 0 auto; line-height: 1.6; }

        .dn-section { max-width: 1080px; margin: -2.2rem auto 0; padding: 0 6vw 5rem; position: relative; z-index: 2; }
        .dn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6rem; align-items: stretch; }

        .dn-card {
          background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft); padding: 2.2rem; display: flex; flex-direction: column;
          height: 100%;
        }
        .dn-icn { width: 50px; height: 50px; border-radius: 13px; display: grid; place-items: center; margin-bottom: 1.1rem; }
        .dn-icn.money { background: rgba(212,175,55,0.14); color: var(--gold); }
        .dn-icn.items { background: rgba(16,185,129,0.12); color: var(--spark-deep); }
        .dn-card h2 { font-family: 'Fraunces', serif; font-size: 1.5rem; margin: 0 0 0.5rem; }
        .dn-card > p.dn-lede { color: var(--ink-soft); line-height: 1.6; margin: 0 0 1.4rem; font-size: 0.95rem; }

        .dn-points { list-style: none; margin: 0 0 1.6rem; padding: 0; display: grid; gap: 0.7rem; flex: 1; }
        .dn-points li { display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: var(--ink); line-height: 1.5; }
        .dn-points svg { flex-shrink: 0; margin-top: 2px; color: var(--sage-deep); }

        .dn-cta { width: 100%; justify-content: center; }

        @media (max-width: 780px) { .dn-grid { grid-template-columns: 1fr; } }
      `}</style>

      <PageNav active="Donate" />

      <header className="dn-hero">
        <h1>Two ways to give — pick what you have</h1>
        <p>
          Give money directly to a verified NGO, or list goods you no longer need so an NGO
          nearby can claim them. Both take just a couple of minutes.
        </p>
      </header>

      <section className="dn-section">
        <div className="dn-grid">
          {/* ---- Column 1: monetary ---- */}
          <Reveal className="dn-card">
            <div className="dn-icn money"><Landmark size={24} /></div>
            <h2>Give money</h2>
            <p className="dn-lede">
              Pick a verified NGO and pay them directly by bank transfer, UPI, or QR code —
              Nirvah never touches the money. Send us proof of the payment and we'll get you
              a proper invoice.
            </p>
            <ul className="dn-points">
              <li><ShieldCheck size={16} /> Every NGO listed is document-verified before it can accept money</li>
              <li><QrCode size={16} /> Pay straight to their account or scan their QR — no middleman</li>
              <li><ReceiptText size={16} /> Send a screenshot of the payment and get a real invoice by email</li>
            </ul>
            <Link to="/donate-money" className="nv-btn sage dn-cta">
              See verified NGOs to pay <ArrowRight size={15} />
            </Link>
          </Reveal>

          {/* ---- Column 2: in-kind / items ---- */}
          <Reveal className="dn-card">
            <div className="dn-icn items"><Gift size={24} /></div>
            <h2>Give items</h2>
            <p className="dn-lede">
              Got food, clothes, books, or supplies to give away? List what you have and an
              NGO nearby will claim it. A quick login and you can have it up in under a
              minute.
            </p>
            <ul className="dn-points">
              <li><Timer size={16} /> Quick login, then list — most givers are done in under a minute</li>
              <li><Camera size={16} /> Add a photo and a pickup spot, that's really all it takes</li>
              <li><HandHeart size={16} /> A verified NGO nearby claims it and coordinates pickup with you</li>
            </ul>
            <Link to="/login?intent=list&next=/dashboard/donor/new" className="nv-btn spark dn-cta">
              Log in & list what you have <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
