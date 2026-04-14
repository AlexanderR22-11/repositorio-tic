// backend/test-db.js
import db from "./src/db/connection.js";

(async () => {
  try {
    console.log("DB_NAME env:", process.env.DB_NAME || "no definido");
    const [rows] = await db.execute("SELECT DATABASE() AS db, 1 AS ok");
    console.log("DB test result:", rows);
    process.exit(0);
  } catch (err) {
    console.error("DB connection error:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
