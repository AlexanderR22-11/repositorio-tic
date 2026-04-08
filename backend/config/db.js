import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "repositorio_tic"
});

db.connect(err => {
  if (err) {
    console.log("Error conexión MySQL:", err);
  } else {
    console.log("Conectado a MySQL");
  }
});

export default db;