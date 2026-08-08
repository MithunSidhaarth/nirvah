import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import {
  LayoutGrid,
  PackagePlus,
  ListChecks,
  Users2,
  Compass,
  Settings,
  LogOut,
  Receipt,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { setToken } from "../lib/api";
import "../styles/tokens.css";
import "../styles/dashboard.css";

const DONOR_LINKS = [
  { label: "Overview", to: "/dashboard/donor", icon: LayoutGrid },
  { label: "Give something", to: "/dashboard/donor/new", icon: PackagePlus },
  { label: "My listings", to: "/dashboard/donor/listings", icon: ListChecks },
  { label: "Tax summary", to: "/dashboard/donor/tax", icon: Receipt },
  { label: "Explore network", to: "/browse", icon: Compass },
];

const NGO_LINKS = [
  { label: "Overview", to: "/dashboard/ngo", icon: LayoutGrid },
  { label: "Browse donations", to: "/browse", icon: Compass },
  { label: "Claimed by us", to: "/dashboard/ngo/claims", icon: ListChecks },
  { label: "CSR summary", to: "/dashboard/ngo/csr", icon: Building2 },
  { label: "Our team", to: "/dashboard/ngo/team", icon: Users2 },
];

const STAFF_LINKS = [
  { label: "Overview", to: "/dashboard/admin", icon: LayoutGrid },
  { label: "Donations & claims", to: "/dashboard/admin/donations", icon: ListChecks },
  { label: "NGO verification", to: "/dashboard/admin/ngos", icon: ShieldCheck },
];

const ROLE_LABEL = { ngo: "NGO account", admin: "Admin account", manager: "Manager account" };

export default function DashboardShell({ role = "donor", user, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isStaff = role === "admin" || role === "manager";
  const links = isStaff ? STAFF_LINKS : role === "ngo" ? NGO_LINKS : DONOR_LINKS;
  const initials = (user?.name || user?.org || "N V")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logout = () => {
    setToken(null);
    navigate("/login");
  };

  return (
    <div className="nv-app nv-dash">
      <aside className="nv-side">
        <Link to="/" className="nv-side-brand">
          <Logo size={28} />
          Nirvah
        </Link>
        <div className="nv-side-role">{ROLE_LABEL[role] || "Giver account"}</div>
        <nav className="nv-side-nav">
          {links.map((l) => {
            const Icon = l.icon;
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} className={`nv-side-link ${active ? `active ${role}` : ""}`}>
                <Icon size={17} /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="nv-side-foot">
          <Link to="/dashboard/settings" className="nv-side-link">
            <Settings size={17} /> Settings
          </Link>
          <div className="nv-side-user">
            <div className="nv-side-avatar">{initials}</div>
            <div>
              <div className="name">{user?.name || user?.org || "Guest"}</div>
              <div className="email">{user?.email || "not connected yet"}</div>
            </div>
          </div>
          <button className="nv-side-logout" onClick={logout}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </aside>
      <main className="nv-main">{children}</main>
    </div>
  );
}
