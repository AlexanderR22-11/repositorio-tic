// backend/src/routes/adminRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Controllers
import {
  backupNow,
  restoreNow,
  programarRespaldo,
  downloadBackup,
  detenerRespaldoProgramado
} from "../controllers/backupController.js";
import { exportDocumentosCSV, exportDocumentosJSON } from "../controllers/exportController.js";
import { generarReportePDF } from "../controllers/reportController.js";

import {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument
} from "../controllers/documentController.js";

// Auth middleware
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Filename sanitizer for multer
function sanitizeFilename(name = "") {
  return String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")      // remove diacritics
    .replace(/[^a-zA-Z0-9._-]/g, "_")     // allow only safe chars
    .replace(/_+/g, "_")                  // collapse repeated underscores
    .substring(0, 200);                   // limit length
}

// Multer storage: keep original extension, sanitize filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const original = file.originalname || "file";
    const ext = path.extname(original);
    const base = path.basename(original, ext);
    const safeBase = sanitizeFilename(base);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeBase}${ext}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

/*
  BACKUP / RESTORE / EXPORT / REPORT ROUTES
  - Protected routes use authenticate + authorize middleware.
*/
router.post("/backup", authenticate, authorize(["admin", "superadmin"]), backupNow);
router.get("/backup/download", authenticate, authorize(["admin", "superadmin"]), downloadBackup);
router.post("/restore", authenticate, authorize(["admin", "superadmin"]), upload.single("file"), restoreNow);
router.post("/backup/schedule", authenticate, authorize(["admin", "superadmin"]), programarRespaldo);
router.post("/backup/stop", authenticate, authorize(["admin", "superadmin"]), detenerRespaldoProgramado);

router.get("/export/csv", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosCSV);
router.get("/export/json", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosJSON);

// Report PDF: allow all authenticated roles (admin/maestro/alumno) to request reports
// The controller should handle column names and SQL safely.
router.get("/report/pdf", authenticate, authorize(["admin", "superadmin", "maestro", "alumno"]), generarReportePDF);

/*
  DOCUMENTS MANAGEMENT (Admin / Maestro)
  Routes:
    POST   /api/admin/documents           -> subir/crear documento (multipart/form-data, campo 'file')
    GET    /api/admin/documents           -> listar documents (filtros opcionales)
    GET    /api/admin/documents/:id       -> obtener documento por id
    PUT    /api/admin/documents/:id       -> actualizar documento (puede incluir nuevo file)
    DELETE /api/admin/documents/:id       -> eliminar documento
    GET    /api/admin/documents/:id/download -> descargar archivo (protegido)
*/

// Crear / subir documento (maestro/admin)
router.post(
  "/documents",
  authenticate,
  authorize(["admin", "superadmin", "maestro"]),
  upload.single("file"),
  uploadDocument
);

// Listar documents (con filtros: category_id, page, limit, q, etc.)
router.get(
  "/documents",
  authenticate,
  authorize(["admin", "superadmin", "maestro"]),
  listDocuments
);

// Obtener documento por id
router.get(
  "/documents/:id",
  authenticate,
  authorize(["admin", "superadmin", "maestro"]),
  getDocument
);

// Actualizar documento (opcionalmente con nuevo archivo)
router.put(
  "/documents/:id",
  authenticate,
  authorize(["admin", "superadmin", "maestro"]),
  upload.single("file"),
  updateDocument
);

// Descargar archivo (protegido)
router.get(
  "/documents/:id/download",
  authenticate,
  authorize(["admin", "superadmin", "maestro", "alumno"]),
  downloadDocument
);

// Eliminar documento
router.delete(
  "/documents/:id",
  authenticate,
  authorize(["admin", "superadmin", "maestro"]),
  deleteDocument
);

export default router;
