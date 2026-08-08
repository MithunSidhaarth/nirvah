// Real roles now (see the `admin`/`manager` values added to `user_role` in
// schema.sql) — no more ADMIN_EMAILS allowlist. requireAuth already puts
// the role from the signed JWT on req.userRole, so these are just checks
// against that; no extra DB round trip needed.
//
// requireAdmin  — full sudo: user management (roles, bans, removal), site
//                 settings, document approve/reject, anything else that
//                 changes site state.
// requireStaff  — admin OR manager: the donations/claims/NGO-verification
//                 queues, and — as of the manager-approval change — NGO
//                 verification decisions themselves (POST /ngos/:id/verify
//                 in routes/ngos.js). A manager hitting a route still
//                 guarded by requireAdmin (documents, user management, site
//                 settings) gets a 403, same as a donor or NGO would.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "You don't have access to this." });
    }
    next();
  };
}

export const requireAdmin = requireRole("admin");
export const requireStaff = requireRole("admin", "manager");
