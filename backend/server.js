import "dotenv/config";
import express from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import documentRoutes from "./src/routes/documents.js";
import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import adminUsersRoutes from "./src/routes/adminUsers.js";
import publicRoutes from "./src/routes/public.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Si el servidor está detrás de un proxy (nginx, Heroku), habilita trust proxy
app.set("trust proxy", 1);

// Helmet: desactivar COOP que puede bloquear blobs/popups; mantener otras protecciones
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

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

// Servir archivos subidos con opciones seguras
app.use(
  "/uploads",
  express.static(path.resolve(process.cwd(), "uploads"), {
    dotfiles: "deny",
    maxAge: "1d",
    index: false,
  })
);

// Rutas públicas
app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);

// Montar documentRoutes sin requireAuth global.
// Dentro de documentRoutes protegemos solo las rutas que deben exigir autenticación (p. ej. POST /)
app.use("/api/documents", documentRoutes);

// Rutas admin
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUsersRoutes);

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

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
