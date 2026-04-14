import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mime from "mime-types";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

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

// Helper para sanear filename en headers
function safeFilenameForHeader(name) {
  return String(name).replace(/[\r\n"]/g, "_");
}

/*
  RUTA: POST /api/documents
  Protegida: requiere autenticación (solo usuarios autenticados pueden subir)
  Espera multipart/form-data con campo 'file' y opcionales: titulo, descripcion, autor, fecha_publicacion, thumbnail, created_by
*/
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    console.log("[POST /api/documents] pool ok:", !!pool);
    console.log("[POST /api/documents] req.file:", req.file ? req.file.filename : null);
    console.log("[POST /api/documents] req.body:", req.body);

    const file = req.file;
    const {
      titulo,
      descripcion,
      autor,
      fecha_publicacion: fechaBody,
      thumbnail,
      created_by,
    } = req.body;

    if (!file && !titulo) {
      return res.status(400).json({ message: "Se requiere archivo o título" });
    }

    const allowedStatus = ['publicado', 'borrador', 'archivado'];
    let status = req.body.status || 'borrador';
    if (req.user && req.user.role === 'maestro') status = 'publicado';
    if (!allowedStatus.includes(status)) status = 'borrador';

    const fecha_publicacion = status === 'publicado' ? new Date() : (fechaBody || null);

    const savedFileName = file ? file.filename : null;
    const originalFileName = file ? file.originalname : null;
    const mimeType = file ? file.mimetype : null;
    const size = file ? file.size : null;

    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const archivo_url = savedFileName ? `${baseUrl}/uploads/${savedFileName}` : null;

    const tituloFinal = titulo || (file ? originalFileName : "Sin título");
    const descripcionFinal = descripcion || autor || null;
    const thumbnailFinal = thumbnail || null;
    const createdByFinal = created_by ? Number(created_by) : (req.user ? req.user.id : null);

    const sqlExtended = `
      INSERT INTO documents
        (titulo, descripcion, fecha_publicacion, thumbnail, archivo_url, file_name, mime_type, size, created_by, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const paramsExtended = [
      tituloFinal,
      descripcionFinal,
      fecha_publicacion || null,
      thumbnailFinal,
      archivo_url,
      originalFileName,
      mimeType,
      size,
      createdByFinal,
      status
    ];

    try {
      const [result] = await pool.query(sqlExtended, paramsExtended);
      console.log("[POST /api/documents] Insert extended result:", result);
      return res.status(201).json({
        id: result.insertId,
        titulo: tituloFinal,
        descripcion: descripcionFinal,
        fecha_publicacion: fecha_publicacion || null,
        thumbnail: thumbnailFinal,
        archivo_url,
        file_name: originalFileName,
        mime_type: mimeType,
        size,
        created_by: createdByFinal,
        status,
        created_at: new Date()
      });
    } catch (err) {
      if (err && err.code === 'ER_BAD_FIELD_ERROR') {
        console.warn("[POST /api/documents] Extended insert failed, falling back to original insert:", err.message);

        const sqlFallback = `
          INSERT INTO documents
            (titulo, descripcion, fecha_publicacion, thumbnail, archivo_url, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const paramsFallback = [
          tituloFinal,
          descripcionFinal,
          fecha_publicacion || null,
          thumbnailFinal,
          archivo_url,
          createdByFinal
        ];

        const [resultFallback] = await pool.query(sqlFallback, paramsFallback);
        console.log("[POST /api/documents] Insert fallback result:", resultFallback);
        return res.status(201).json({
          id: resultFallback.insertId,
          titulo: tituloFinal,
          descripcion: descripcionFinal,
          fecha_publicacion: fecha_publicacion || null,
          thumbnail: thumbnailFinal,
          archivo_url,
          created_by: createdByFinal,
          created_at: new Date()
        });
      }

      throw err;
    }
  } catch (err) {
    console.error("[POST /api/documents] error:", err.stack || err);

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

/*
  Signed download helpers
  - POST /api/documents/sign-download  -> devuelve URL firmada temporal
  - GET  /api/documents/download/:filename -> valida firma y stream del archivo
  Notes:
  - Estas rutas están montadas sin requireAuth en server.js; si quieres proteger sign-download, añade requireAuth aquí.
  - set process.env.DOWNLOAD_SECRET en .env para producción.
*/

router.post("/sign-download", async (req, res) => {
  try {
    const { filename, ttl = 60 } = req.body;
    if (!filename) return res.status(400).json({ message: "filename required" });

    const expires = Math.floor(Date.now() / 1000) + Number(ttl);
    const secret = process.env.DOWNLOAD_SECRET || "dev-secret";
    const payload = `${filename}|${expires}`;
    const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/documents/download/${encodeURIComponent(filename)}?exp=${expires}&sig=${sig}`;
    return res.json({ url, expires });
  } catch (err) {
    console.error("[POST /api/documents/sign-download] error:", err);
    return res.status(500).json({ message: "Error generating signed url" });
  }
});

router.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const { exp, sig } = req.query;
    if (!filename || !exp || !sig) return res.status(400).send("Invalid request");

    const secret = process.env.DOWNLOAD_SECRET || "dev-secret";
    const payload = `${filename}|${exp}`;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const ok = Buffer.from(expected).length === Buffer.from(sig).length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
    if (!ok) return res.status(403).send("Invalid signature");

    const now = Math.floor(Date.now() / 1000);
    if (now > Number(exp)) return res.status(410).send("Link expired");

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("Not found");

    const safeName = safeFilenameForHeader(filename);
    const encoded = encodeURIComponent(safeName);

    res.setHeader("Content-Type", mime.lookup(filePath) || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${safeName}"; filename*=UTF-8''${encoded}`);
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error("[GET /api/documents/download/:filename] error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
