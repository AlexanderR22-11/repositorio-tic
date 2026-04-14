import "dotenv/config";
import express from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import documentRoutes from "./src/routes/documentRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import adminUsersRoutes from "./src/routes/adminUsers.js"; // <-- nuevo router para /api/admin/users
// Router público que contiene /categories y endpoints públicos (documents públicos)
import publicRoutes from "./src/routes/public.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(morgan("dev"));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

/*
  Orden de montaje de rutas (importante):
  - Primero las rutas públicas que no requieren autenticación (p. ej. /api/categories, /api/documents públicos)
  - Luego las rutas de autenticación y las rutas privadas/admin
*/
app.use("/api", publicRoutes);             // Rutas públicas: /api/categories, /api/documents (públicos)
app.use("/api/auth", authRoutes);          // Auth

// Rutas de documentos (endpoints autenticados para subir, listar y descargar)
app.use("/api/documents", documentRoutes); // Rutas de documentos privadas (subida, descarga, metadata)

// Rutas admin: mantenemos adminRoutes (backup, documentos, etc.) y añadimos adminUsersRoutes
app.use("/api/admin", adminRoutes);        // Rutas admin existentes
app.use("/api/admin", adminUsersRoutes);   // Rutas de gestión de usuarios (POST /api/admin/users, GET /api/admin/users, etc.)

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/*
  DEBUG opcional: listar rutas registradas en consola (descomenta para debug local)
  Nota: no dejar activado en producción.
*/
// console.log("Rutas registradas:");
// app._router.stack
//   .filter(r => r.route)
//   .forEach(r => {
//     const methods = Object.keys(r.route.methods).join(",").toUpperCase();
//     console.log(methods, r.route.path);
//   });

// 404 para /api/* (si no encontró ruta)
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Endpoint no encontrado" });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
});
