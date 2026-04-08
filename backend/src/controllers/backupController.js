// src/controllers/backupController.js
import { createBackup, restoreBackup } from "../../utils/backup.js";
import path from "path";

export const backupNow = async (req, res) => {
  try {
    const file = await createBackup();
    res.json({ ok: true, file });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const restoreNow = async (req, res) => {
  try {
    // espera que el admin suba el archivo SQL en multipart/form-data como 'file'
    if (!req.file) return res.status(400).json({ message: "Archivo SQL requerido" });
    const filePath = req.file.path;
    await restoreBackup(filePath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
