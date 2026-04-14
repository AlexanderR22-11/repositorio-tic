// backend/src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  // permitir tipos comunes; ajusta según necesites
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "image/png",
    "image/jpeg",
    "image/jpg"
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Tipo de archivo no permitido"), false);
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}).single("file");
