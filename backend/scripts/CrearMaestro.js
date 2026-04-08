// backend/scripts/crearMaestro.js
import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js"; // <- ajusta si tu pool está en otra ruta

(async () => {
  try {
    const nombre = "Profesor Prueba";           // cambia el nombre
    const correo = "maestro@utn.com";          // cambia el correo
    const password = "barcelona0422";    // pon aquí la contraseña que quieras
    const SALT_ROUNDS = 10;

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = "INSERT INTO users (nombre, correo, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())";
    const [result] = await pool.query(sql, [nombre, correo, password_hash, "maestro"]);

    console.log("Usuario maestro creado con id:", result.insertId);
    console.log("Correo:", correo);
    console.log("Contraseña (texto plano):", password);
    process.exit(0);
  } catch (err) {
    console.error("Error creando maestro:", err);
    process.exit(1);
  }
})();
