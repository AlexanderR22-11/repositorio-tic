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

// Multer setup (store files in /uploads) con validación básica de tipo y tamaño
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Tipo de archivo no permitido"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// Helper to allow multiple roles (keeps behavior if needed)
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ ok: false, message: "Token requerido" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ ok: false, message: "Permisos insuficientes" });
  return next();
};

// Rutas

// Listar documentos (autenticado)
router.get("/", requireAuth, listDocuments);

// Subir documento: ahora cualquier usuario autenticado puede subir
router.post(
  "/",
  requireAuth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("[multer upload error]", err);
        return res.status(400).json({ ok: false, message: err.message || "Error al procesar archivo" });
      }
      return next();
    });
  },
  uploadDocument
);

// Download file (must be before "/:id")
router.get("/:id/download", requireAuth, downloadDocument);

// Obtener metadatos de un documento
router.get("/:id", requireAuth, getDocument);

// Actualizar documento: cualquier usuario autenticado puede actualizar metadatos o reemplazar archivo
router.put(
  "/:id",
  requireAuth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("[multer update error]", err);
        return res.status(400).json({ ok: false, message: err.message || "Error al procesar archivo" });
      }
      return next();
    });
  },
  updateDocument
);

// Eliminar documento: restringido a superadmin por defecto
router.delete("/:id", requireAuth, allowRoles("superadmin"), deleteDocument);

export default router;
