// backend/src/controllers/reportController.js
import PDFDocument from "pdfkit";
import db from "../db/connection.js";

export const generarReportePDF = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title AS titulo, author AS autor, created_at AS creado_en FROM documents ORDER BY created_at DESC`
    );

    const filename = `report-documents-${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Documents", { align: "center" });
    doc.moveDown();

    if (!rows || rows.length === 0) {
      doc.fontSize(12).text("No se encontraron documentos.", { align: "left" });
    } else {
      rows.forEach((r, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${r.titulo}`);
        doc.fontSize(10).fillColor("gray").text(`   Autor: ${r.autor || "-"} — Fecha: ${r.creado_en ? new Date(r.creado_en).toLocaleString() : "-"}`);
        doc.moveDown(0.4);
        doc.fillColor("black");
      });
    }

    doc.end();
  } catch (err) {
    console.error("generarReportePDF error:", err && err.stack ? err.stack : err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Error generando PDF" });
  }
};
