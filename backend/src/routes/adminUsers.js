// backend/src/routes/adminUsers.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword
} from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * Middleware: validar resultados de express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok: false, errors: errors.array() });
  }
  next();
};

/**
 * Ping para debug (solo development)
 */
router.get("/ping", (req, res) => res.json({ ok: true, route: "/api/admin/ping" }));

/**
 * Listar usuarios (admin / superadmin)
 */
router.get("/users", authenticate, authorize(["admin", "superadmin"]), getUsers);

/**
 * Obtener usuario por id
 */
router.get(
  "/users/:id",
  authenticate,
  authorize(["admin", "superadmin"]),
  [param("id").isInt().withMessage("Id inválido")],
  validateRequest,
  getUserById
);

/**
 * Crear usuario (admin)
 * body: { nombre, correo, password OR password_hash, role, sanamente_certificado }
 */
router.post(
  "/users",
  authenticate,
  authorize(["admin", "superadmin"]),
  [
    body("nombre").isLength({ min: 2 }).withMessage("Nombre inválido"),
    body("correo").isEmail().withMessage("Correo inválido"),
    body("password")
      .optional({ nullable: true })
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener al menos 8 caracteres"),
    body("password_hash").optional({ nullable: true }).isString(),
    body("role").optional().isIn(["alumno", "maestro", "admin", "superadmin"]).withMessage("Rol inválido"),
    body("sanamente_certificado").optional().isBoolean()
  ],
  validateRequest,
  createUser
);

/**
 * Actualizar usuario (admin)
 * body: { nombre?, correo?, role?, sanamente_certificado? }
 */
router.put(
  "/users/:id",
  authenticate,
  authorize(["admin", "superadmin"]),
  [
    param("id").isInt().withMessage("Id inválido"),
    body("nombre").optional().isLength({ min: 2 }).withMessage("Nombre inválido"),
    body("correo").optional().isEmail().withMessage("Correo inválido"),
    body("role").optional().isIn(["alumno", "maestro", "admin", "superadmin"]).withMessage("Rol inválido"),
    body("sanamente_certificado").optional().isBoolean()
  ],
  validateRequest,
  updateUser
);

/**
 * Cambiar contraseña (admin puede forzar, usuario puede cambiar su propia)
 * body: { currentPassword?, newPassword }
 */
router.put(
  "/users/:id/password",
  authenticate,
  authorize(["admin", "superadmin", "maestro", "alumno"]),
  [
    param("id").isInt().withMessage("Id inválido"),
    body("newPassword").isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
    body("currentPassword").optional().isString()
  ],
  validateRequest,
  changePassword
);

/**
 * Eliminar usuario (admin)
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize(["admin", "superadmin"]),
  [param("id").isInt().withMessage("Id inválido")],
  validateRequest,
  deleteUser
);

export default router;
