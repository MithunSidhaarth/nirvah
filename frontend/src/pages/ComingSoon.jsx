import React from "react";
import DashboardShell from "../components/DashboardShell";

export default function ComingSoon({ role = "donor", title, description }) {
  return (
    <DashboardShell role={role}>
      <div className="nv-topbar">
        <div>
          <h1 className="font-display">{title}</h1>
          <p className="sub">{description}</p>
        </div>
      </div>
      <div className="nv-panel">
        <div className="nv-empty">
          <h3>This page connects to your backend</h3>
          <p>Wire the matching endpoint in <code>src/lib/api.js</code> and this view will fill in automatically.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
