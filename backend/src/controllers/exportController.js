// backend/src/controllers/exportController.js
import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import db from "../db/connection.js";

const filenameWithTs = (base, ext = "csv") => {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${base}-${ts}.${ext}`;
};

const tableExists = async (tableName) => {
  const [rows] = await db.execute(
    "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [process.env.DB_NAME || "repositorio_tic", tableName]
  );
  return Array.isArray(rows) && rows.length > 0;
};

export const exportDocumentosCSV = async (req, res) => {
  try {
    if (!(await tableExists("documents"))) {
      return res.status(404).json({ ok: false, error: "Tabla 'documents' no encontrada" });
    }

    const [rows] = await db.execute(
      `SELECT id, titulo, descripcion, archivo_url, thumbnail, fecha_publicacion, created_by, status, created_at, updated_at FROM documents ORDER BY created_at DESC`
    );

    const filename = filenameWithTs("documents", "csv");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const csvStream = format({ headers: true });
    csvStream.on("error", (err) => {
      console.error("CSV stream error:", err);
      if (!res.headersSent) res.status(500).end();
    });
    res.on("error", (err) => {
      console.error("Response stream error:", err);
    });

    csvStream.pipe(res);

    for (const r of rows) {
      csvStream.write({
        id: r.id,
        titulo: r.titulo,
        descripcion: r.descripcion,
        archivo_url: r.archivo_url,
        thumbnail: r.thumbnail,
        fecha_publicacion: r.fecha_publicacion ? new Date(r.fecha_publicacion).toISOString() : "",
        created_by: r.created_by,
        status: r.status,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
        updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : ""
      });
    }
    csvStream.end();
  } catch (err) {
    console.error("exportDocumentosCSV error:", err && err.stack ? err.stack : err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Error exportando CSV" });
  }
};

export const exportDocumentosJSON = async (req, res) => {
  try {
    if (!(await tableExists("documents"))) {
      return res.status(404).json({ ok: false, error: "Tabla 'documents' no encontrada" });
    }

    const [rows] = await db.execute(
      `SELECT id, titulo, descripcion, archivo_url, thumbnail, fecha_publicacion, created_by, status, created_at, updated_at FROM documents ORDER BY created_at DESC`
    );

    const filename = filenameWithTs("documents", "json");
    const jsonStr = JSON.stringify(rows, null, 2);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(jsonStr);
  } catch (err) {
    console.error("exportDocumentosJSON error:", err && err.stack ? err.stack : err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Error exportando JSON" });
  }
};

export const generarReportePDF = async (req, res) => {
  try {
    if (!(await tableExists("documents"))) {
      return res.status(404).json({ ok: false, error: "Tabla 'documents' no encontrada" });
    }

    const [rows] = await db.execute(
      `SELECT id, titulo, descripcion, archivo_url, thumbnail, fecha_publicacion, created_by, status, created_at FROM documents ORDER BY created_at DESC`
    );

    const filename = filenameWithTs("report-documents", "pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    doc.on("error", (err) => {
      console.error("PDF stream error:", err);
      if (!res.headersSent) res.status(500).end();
    });
    res.on("error", (err) => {
      console.error("Response stream error:", err);
    });

    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Documents", { align: "center" });
    doc.moveDown();

    if (!rows || rows.length === 0) {
      doc.fontSize(12).text("No se encontraron documents.", { align: "left" });
    } else {
      rows.forEach((r, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${r.titulo}`);
        doc.fontSize(10).fillColor("gray").text(`   Fecha: ${r.fecha_publicacion ? new Date(r.fecha_publicacion).toLocaleString() : "-"} — AutorId: ${r.created_by || "-"}`);
        doc.moveDown(0.4);
        doc.fillColor("black");
        if (r.descripcion) {
          doc.fontSize(10).text(r.descripcion, { continued: false });
          doc.moveDown(0.4);
        }
      });
    }

    doc.end();
  } catch (err) {
    console.error("generarReportePDF error:", err && err.stack ? err.stack : err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: "Error generando PDF" });
  }
};
