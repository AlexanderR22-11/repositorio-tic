// backend/src/routes/userRoutes.js
import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// ejemplo de uso
router.get("/perfil", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// rutas que requieren rol específico
router.post("/crear-maestro", requireAuth, requireRole("superadmin"), (req, res) => {
  // lógica...
});

export default router;
