// backend/decodeToken.js
import jwt from "jsonwebtoken";
const token = process.argv[2];
console.log("decode:", jwt.decode(token, { complete: true }));
try {
  console.log("verify:", jwt.verify(token, process.env.JWT_SECRET || "dev_secret"));
} catch (e) {
  console.error("verify error:", e.message);
}
