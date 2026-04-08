// src/controllers/exportController.js
import { Parser } from "json2csv";
import * as Documento from "../models/documentoModel.js";

export const exportDocumentosCSV = async (req, res) => {
  try {
    const docs = await Documento.getAllDocumentos();
    const fields = ["id", "titulo", "autor", "fecha_publicacion", "archivo_url", "created_by", "created_at"];
    const parser = new Parser({ fields });
    const csv = parser.parse(docs);
    res.header("Content-Type", "text/csv");
    res.attachment("documentos.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Error exportando CSV", error: err.message });
  }
};

export const exportDocumentosJSON = async (req, res) => {
  try {
    const docs = await Documento.getAllDocumentos();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Error exportando JSON", error: err.message });
  }
};
