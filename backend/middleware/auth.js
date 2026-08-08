import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";

export function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "You need to be logged in for this." });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: "Your session has expired. Please log in again." });
  }
}
