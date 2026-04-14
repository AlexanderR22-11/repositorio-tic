import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);
const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.resolve(process.cwd(), "backups");
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || "mysqldump";

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

export const createBackup = async () => {
  const fileName = `backup-${timestamp()}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  const user = process.env.DB_USER || "root";
  const pass = process.env.DB_PASSWORD || "";
  const db = process.env.DB_NAME;
  if (!db) throw new Error("DB_NAME no definido");

  const passPart = pass ? `-p${pass}` : "";
  const portPart = process.env.DB_PORT ? `--port=${process.env.DB_PORT}` : "";
  const cmd = `"${MYSQLDUMP.replace(/"/g, "")}" -u ${user} ${passPart} ${portPart} ${db} > "${filePath}"`;

  // Para depuración temporal puedes console.log("CMD:", cmd);
  await execAsync(cmd, { windowsHide: true });

  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    fs.unlinkSync(filePath);
    throw new Error("Backup creado pero vacío");
  }

  // Retención simple
  const retention = parseInt(process.env.BACKUP_RETENTION || "7", 10);
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".sql"))
    .map(f => ({ f, t: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
    .sort((a,b) => b.t - a.t);

  if (files.length > retention) {
    const toDelete = files.slice(retention);
    toDelete.forEach(x => {
      try { fs.unlinkSync(path.join(BACKUP_DIR, x.f)); } catch {}
    });
  }

  return filePath;
};

export const restoreBackup = async (filePath) => {
  if (!fs.existsSync(filePath)) throw new Error("Archivo de respaldo no encontrado");
  const mysql = process.env.MYSQL_PATH || "mysql";
  const user = process.env.DB_USER || "root";
  const pass = process.env.DB_PASSWORD || "";
  const db = process.env.DB_NAME;
  const passPart = pass ? `-p${pass}` : "";
  const portPart = process.env.DB_PORT ? `--port=${process.env.DB_PORT}` : "";
  const cmd = `"${mysql.replace(/"/g, "")}" -u ${user} ${passPart} ${portPart} ${db} < "${filePath}"`;
  await execAsync(cmd, { windowsHide: true });
};
