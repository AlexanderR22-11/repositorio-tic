// src/controllers/reportController.js
import PDFDocument from "pdfkit";
import * as Documento from "../models/documentoModel.js";

export const generarReportePDF = async (req, res) => {
  try {
    // Si quieres filtrar por usuario o por query, usa req.user o req.query
    const docs = await Documento.getAllDocumentos();

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=reporte-documentos.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Reporte de Documentos", { align: "center" });
    doc.moveDown();

    docs.forEach((d, i) => {
      doc.fontSize(12).text(`${i + 1}. ${d.titulo}`, { continued: false });
      doc.fontSize(10).fillColor("gray").text(`Autor: ${d.autor} • Fecha: ${d.fecha_publicacion || "N/A"}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Error generando PDF", error: err.message });
  }
};
