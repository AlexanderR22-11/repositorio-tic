import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const projectDir = process.cwd();
const viteBin = resolve(projectDir, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite");
const vitePkg = resolve(projectDir, "node_modules", "vite", "package.json");

function safe(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
  } catch {
    return "(no disponible)";
  }
}

console.log("🔎 Diagnóstico rápido de build frontend");
console.log(`- Node: ${safe("node -v")}`);
console.log(`- npm: ${safe("npm -v")}`);
console.log(`- Vite bin: ${existsSync(viteBin) ? "OK" : "FALTA"}`);
console.log(`- Vite pkg: ${existsSync(vitePkg) ? "OK" : "FALTA"}`);

const proxyVars = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"];
for (const key of proxyVars) {
  console.log(`- ${key}: ${process.env[key] ? "configurado" : "no configurado"}`);
}

if (!existsSync(viteBin) || !existsSync(vitePkg)) {
  console.log("\nSugerencia:");
  console.log("1) npm run rebuild:clean");
  console.log("2) Si usas red corporativa: npm config set proxy http://usuario:pass@host:puerto");
  console.log("3) npm config set https-proxy http://usuario:pass@host:puerto");
  console.log("4) npm run build");
}
