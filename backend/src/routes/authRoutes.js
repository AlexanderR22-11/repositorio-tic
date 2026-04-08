// src/routes/authRoutes.js
import express from "express";
import { registerPublic, registerTeacher, login } from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Registro público (alumnos)
router.post("/register", registerPublic);

// Registro de maestros (protegido, ejemplo: solo superadmin)
router.post("/register-teacher", requireAuth, requireRole("superadmin"), registerTeacher);

// Login
router.post("/login", login);

export default router;
