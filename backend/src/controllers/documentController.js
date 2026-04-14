// backend/src/controllers/documentController.js
import { pool } from "../config/db.js";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * Subir documento y crear registro en tabla 'documentos'
 * Espera FormData con: file, titulo (opcional), descripcion (opcional), category_id (opcional)
 * Requiere middleware de autenticación que ponga req.user
 */
export const uploadDocument = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ ok: false, message: "No autenticado" });

    if (!req.file) return res.status(400).json({ ok: false, message: "No se recibió archivo" });

    const { originalname, filename, mimetype, size } = req.file;
    const titulo = (req.body.titulo || originalname || "").trim();
    const descripcion = req.body.descripcion ? String(req.body.descripcion).trim() : null;
    const category_id = req.body.category_id ? Number(req.body.category_id) : null;
    const created_by = Number(user.id);

    // Construir archivo_url relativo (puedes cambiar a solo filename si prefieres)
    const archivo_url = `/uploads/${filename}`;

    const sql = `INSERT INTO documentos
      (titulo, descripcion, archivo_url, thumbnail, fecha_publicacion, created_by, status, created_at, updated_at, category_id, file_name, mime_type, size)
      VALUES (?, ?, ?, NULL, NOW(), ?, 'borrador', NOW(), NOW(), ?, ?, ?, ?)`;

    const [result] = await pool.query(sql, [
      titulo,
      descripcion,
      archivo_url,
      created_by,
      category_id,
      originalname,
      mimetype,
      size
    ]);

    const [rows] = await pool.query(
      "SELECT id, titulo, descripcion, archivo_url, category_id, created_by, file_name, mime_type, size, created_at FROM documentos WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json({ ok: true, document: rows[0] });
  } catch (err) {
    console.error("[uploadDocument] error:", err.stack || err);
    // cleanup si multer guardó archivo
    try {
      if (req?.file?.filename) {
        const fp = path.join(UPLOAD_DIR, req.file.filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    } catch (e) {
      console.error("[uploadDocument] cleanup error:", e.stack || e);
    }
    return res.status(500).json({ ok: false, message: "Error al subir documento", error: err.message });
  }
};

/**
 * Listar documentos (opcional filter por category_id)
 * GET /api/documents?category_id=123
 */
export const listDocuments = async (req, res) => {
  try {
    const { category_id } = req.query;
    let rows;
    if (category_id) {
      [rows] = await pool.query(
        "SELECT id, titulo, descripcion, archivo_url, category_id, created_by, file_name, mime_type, size, created_at FROM documentos WHERE category_id = ? ORDER BY id DESC",
        [Number(category_id)]
      );
    } else {
      [rows] = await pool.query(
        "SELECT id, titulo, descripcion, archivo_url, category_id, created_by, file_name, mime_type, size, created_at FROM documentos ORDER BY id DESC"
      );
    }
    return res.json({ ok: true, documents: rows });
  } catch (err) {
    console.error("[listDocuments] error:", err.stack || err);
    return res.status(500).json({ ok: false, message: "Error al listar documentos", error: err.message });
  }
};

/**
 * Obtener metadatos de un documento por id
 * GET /api/documents/:id
 */
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, titulo, descripcion, archivo_url, category_id, created_by, file_name, mime_type, size, created_at FROM documentos WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Documento no encontrado" });
    return res.json({ ok: true, document: rows[0] });
  } catch (err) {
    console.error("[getDocument] error:", err.stack || err);
    return res.status(500).json({ ok: false, message: "Error al obtener documento", error: err.message });
  }
};

/**
 * Descargar documento por id (stream)
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT file_name, archivo_url, mime_type FROM documentos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Documento no encontrado" });

    const doc = rows[0];
    if (!doc.archivo_url) return res.status(404).json({ ok: false, message: "Archivo no disponible" });

    const stored = doc.archivo_url.startsWith("/uploads/") ? doc.archivo_url.replace("/uploads/", "") : path.basename(doc.archivo_url);
    const filePath = path.join(UPLOAD_DIR, stored);

    if (!fs.existsSync(filePath)) return res.status(404).json({ ok: false, message: "Archivo físico no encontrado" });

    const downloadName = doc.file_name || path.basename(filePath);
    res.setHeader("Content-Type", doc.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(downloadName)}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("[downloadDocument] error:", err.stack || err);
    return res.status(500).json({ ok: false, message: "Error al descargar documento", error: err.message });
  }
};

/**
 * Actualizar documento (metadatos y opcionalmente reemplazar archivo)
 * PUT /api/documents/:id
 * Puede recibir FormData con file (opcional), titulo, descripcion, category_id, status
 */
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    // comprobar existencia
    const [existing] = await pool.query("SELECT archivo_url, file_name FROM documentos WHERE id = ?", [id]);
    if (!existing.length) return res.status(404).json({ ok: false, message: "Documento no encontrado" });

    const prev = existing[0];
    let newArchivoUrl = prev.archivo_url;
    let newFileName = prev.file_name;
    let newMime = null;
    let newSize = null;

    // Si se subió un nuevo archivo, mover/usar filename y limpiar anterior
    if (req.file) {
      const { originalname, filename, mimetype, size } = req.file;
      newArchivoUrl = `/uploads/${filename}`;
      newFileName = originalname;
      newMime = mimetype;
      newSize = size;

      // eliminar archivo anterior si existe
      try {
        const prevStored = prev.archivo_url ? (prev.archivo_url.startsWith("/uploads/") ? prev.archivo_url.replace("/uploads/", "") : path.basename(prev.archivo_url)) : null;
        if (prevStored) {
          const prevPath = path.join(UPLOAD_DIR, prevStored);
          if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
        }
      } catch (e) {
        console.error("[updateDocument] cleanup previous file error:", e.stack || e);
      }
    }

    // Campos a actualizar
    const titulo = req.body.titulo ? String(req.body.titulo).trim() : undefined;
    const descripcion = req.body.descripcion !== undefined ? String(req.body.descripcion).trim() : undefined;
    const category_id = req.body.category_id !== undefined ? (req.body.category_id ? Number(req.body.category_id) : null) : undefined;
    const status = req.body.status ? String(req.body.status) : undefined;

    // Construir query dinámico
    const updates = [];
    const params = [];

    if (titulo !== undefined) { updates.push("titulo = ?"); params.push(titulo); }
    if (descripcion !== undefined) { updates.push("descripcion = ?"); params.push(descripcion); }
    if (category_id !== undefined) { updates.push("category_id = ?"); params.push(category_id); }
    if (status !== undefined) { updates.push("status = ?"); params.push(status); }

    // archivo fields
    if (newArchivoUrl !== prev.archivo_url) {
      updates.push("archivo_url = ?");
      params.push(newArchivoUrl);
    }
    if (newFileName !== prev.file_name) {
      updates.push("file_name = ?");
      params.push(newFileName);
    }
    if (newMime !== null) {
      updates.push("mime_type = ?");
      params.push(newMime);
    }
    if (newSize !== null) {
      updates.push("size = ?");
      params.push(newSize);
    }

    if (updates.length === 0) {
      return res.json({ ok: true, message: "Nada que actualizar" });
    }

    params.push(id);
    const sql = `UPDATE documentos SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`;
    await pool.query(sql, params);

    const [rows] = await pool.query("SELECT id, titulo, descripcion, archivo_url, category_id, created_by, file_name, mime_type, size, created_at, updated_at FROM documentos WHERE id = ?", [id]);
    return res.json({ ok: true, document: rows[0] });
  } catch (err) {
    console.error("[updateDocument] error:", err.stack || err);
    // cleanup si multer guardó archivo y hubo error
    try {
      if (req?.file?.filename) {
        const fp = path.join(UPLOAD_DIR, req.file.filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    } catch (e) {
      console.error("[updateDocument] cleanup error:", e.stack || e);
    }
    return res.status(500).json({ ok: false, message: "Error al actualizar documento", error: err.message });
  }
};

/**
 * Eliminar documento por id (borra registro y archivo físico)
 * DELETE /api/documents/:id
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT archivo_url FROM documentos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Documento no encontrado" });

    const archivoUrl = rows[0].archivo_url;
    const filename = archivoUrl ? (archivoUrl.startsWith("/uploads/") ? archivoUrl.replace("/uploads/", "") : path.basename(archivoUrl)) : null;

    const [result] = await pool.query("DELETE FROM documentos WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ ok: false, message: "Documento no encontrado" });

    if (filename) {
      const filePath = path.join(UPLOAD_DIR, filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.error("[deleteDocument] unlink error:", e.stack || e); }
    }

    return res.json({ ok: true, message: "Documento eliminado" });
  } catch (err) {
    console.error("[deleteDocument] error:", err.stack || err);
    return res.status(500).json({ ok: false, message: "Error al eliminar documento", error: err.message });
  }
};
