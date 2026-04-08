// backend/src/controllers/documentController.js
import fs from "fs";
import path from "path";
import { pool } from "../config/db.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// LIST
export const listDocuments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM documentos ORDER BY created_at DESC LIMIT 100");
    return res.json(rows);
  } catch (err) {
    console.error("[listDocuments] error:", err.stack || err);
    return res.status(500).json({ message: "Error al listar documentos", error: err.message });
  }
};

// GET single
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM documentos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Documento no encontrado" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("[getDocument] error:", err.stack || err);
    return res.status(500).json({ message: "Error al obtener documento", error: err.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    console.log("[uploadDocument] START");
    console.log("[uploadDocument] pool defined:", !!pool);
    console.log("[uploadDocument] req.file:", req.file ? { filename: req.file.filename, originalname: req.file.originalname, size: req.file.size } : null);
    console.log("[uploadDocument] req.body:", req.body);
    const file = req.file;
    const { titulo, autor, fecha_publicacion } = req.body;
    const created_by = req.user ? req.user.id : (req.body.created_by ? Number(req.body.created_by) : null);

    if (!file && !titulo) return res.status(400).json({ message: "Se requiere archivo o título" });

    const archivo_url = file ? `/uploads/${file.filename}` : null;
    const tituloFinal = titulo || (file ? file.originalname : "Sin título");

    const sql = `
      INSERT INTO documentos
        (titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [tituloFinal, autor || null, fecha_publicacion || null, null, archivo_url, created_by];

    console.log("[uploadDocument] SQL params:", params);

    try {
      const [result] = await pool.query(sql, params);
      console.log("[uploadDocument] Insert result:", result);
      return res.status(201).json({ id: result.insertId, titulo: tituloFinal, archivo_url, created_by });
    } catch (insertErr) {
      console.error("[uploadDocument] INSERT ERROR:", insertErr.stack || insertErr);
      return res.status(500).json({ message: "Error en INSERT", error: insertErr.message, code: insertErr.code, sqlMessage: insertErr.sqlMessage });
    }
  } catch (err) {
    console.error("[uploadDocument] UNEXPECTED ERROR:", err.stack || err);
    return res.status(500).json({ message: "Error inesperado", error: err.message });
  }
};

// UPDATE
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    const { titulo, autor, fecha_publicacion, thumbnail } = req.body;

    let oldFilename = null;
    if (file) {
      const [rows] = await pool.query("SELECT archivo_url FROM documentos WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ message: "Documento no encontrado" });
      oldFilename = rows[0].archivo_url ? path.basename(rows[0].archivo_url) : null;
    }

    const archivo_url = file ? `/uploads/${file.filename}` : null;

    const sql = `
      UPDATE documentos
      SET titulo = COALESCE(?, titulo),
          autor = COALESCE(?, autor),
          fecha_publicacion = COALESCE(?, fecha_publicacion),
          thumbnail = COALESCE(?, thumbnail),
          archivo_url = COALESCE(?, archivo_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [titulo || null, autor || null, fecha_publicacion || null, thumbnail || null, archivo_url, id];

    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      if (file) fs.unlinkSync(path.join(UPLOAD_DIR, file.filename));
      return res.status(404).json({ message: "Documento no encontrado" });
    }

    if (oldFilename) {
      const oldPath = path.join(UPLOAD_DIR, oldFilename);
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) { console.error("Error al eliminar archivo antiguo:", e); }
    }

    return res.json({ message: "Documento actualizado" });
  } catch (err) {
    console.error("[updateDocument] error:", err.stack || err);
    if (req.file) {
      try { fs.unlinkSync(path.join(UPLOAD_DIR, req.file.filename)); } catch (e) { console.error("unlink error", e); }
    }
    return res.status(500).json({ message: "Error al actualizar documento", error: err.message });
  }
};

// DOWNLOAD
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT archivo_url FROM documentos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Documento no encontrado" });

    const archivoUrl = rows[0].archivo_url;
    if (!archivoUrl) return res.status(404).json({ message: "Archivo no disponible" });

    const filename = path.basename(archivoUrl);
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: "Archivo físico no encontrado" });

    return res.download(filePath, filename);
  } catch (err) {
    console.error("[downloadDocument] error:", err.stack || err);
    return res.status(500).json({ message: "Error al descargar documento", error: err.message });
  }
};

// DELETE
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT archivo_url FROM documentos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Documento no encontrado" });

    const archivoUrl = rows[0].archivo_url;
    const filename = archivoUrl ? path.basename(archivoUrl) : null;

    const [result] = await pool.query("DELETE FROM documentos WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Documento no encontrado" });

    if (filename) {
      const filePath = path.join(UPLOAD_DIR, filename);
      try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { console.error("[deleteDocument] unlink error:", e); }
    }

    return res.json({ message: "Documento eliminado" });
  } catch (err) {
    console.error("[deleteDocument] error:", err.stack || err);
    return res.status(500).json({ message: "Error al eliminar documento", error: err.message });
  }
};
