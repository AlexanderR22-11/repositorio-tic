import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { getJwtSecret } from "../utils/jwt.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES = process.env.JWT_EXPIRES || "7d";
const ALLOWED_PUBLIC_DOMAIN = process.env.ALLOWED_PUBLIC_DOMAIN || "utnay.edu.mx";

function makeSafeUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    role: row.role,
    created_at: row.created_at,
  };
}

export async function registerPublic(req, res) {
  try {
    const { nombre, correo, email, password } = req.body;
    const normalizedEmail = (correo || email || "").trim().toLowerCase();

    if (!nombre || !normalizedEmail || !password) {
      return res.status(400).json({ ok: false, error: "Faltan campos obligatorios" });
    }

    const domain = (normalizedEmail.split("@")[1] || "").toLowerCase();
    if (domain !== ALLOWED_PUBLIC_DOMAIN) {
      return res.status(403).json({ ok: false, error: `Solo se permiten correos @${ALLOWED_PUBLIC_DOMAIN} para registro público` });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE correo = ?", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: "El correo ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const sql = "INSERT INTO users (nombre, correo, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
    const [result] = await pool.query(sql, [nombre.trim(), normalizedEmail, password_hash, "alumno"]);

    const [rows] = await pool.query("SELECT id, nombre, correo, role, created_at FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];

    const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: TOKEN_EXPIRES });

    return res.status(201).json({ ok: true, user: makeSafeUser(user), token });
  } catch (err) {
    console.error("registerPublic error:", err.stack || err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

export async function registerTeacher(req, res) {
  try {
    const { nombre, correo, email, password } = req.body;
    const normalizedEmail = (correo || email || "").trim().toLowerCase();

    if (!nombre || !normalizedEmail || !password) {
      return res.status(400).json({ ok: false, error: "Faltan campos obligatorios" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE correo = ?", [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ ok: false, error: "El correo ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      "INSERT INTO users (nombre, correo, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [nombre.trim(), normalizedEmail, password_hash, "maestro"]
    );

    const [rows] = await pool.query("SELECT id, nombre, correo, role, created_at FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];

    return res.status(201).json({ ok: true, user: makeSafeUser(user) });
  } catch (err) {
    console.error("registerTeacher error:", err.stack || err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

export async function login(req, res) {
  try {
    const { correo, email, password } = req.body;
    const identifier = (correo || email || "").trim().toLowerCase();
    if (!identifier || !password) {
      return res.status(400).json({ ok: false, error: "Correo y contraseña son requeridos" });
    }

    const sql = "SELECT id, nombre, correo, password_hash, role, created_at FROM users WHERE correo = ?";
    const [rows] = await pool.query(sql, [identifier]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ ok: false, error: "Credenciales inválidas" });
    }

    const safeUser = makeSafeUser(user);
    const token = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: TOKEN_EXPIRES });

    return res.status(200).json({ ok: true, user: safeUser, token });
  } catch (err) {
    console.error("login error:", err.stack || err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}
