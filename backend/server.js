import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import donationRoutes from "./routes/donations.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "nirvah-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Nirvah backend running on port ${PORT}`));
