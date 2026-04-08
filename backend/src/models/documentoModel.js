// src/models/documentoModel.js
import { pool } from "../config/db.js";

export const getAllDocumentos = async () => {
  const [rows] = await pool.query(
    "SELECT id, titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by, created_at FROM documentos ORDER BY created_at DESC"
  );
  return rows;
};

export const getDocumentoById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM documentos WHERE id = ?", [id]);
  return rows[0];
};

export const createDocumento = async (data) => {
  const { titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by } = data;
  const [res] = await pool.query(
    "INSERT INTO documentos (titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by) VALUES (?,?,?,?,?,?)",
    [titulo, autor, fecha_publicacion, thumbnail, archivo_url, created_by]
  );
  return res.insertId;
};

export const updateDocumento = async (id, data) => {
  const { titulo, autor, fecha_publicacion, thumbnail, archivo_url } = data;
  await pool.query(
    "UPDATE documentos SET titulo=?, autor=?, fecha_publicacion=?, thumbnail=?, archivo_url=?, updated_at=NOW() WHERE id=?",
    [titulo, autor, fecha_publicacion, thumbnail, archivo_url, id]
  );
};

export const deleteDocumento = async (id) => {
  await pool.query("DELETE FROM documentos WHERE id = ?", [id]);
};
