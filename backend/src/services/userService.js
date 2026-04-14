// userService.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

export const createUserInDB = async ({ nombre, correo, password, password_hash, role = "alumno", created_by = null, sanamente_certificado = false }) => {
  if (!nombre || !correo) throw new Error("Nombre y correo son obligatorios");

  // Verificar correo único
  const [exists] = await pool.query("SELECT id FROM users WHERE correo = ?", [correo]);
  if (exists.length > 0) {
    const err = new Error("Correo ya registrado");
    err.code = "DUPLICATE_EMAIL";
    throw err;
  }

  // Determinar hash
  let finalHash;
  if (password && password.length > 0) {
    const salt = await bcrypt.genSalt(10);
    finalHash = await bcrypt.hash(password, salt);
  } else if (password_hash && password_hash.length > 0) {
    finalHash = password_hash;
  } else {
    const err = new Error("Se requiere password o password_hash");
    err.code = "NO_PASSWORD";
    throw err;
  }

  const [result] = await pool.query(
    `INSERT INTO users (nombre, correo, password_hash, role, sanamente_certificado, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [nombre, correo, finalHash, role, sanamente_certificado ? 1 : 0, created_by]
  );

  const [rows] = await pool.query(
    "SELECT id, nombre, correo, role, sanamente_certificado, created_by, created_at FROM users WHERE id = ?",
    [result.insertId]
  );

  return rows[0];
};
