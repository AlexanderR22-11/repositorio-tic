import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Token requerido" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Token requerido" });
    if (req.user.role !== role) return res.status(403).json({ message: "Permisos insuficientes" });
    return next();
  };
};
// alias para compatibilidad con rutas existentes
export const authenticate = requireAuth;
export const authorize = requireRole;

