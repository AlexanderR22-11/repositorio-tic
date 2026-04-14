// backend/src/routes/adminRoutes.js
import express from "express";
import multer from "multer";

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

import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

// Multer config (usa uploads/ por defecto; ajusta storage si usas otro middleware)
const upload = multer({ dest: "uploads/" });

/*
  BACKUP / RESTORE / EXPORT / REPORT ROUTES
*/
router.post("/backup", authenticate, authorize(["admin", "superadmin"]), backupNow);
router.get("/backup/download", authenticate, authorize(["admin", "superadmin"]), downloadBackup);
router.post("/restore", authenticate, authorize(["admin", "superadmin"]), upload.single("file"), restoreNow);
router.post("/backup/schedule", authenticate, authorize(["admin", "superadmin"]), programarRespaldo);
router.post("/backup/stop", authenticate, authorize(["admin", "superadmin"]), detenerRespaldoProgramado);

router.get("/export/csv", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosCSV);
router.get("/export/json", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosJSON);

router.get("/report/pdf", authenticate, authorize(["admin", "superadmin", "maestro", "alumno"]), generarReportePDF);

/*
  DOCUMENTS MANAGEMENT (Admin / Maestro)
  Rutas:
    POST   /api/admin/documents           -> subir/crear documento (multipart/form-data, campo 'file')
    GET    /api/admin/documents           -> listar documentos (filtros opcionales)
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

// Listar documentos (con filtros: category_id, page, limit, q, etc.)
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
