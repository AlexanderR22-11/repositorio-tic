// src/routes/adminRoutes.js
import express from "express";
import multer from "multer";
import { backupNow, restoreNow } from "../controllers/backupController.js";
import { exportDocumentosCSV, exportDocumentosJSON } from "../controllers/exportController.js";
import { generarReportePDF } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/backup", authenticate, authorize(["admin", "superadmin"]), backupNow);
router.post("/restore", authenticate, authorize(["admin", "superadmin"]), upload.single("file"), restoreNow);

router.get("/export/csv", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosCSV);
router.get("/export/json", authenticate, authorize(["admin", "superadmin", "maestro"]), exportDocumentosJSON);

router.get("/report/pdf", authenticate, authorize(["admin", "superadmin", "maestro", "alumno"]), generarReportePDF);

export default router;
