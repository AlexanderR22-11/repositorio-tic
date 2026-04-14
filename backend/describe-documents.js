import db from "./src/db/connection.js";

(async () => {
  try {
    const schema = process.env.DB_NAME || "repositorio_tic";
    console.log("Using schema:", schema);
    const [cols] = await db.execute(
      "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE table_schema = ? AND table_name = ?",
      [schema, "documents"]
    );
    console.log("columns:", cols);
    const [count] = await db.execute("SELECT COUNT(*) AS total FROM documents");
    console.log("total rows:", count[0].total);
    const [sample] = await db.execute("SELECT * FROM documents LIMIT 5");
    console.log("sample rows:", sample);
    process.exit(0);
  } catch (err) {
    console.error("describe error:", err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
