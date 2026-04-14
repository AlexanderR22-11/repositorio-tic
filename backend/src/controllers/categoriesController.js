// backend/src/controllers/categoriesController.js
import { pool } from "../config/db.js";

export const listCategories = async (req, res) => {
  try {
    const sql = `
      SELECT c.id,
             c.nombre AS name,
             c.descripcion AS description,
             COALESCE(d.count_docs, 0) AS count
      FROM categories c
      LEFT JOIN (
        SELECT category_id, COUNT(*) AS count_docs
        FROM documents
        WHERE status = 'published'
        GROUP BY category_id
      ) d ON d.category_id = c.id
      ORDER BY c.nombre;
    `;
    const [rows] = await pool.query(sql);
    return res.json({ ok: true, categories: rows });
  } catch (err) {
    console.error("[listCategories] error:", err.stack || err);
    return res.status(500).json({ ok: false, error: "Error al listar categorías", message: err.message });
  }
};
