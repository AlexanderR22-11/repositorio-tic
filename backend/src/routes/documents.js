// backend/src/routes/documents.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../config/db.js"; // <-- IMPORT CORRECTO: named export 'pool'

const router = express.Router();

// Asegúrate de que la carpeta uploads exista
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
    cb(null, unique);
  },
});
const upload = multer({ storage });

// POST /api/documents
// Espera multipart/form-data con campo 'file' y opcionales: titulo, autor, fecha_publicacion, thumbnail, created_by
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Verificar que pool esté definido
    console.log("[POST /api/documents] pool ok:", !!pool);

    console.log("[POST /api/documents] req.file:", req.file ? req.file.filename : null);
    console.log("[POST /api/documents] req.body:", req.body);

    const file = req.file;
    const {
      titulo,
      autor,
      fecha_publicacion, // formato YYYY-MM-DD opcional
      thumbnail, // opcional (url o nombre)
      created_by, // opcional: id del usuario que sube
    } = req.body;

    // Si tu API permite guardar solo metadatos sin archivo, maneja ese caso:
    if (!file && !titulo) {
      return res.status(400).json({ message: "Se requiere archivo o título" });
    }

    // Construir valores para INSERT
    const archivo_url = file ? `/uploads/${file.filename}` : null;
    const tituloFinal = titulo || (file ? file.originalname : "Sin título");
    const autorFinal = autor || null;
    const thumbnailFinal = thumbnail || null;
    const createdByFinal = created_by ? Number(created_by) : null;

    // Inserción en la tabla documentos (ajusta nombres si tu tabla tiene otro schema)
    const sql = `
      INSERT INTO documentos
        (titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [tituloFinal, autorFinal, fecha_publicacion || null, thumbnailFinal, archivo_url, createdByFinal];

    const [result] = await pool.query(sql, params);
    console.log("[POST /api/documents] Insert result:", result);

    // Responder con el registro creado
    return res.status(201).json({
      id: result.insertId,
      titulo: tituloFinal,
      autor: autorFinal,
      fecha_publicacion: fecha_publicacion || null,
      thumbnail: thumbnailFinal,
      archivo_url,
      created_by: createdByFinal,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("[POST /api/documents] error:", err.stack || err);

    // Si ocurrió un error y se subió un archivo, eliminarlo para no dejar basura
    if (req.file) {
      try {
        fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename));
        console.log("[POST /api/documents] archivo eliminado por error:", req.file.filename);
      } catch (unlinkErr) {
        console.error("[POST /api/documents] error al eliminar archivo tras fallo:", unlinkErr);
      }
    }

    return res.status(500).json({ message: "Error al guardar documento", error: err.message });
  }
});

export default router;
