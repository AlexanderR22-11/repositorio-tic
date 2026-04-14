// backend/src/utils/backup.js
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const BACKUP_DIR = process.env.BACKUP_DIR ? path.resolve(process.env.BACKUP_DIR) : path.resolve(process.cwd(), "backups");
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || 'mysqldump';

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

export const createBackup = () => {
  return new Promise((resolve, reject) => {
    const fileName = `backup-${timestamp()}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const user = process.env.DB_USER || "root";
    const pass = process.env.DB_PASSWORD || "";
    const db = process.env.DB_NAME;
    const port = process.env.DB_PORT;

    if (!db) return reject(new Error("DB_NAME no definido"));

    // Construir args sin usar shell redirection
    const args = [`-u${user}`];
    if (pass) args.push(`-p${pass}`);
    if (port) args.push(`--port=${port}`);
    args.push(db);

    const outStream = fs.createWriteStream(filePath, { flags: "wx" }); // wx falla si existe
    outStream.on("error", (err) => {
      // si el archivo ya existe o está bloqueado
      return reject(err);
    });

    const dump = spawn(MYSQLDUMP, args, { windowsHide: true });

    dump.stdout.pipe(outStream);

    let stderr = "";
    dump.stderr.on("data", (d) => { stderr += d.toString(); });

    dump.on("error", (err) => {
      outStream.close();
      return reject(err);
    });

    dump.on("close", (code) => {
      outStream.close();
      if (code !== 0) {
        // eliminar archivo si quedó corrupto
        try { fs.unlinkSync(filePath); } catch (e) {}
        return reject(new Error(`mysqldump finalizó con código ${code}. stderr: ${stderr}`));
      }
      // verificar tamaño
      try {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          fs.unlinkSync(filePath);
          return reject(new Error("Backup creado pero vacío"));
        }
      } catch (e) {
        return reject(e);
      }

      // retención simple (opcional)
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

      resolve(filePath);
    });
  });
};

export const restoreBackup = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) return reject(new Error("Archivo no encontrado"));
    const MYSQL = process.env.MYSQL_PATH || 'mysql';
    const user = process.env.DB_USER || "root";
    const pass = process.env.DB_PASSWORD || "";
    const db = process.env.DB_NAME;
    const port = process.env.DB_PORT;

    const args = [`-u${user}`];
    if (pass) args.push(`-p${pass}`);
    if (port) args.push(`--port=${port}`);
    args.push(db);

    const dump = spawn(MYSQL, args, { stdio: ['pipe', 'inherit', 'pipe'], windowsHide: true });
    const inStream = fs.createReadStream(filePath);
    inStream.pipe(dump.stdin);

    let stderr = "";
    dump.stderr.on("data", (d) => { stderr += d.toString(); });

    dump.on("error", (err) => reject(err));
    dump.on("close", (code) => {
      if (code !== 0) return reject(new Error(`mysql finalizó con código ${code}. stderr: ${stderr}`));
      resolve();
    });
  });
};
