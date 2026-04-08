// src/utils/backup.js
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const createBackup = (backupName = null) => {
  return new Promise((resolve, reject) => {
    const file = backupName || `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`;
    const outDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, file);
    const cmd = `mysqldump -u${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} > ${outPath}`;
    exec(cmd, (err) => {
      if (err) return reject(err);
      resolve(outPath);
    });
  });
};

export const restoreBackup = (sqlFilePath) => {
  return new Promise((resolve, reject) => {
    const cmd = `mysql -u${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} < ${sqlFilePath}`;
    exec(cmd, (err) => {
      if (err) return reject(err);
      resolve(true);
    });
  });
};
