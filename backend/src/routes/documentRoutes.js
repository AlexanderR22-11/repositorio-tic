// backend/src/routes/documentRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.js";
import {
  listDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
} from "../controllers/documentController.js";

const router = express.Router();

// Asegúrate de que la carpeta uploads exista
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer setup (store files in /uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage });

// Helper to allow multiple roles
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Token requerido" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Permisos insuficientes" });
  return next();
};

// Rutas
router.get("/", requireAuth, listDocuments);

router.post(
  "/",
  requireAuth,
  allowRoles("maestro", "superadmin"),
  upload.single("file"),
  uploadDocument
);

// Download file (must be before "/:id")
router.get("/:id/download", requireAuth, downloadDocument);

router.get("/:id", requireAuth, getDocument);

router.put(
  "/:id",
  requireAuth,
  allowRoles("maestro", "superadmin"),
  upload.single("file"),
  updateDocument
);

router.delete("/:id", requireAuth, allowRoles("superadmin", "maestro"), deleteDocument);

// Export default para que server.js pueda importarlo como default
export default router;
