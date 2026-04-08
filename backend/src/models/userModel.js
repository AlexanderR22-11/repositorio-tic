import db from "../../config/db.js";

export const getUsers = (callback) => {
  db.query("SELECT * FROM usuarios", callback);
};

export const deleteUser = (id, callback) => {
  db.query("DELETE FROM usuarios WHERE id = ?", [id], callback);
};

export const updateUser = (id, nombre, email, callback) => {
  db.query(
    "UPDATE usuarios SET nombre=?, email=? WHERE id=?",
    [nombre, email, id],
    callback
  );
};