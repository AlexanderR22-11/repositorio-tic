// backend/src/db/connection.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "repositorio_tic",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z"
});

export default pool;
