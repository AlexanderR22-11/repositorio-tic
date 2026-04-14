// controllers/reportController.js
import PDFDocument from "pdfkit";
import { pool } from "../config/db.js";

function sanitizeFilename(name = "") {
  return String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 200);
}

function escapeText(str) {
  if (!str) return "";
  return String(str).replace(/\r\n|\r|\n/g, " ");
}

export async function generarReportePDF(req, res) {
  try {
    const { q } = req.query;
    const sql = `
      SELECT id, titulo, descripcion, file_name, archivo_url, created_by, fecha_publicacion, status, created_at
      FROM documents
      ${q ? "WHERE titulo LIKE ?" : ""}
      ORDER BY created_at DESC
      LIMIT 1000
    `;
    const params = q ? [`%${q}%`] : [];

    let rows;
    try {
      const [r] = await pool.query(sql, params);
      rows = r;
    } catch (err) {
      // Fallback a SELECT * y normalización si esquema distinto
      const [r2] = await pool.query(`SELECT * FROM documents ${q ? "WHERE titulo LIKE ?" : ""} ORDER BY created_at DESC LIMIT 1000`, params);
      rows = r2.map(row => ({
        id: row.id,
        titulo: row.titulo || row.title || row.name || "",
        file_name: row.file_name || row.filename || "",
        created_at: row.created_at || row.createdAt || null
      }));
    }

    // Preparar PDF en stream
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const filename = sanitizeFilename(`reporte_documentos_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    doc.pipe(res);

    // Cabecera
    doc.fontSize(16).text("Reporte de documentos", { align: "left" });
    doc.moveDown(0.25);
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString()}`, { align: "left" });
    doc.moveDown(0.5);

    // Tabla simple
    const tableTop = doc.y;
    const colWidths = { id: 40, titulo: 260, file: 160, created: 80 };

    // Encabezados
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("ID", 40, tableTop, { width: colWidths.id });
    doc.text("Título", 40 + colWidths.id, tableTop, { width: colWidths.titulo });
    doc.text("Archivo", 40 + colWidths.id + colWidths.titulo, tableTop, { width: colWidths.file });
    doc.text("Creado", 40 + colWidths.id + colWidths.titulo + colWidths.file, tableTop, { width: colWidths.created });
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(9);

    // Filas
    for (const r of rows) {
      const y = doc.y;
      doc.text(String(r.id || ""), 40, y, { width: colWidths.id });
      doc.text(escapeText(r.titulo || ""), 40 + colWidths.id, y, { width: colWidths.titulo });
      doc.text(escapeText(r.file_name || ""), 40 + colWidths.id + colWidths.titulo, y, { width: colWidths.file });
      doc.text(r.created_at ? new Date(r.created_at).toLocaleString() : "", 40 + colWidths.id + colWidths.titulo + colWidths.file, y, { width: colWidths.created });
      doc.moveDown(0.6);
      // Añadir salto de página si se acerca al final
      if (doc.y > doc.page.height - 80) doc.addPage();
    }

    doc.end();
  } catch (err) {
    console.error("generarReportePDF error:", err);
    res.status(500).json({ message: "Error al generar reporte PDF", error: err.message });
  }
}
