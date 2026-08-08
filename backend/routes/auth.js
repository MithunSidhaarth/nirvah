import { Router } from "express";
import bcrypt from "bcryptjs";
import db from "../db/index.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const router = Router();

function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

router.post("/signup", async (req, res) => {
  const { role, name, org, email, password, city } = req.body || {};
  if (!role || !name || !email || !password || !city) {
    return res.status(400).json({ error: "Please fill in every field." });
  }
  if (!["donor", "ngo"].includes(role)) {
    return res.status(400).json({ error: "Role must be either donor or ngo." });
  }
  if (role === "ngo" && !org) {
    return res.status(400).json({ error: "Please include your organisation's name." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with that email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (role, name, org, email, password_hash, city) VALUES (?, ?, ?, ?, ?, ?)")
    .run(role, name, org || null, email, passwordHash, city);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Please enter your email and password." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "We could not find an account with that email." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "That password does not match." });

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

export default router;
