// backend/src/controllers/userController.js
import { pool } from "../config/db.js";

// Listar todos los usuarios
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre, correo, role, sanamente_certificado, created_at FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuarios", error: err.message });
  }
};

// Obtener usuario por id
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT id, nombre, correo, role, sanamente_certificado, created_at FROM users WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuario", error: err.message });
  }
};

// Crear usuario (admin)
export const createUser = async (req, res) => {
  const { nombre, correo, password_hash, role = "alumno", sanamente_certificado = false } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO users (nombre, correo, password_hash, role, sanamente_certificado) VALUES (?,?,?,?,?)",
      [nombre, correo, password_hash, role, sanamente_certificado]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: "Error al crear usuario", error: err.message });
  }
};

// Actualizar usuario (admin)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, role, sanamente_certificado } = req.body;
  try {
    await pool.query(
      "UPDATE users SET nombre = COALESCE(?, nombre), correo = COALESCE(?, correo), role = COALESCE(?, role), sanamente_certificado = COALESCE(?, sanamente_certificado) WHERE id = ?",
      [nombre, correo, role, sanamente_certificado, id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
  }
};

// Eliminar usuario (admin)
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar usuario", error: err.message });
  }
};
