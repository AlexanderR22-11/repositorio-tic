// backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js"; // ajusta la ruta si tu pool está en otro archivo

const SALT_ROUNDS = 10;

export async function registerPublic(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const domain = (email.split("@")[1] || "").toLowerCase();
    if (domain !== "utnay.edu.mx") {
      return res.status(403).json({ error: "Solo se permiten correos @utnay.edu.mx para registro público" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE correo = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = "INSERT INTO users (nombre, correo, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())";
    const [result] = await pool.query(sql, [nombre, email, password_hash, "alumno"]);

    // Obtener usuario insertado (MySQL): usar insertId
    const [rows] = await pool.query("SELECT id, nombre, correo, role, created_at FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error("registerPublic error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function registerTeacher(req, res) {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE correo = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO users (nombre, correo, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())",
      [nombre, email, password_hash, "maestro"]
    );

    const [rows] = await pool.query("SELECT id, nombre, correo, role, created_at FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];

    return res.status(201).json({ user });
  } catch (err) {
    console.error("registerTeacher error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}

export async function login(req, res) {
  try {
    console.log("LOGIN body:", req.body);

    const { correo, email, password } = req.body;
    const identifier = (correo || email || "").toLowerCase();
    if (!identifier || !password) {
      return res.status(400).json({ error: "Correo y contraseña son requeridos" });
    }

    const sql = "SELECT id, nombre, correo, password_hash, role, created_at FROM users WHERE correo = ?";
    const [rows] = await pool.query(sql, [identifier]);

    if (!rows || rows.length === 0) {
      console.log("LOGIN: usuario no encontrado para", identifier);
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    console.log("LOGIN: bcrypt.compare result =", match);

    if (!match) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const safeUser = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      role: user.role,
      created_at: user.created_at,
    };

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
