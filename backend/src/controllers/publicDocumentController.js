// backend/src/controllers/publicDocumentController.js
import { pool } from "../config/db.js";

export const listDocumentsPublic = async (req, res) => {
  try {
    const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : null;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, parseInt(req.query.limit || "20", 10));
    const offset = (page - 1) * limit;
    const q = req.query.q ? `%${req.query.q}%` : null;

    let sql = `
      SELECT id, titulo, descripcion, archivo_url, thumbnail, fecha_publicacion, category_id
      FROM documents
      WHERE status = 'publicado'
    `;
    const params = [];

    if (categoryId) {
      sql += " AND category_id = ?";
      params.push(categoryId);
    }

    if (q) {
      sql += " AND (titulo LIKE ? OR descripcion LIKE ?)";
      params.push(q, q);
    }

    sql += " ORDER BY fecha_publicacion DESC, created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(sql, params);

    // Construir baseUrl segura para el frontend
    const host = req.get("host");
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;

    // Mapear fechas de forma segura: devolver DATETIME como ISO y una cadena legible
    const documents = rows.map(r => {
      // r.fecha_publicacion viene como DATETIME (string) o null
      let iso = null;
      let human = null;
      if (r.fecha_publicacion) {
        const fecha = new Date(r.fecha_publicacion);
        if (!isNaN(fecha.getTime())) {
          iso = fecha.toISOString(); // formato estándar para parsing si el frontend lo necesita
          human = fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
        } else {
          // Si la DB devolvió un valor no parseable, dejar null y loggear
          console.warn(`[listDocumentsPublic] fecha_publicacion inválida id=${r.id}`, r.fecha_publicacion);
        }
      }

      return {
        id: r.id,
        titulo: r.titulo,
        descripcion: r.descripcion,
        thumbnail: r.thumbnail ? `${baseUrl}${r.thumbnail}` : null,
        archivo_url: r.archivo_url ? `${baseUrl}${r.archivo_url}` : null,
        // fecha_publicacion: ISO (o null)
        fecha_publicacion: iso,
        // fecha_publicacion_human: cadena lista para mostrar (o null)
        fecha_publicacion_human: human,
        category_id: r.category_id
      };
    });

    // Conteo total para paginación
    let countSql = `SELECT COUNT(*) AS total FROM documents WHERE status = 'publicado'`;
    const countParams = [];
    if (categoryId) {
      countSql += " AND category_id = ?";
      countParams.push(categoryId);
    }
    if (q) {
      countSql += " AND (titulo LIKE ? OR descripcion LIKE ?)";
      countParams.push(q, q);
    }
    const [countRows] = await pool.query(countSql, countParams);
    const total = countRows[0] ? countRows[0].total : 0;

    return res.json({ ok: true, page, limit, total, documents });
  } catch (err) {
    console.error("[listDocumentsPublic] error:", err);
    return res.status(500).json({ ok: false, message: "Error al listar documentos", error: err.message });
  }
};
