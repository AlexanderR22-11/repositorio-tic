import crypto from "crypto";

let cachedSecret = process.env.JWT_SECRET || "";

if (!cachedSecret) {
  cachedSecret = crypto.randomBytes(32).toString("hex");
  console.warn("[auth] JWT_SECRET no está configurado. Se usará un secreto temporal para esta ejecución.");
}

export function getJwtSecret() {
  return cachedSecret;
}
