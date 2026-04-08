// server.js
import "dotenv/config";
import express from "express";
import path from "path";
import morgan from "morgan";
import cors from "cors";

import documentRoutes from "./src/routes/documentRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Middlewares
app.use(morgan("dev"));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde /uploads
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Montar rutas
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true }));

// 404 para rutas bajo /api
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Endpoint no encontrado" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Error interno del servidor",
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
});

// Arranque
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT} (NODE_ENV=${process.env.NODE_ENV || "development"})`);
});
