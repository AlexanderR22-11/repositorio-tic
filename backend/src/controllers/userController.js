// backend/src/controllers/userController.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Helper: formatea fila de usuario para respuestas públicas
 */
function safeUser(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    role: row.role,
    sanamente_certificado: row.sanamente_certificado === 1 || row.sanamente_certificado === true ? 1 : 0,
    created_at: row.created_at,
  };
}

/**
 * Listar todos los usuarios
 */
export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, correo, role, sanamente_certificado, created_at FROM users ORDER BY id DESC"
    );
    return res.json({ ok: true, users: rows.map(safeUser) });
  } catch (err) {
    console.error("[getUsers]", err);
    return res.status(500).json({ ok: false, message: "Error al obtener usuarios", error: err.message });
  }
};

/**
 * Obtener usuario por id
 */
export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre, correo, role, sanamente_certificado, created_at FROM users WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });
    return res.json({ ok: true, user: safeUser(rows[0]) });
  } catch (err) {
    console.error("[getUserById]", err);
    return res.status(500).json({ ok: false, message: "Error al obtener usuario", error: err.message });
  }
};

/**
 * Crear usuario (admin)
 * Acepta: nombre, correo, password (texto plano) OR password_hash (legacy).
 */
export const createUser = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      password,        // preferido
      password_hash,   // opcional (legacy)
      role = "alumno",
      sanamente_certificado = false
    } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ ok: false, message: "Nombre y correo son obligatorios" });
    }

    // Normalizar correo
    const normalizedCorreo = String(correo).trim().toLowerCase();

    // Verificar correo único
    const [exists] = await pool.query("SELECT id FROM users WHERE correo = ?", [normalizedCorreo]);
    if (exists.length > 0) {
      return res.status(409).json({ ok: false, message: "Correo ya registrado" });
    }

    // Determinar hash de contraseña
    let finalHash = null;
    if (password && String(password).length > 0) {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      finalHash = await bcrypt.hash(String(password), salt);
    } else if (password_hash && String(password_hash).length > 0) {
      // Si se pasa password_hash, aceptarlo (legacy). No se re-hash.
      finalHash = password_hash;
    } else {
      return res.status(400).json({ ok: false, message: "Se requiere password o password_hash" });
    }

    const [result] = await pool.query(
      `INSERT INTO users (nombre, correo, password_hash, role, sanamente_certificado, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [String(nombre).trim(), normalizedCorreo, finalHash, role, sanamente_certificado ? 1 : 0]
    );

    const [newRow] = await pool.query(
      "SELECT id, nombre, correo, role, sanamente_certificado, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json({ ok: true, user: safeUser(newRow[0]) });
  } catch (err) {
    console.error("[createUser]", err);
    // Manejo específico para duplicados por si el check previo falla en concurrencia
    if (err && (err.code === "ER_DUP_ENTRY" || err.errno === 1062)) {
      return res.status(409).json({ ok: false, message: "Correo ya registrado" });
    }
    return res.status(500).json({ ok: false, message: "Error al crear usuario", error: err.message });
  }
};

/**
 * Actualizar usuario (admin)
 * No cambia contraseña aquí; crea endpoint separado si necesitas cambiar password.
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, role, sanamente_certificado } = req.body;
  try {
    // Normalizar correo si viene
    const normalizedCorreo = correo ? String(correo).trim().toLowerCase() : null;

    await pool.query(
      `UPDATE users
       SET nombre = COALESCE(NULLIF(?, ''), nombre),
           correo = COALESCE(NULLIF(?, ''), correo),
           role = COALESCE(NULLIF(?, ''), role),
           sanamente_certificado = COALESCE(?, sanamente_certificado),
           updated_at = NOW()
       WHERE id = ?`,
      [
        nombre || null,
        normalizedCorreo || null,
        role || null,
        typeof sanamente_certificado === "boolean" ? (sanamente_certificado ? 1 : 0) : null,
        id
      ]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("[updateUser]", err);
    // Detección de duplicado de correo
    if (err && (err.code === "ER_DUP_ENTRY" || err.errno === 1062)) {
      return res.status(409).json({ ok: false, message: "El correo ya está en uso por otro usuario" });
    }
    return res.status(500).json({ ok: false, message: "Error al actualizar usuario", error: err.message });
  }
};

/**
 * Cambiar contraseña (admin o usuario mismo)
 * - Si el request lo hace un admin, puede cambiar sin password actual.
 * - Si lo hace el propio usuario, debe enviar currentPassword.
 */
export const changePassword = async (req, res) => {
  const { id } = req.params; // id del usuario a modificar
  const { currentPassword, newPassword } = req.body;
  const requester = req.user; // viene del middleware authenticate

  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ ok: false, message: "La nueva contraseña debe tener al menos 8 caracteres" });
  }

  try {
    // Si no es admin, verificar que el requester sea el mismo usuario y que currentPassword coincida
    if (!requester) return res.status(401).json({ ok: false, message: "No autenticado" });

    const [rows] = await pool.query("SELECT id, password_hash FROM users WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Usuario no encontrado" });

    const userRow = rows[0];

    const isAdmin = requester.role === "admin" || requester.role === "superadmin";
    if (!isAdmin) {
      if (Number(requester.id) !== Number(id)) {
        return res.status(403).json({ ok: false, message: "No tienes permiso para cambiar esta contraseña" });
      }
      if (!currentPassword) {
        return res.status(400).json({ ok: false, message: "Se requiere la contraseña actual" });
      }
      const match = await bcrypt.compare(currentPassword, userRow.password_hash);
      if (!match) return res.status(401).json({ ok: false, message: "Contraseña actual incorrecta" });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const newHash = await bcrypt.hash(String(newPassword), salt);

    await pool.query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [newHash, id]);

    return res.json({ ok: true, message: "Contraseña actualizada" });
  } catch (err) {
    console.error("[changePassword]", err);
    return res.status(500).json({ ok: false, message: "Error al cambiar contraseña", error: err.message });
  }
};

/**
 * Eliminar usuario (admin)
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[deleteUser]", err);
    return res.status(500).json({ ok: false, message: "Error al eliminar usuario", error: err.message });
  }
};
