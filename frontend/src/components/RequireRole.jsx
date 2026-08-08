import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getStoredRole } from "../lib/api";

// Client-side gate: keeps someone from *seeing* a dashboard their role
// doesn't own (e.g. a donor typing /dashboard/admin into the URL bar).
// This is a UX/UI convenience, not the real security boundary — every
// route that matters is enforced again on the backend (requireAuth /
// requireRole in middleware/admin.js), so this failing open is never
// actually a hole: the API calls the page makes would still 401/403.
function homeFor(role) {
  if (role === "admin" || role === "manager") return "/dashboard/admin";
  if (role === "ngo") return "/dashboard/ngo";
  if (role === "donor") return "/dashboard/donor";
  return "/login";
}

export default function RequireRole({ roles, children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;

  const role = getStoredRole();
  if (!roles.includes(role)) return <Navigate to={homeFor(role)} replace />;

  return children;
}
