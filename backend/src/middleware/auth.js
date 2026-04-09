import jwt from "jsonwebtoken";
import { getJwtSecret } from "../utils/jwt.js";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Token requerido" });
    }

    const userRole = (req.user.role || req.user.rol || "").toLowerCase();
    const isAllowed = allowedRoles.map((r) => String(r).toLowerCase()).includes(userRole);

    if (!isAllowed) {
      return res.status(403).json({ message: "Permisos insuficientes" });
    }

    return next();
  };
};

// alias para compatibilidad con rutas existentes
export const authenticate = requireAuth;
export const authorize = requireRole;
