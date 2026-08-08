import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local disk for now — swap this for S3/Cloudinary/R2 by changing only this
// file and the STORAGE_BASE_URL below; every route just calls upload.single()
// or upload.array() and reads req.file(s).url, so nothing else changes.
export const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB — enough for a scanned document/photo, not a video

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10).replace(/[^a-zA-Z0-9.]/g, "");
    cb(null, `${crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error("Only PDF, JPEG, PNG, or WEBP files are allowed."));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: 5 },
});

// Public URL for a file saved under UPLOAD_DIR, served by the static route
// mounted in server.js. Kept as a helper so the "how do I turn a stored
// filename into a URL" logic lives in exactly one place.
export function fileUrlFor(filename) {
  const base = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
  return `${base}/uploads/${filename}`;
}

// Multer's own errors (file too large, too many files, bad mimetype) come
// through as either a MulterError or the plain Error thrown by fileFilter
// above — normalize both into the same JSON shape as the rest of the API.
export function handleUploadErrors(err, req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError || err.message?.includes("allowed")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}
