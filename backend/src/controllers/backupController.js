// backend/src/controllers/backupController.js
import path from "path";
import fs from "fs";
import cron from "node-cron";
import { createBackup, restoreBackup } from "../../utils/backup.js";

const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.resolve(process.cwd(), "backups");
let tareaRespaldo = null;

// Genera backup y responde con la ruta del archivo creado (nombre)
export const backupNow = async (req, res) => {
  try {
    const filePath = await createBackup();
    const fileName = path.basename(filePath);
    console.log(`[backupNow] Backup creado: ${filePath} por ${req.user?.id || req.ip}`);
    return res.json({ ok: true, message: "Respaldo creado", file: fileName });
  } catch (err) {
    console.error("backupNow error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error al crear respaldo" });
  }
};

// Descarga el respaldo más reciente en BACKUP_DIR
export const downloadBackup = (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.status(404).json({ ok: false, message: "No existe carpeta de respaldos" });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }));

    if (!files.length) return res.status(404).json({ ok: false, message: "No hay respaldos disponibles" });

    const latest = files.sort((a, b) => b.t - a.t)[0].f;
    const filePath = path.join(BACKUP_DIR, latest);

    if (!fs.existsSync(filePath)) {
      console.error("[downloadBackup] Archivo esperado no encontrado:", filePath);
      return res.status(404).json({ ok: false, message: "Archivo de respaldo no encontrado" });
    }

    // res.download maneja headers y stream; captura errores en callback
    return res.download(filePath, latest, (err) => {
      if (err) {
        console.error("downloadBackup error:", err);
        if (!res.headersSent) return res.status(500).json({ ok: false, message: "Error al descargar respaldo" });
      } else {
        console.log(`[downloadBackup] ${req.user?.id || req.ip} descargó ${latest}`);
      }
    });
  } catch (err) {
    console.error("downloadBackup exception:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error al procesar descarga" });
  }
};

// Restaura desde un archivo subido (req.file proviene de multer)
export const restoreNow = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: "Archivo SQL requerido" });

    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) return res.status(400).json({ ok: false, message: "Archivo subido no encontrado" });

    console.log(`[restoreNow] Iniciando restauración desde ${filePath} por ${req.user?.id || req.ip}`);
    await restoreBackup(filePath);

    // eliminar archivo subido después de restaurar (no bloquear si falla)
    try { fs.unlinkSync(filePath); } catch (e) { console.warn("[restoreNow] No se pudo borrar archivo subido:", e.message); }

    return res.json({ ok: true, message: "Restauración completada" });
  } catch (err) {
    console.error("restoreNow error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error al restaurar respaldo" });
  }
};

// Programar respaldo automático con expresión CRON
export const programarRespaldo = async (req, res) => {
  try {
    const { cronExpresion } = req.body;
    if (!cronExpresion) return res.status(400).json({ ok: false, message: "Se requiere expresión CRON" });

    // Detener tarea previa si existe
    if (tareaRespaldo) {
      try { tareaRespaldo.stop(); } catch (e) { console.warn("No se pudo detener tarea previa:", e); }
      tareaRespaldo = null;
    }

    // Validación básica de expresión CRON (node-cron tiene validate)
    if (!cron.validate(cronExpresion)) {
      return res.status(400).json({ ok: false, message: "Expresión CRON inválida" });
    }

    tareaRespaldo = cron.schedule(cronExpresion, async () => {
      try {
        const filePath = await createBackup();
        console.log(`[CRON] Respaldo automático creado: ${filePath}`);
      } catch (err) {
        console.error("[CRON] Error al crear respaldo automático:", err);
      }
    }, { scheduled: true });

    console.log(`[programarRespaldo] Tarea programada: ${cronExpresion} por ${req.user?.id || req.ip}`);
    return res.json({ ok: true, message: `Respaldo programado: ${cronExpresion}` });
  } catch (err) {
    console.error("programarRespaldo error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error al programar respaldo" });
  }
};

// Endpoint para detener la tarea programada
export const detenerRespaldoProgramado = (req, res) => {
  try {
    if (!tareaRespaldo) return res.json({ ok: true, message: "No hay tarea programada" });
    tareaRespaldo.stop();
    tareaRespaldo = null;
    console.log(`[detenerRespaldoProgramado] Tarea detenida por ${req.user?.id || req.ip}`);
    return res.json({ ok: true, message: "Tarea de respaldo detenida" });
  } catch (err) {
    console.error("detenerRespaldoProgramado error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error al detener tarea" });
  }
};
