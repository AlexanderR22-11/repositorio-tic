// backend/seed-superadmin.js
import bcrypt from "bcryptjs";
import { pool } from "./src/config/db.js";

const run = async () => {
  const correo = "superadmin@local";
  const password = "TuPasswordSeguro"; // cambia esto
  const hash = await bcrypt.hash(password, 10);

  const [existing] = await pool.query("SELECT id FROM users WHERE correo = ?", [correo]);
  if (existing.length) {
    console.log("Superadmin ya existe:", existing[0].id);
    process.exit(0);
  }

  const [result] = await pool.query(
    "INSERT INTO users (nombre, correo, password_hash, role, sanamente_certificado) VALUES (?,?,?,?,?)",
    ["Super Admin", correo, hash, "superadmin", 0]
  );
  console.log("Superadmin creado id:", result.insertId, "correo:", correo, "password:", password);
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
