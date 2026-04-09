import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectDir = resolve(__dirname, "..");
const nodeModulesDir = resolve(projectDir, "node_modules");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

try {
  console.log("🧹 Limpiando node_modules...");
  if (existsSync(nodeModulesDir)) {
    rmSync(nodeModulesDir, { recursive: true, force: true });
  }

  console.log("📦 Instalando dependencias con npm ci...");
  execSync(`${npmCmd} ci`, { cwd: projectDir, stdio: "inherit" });

  console.log("🏗️ Ejecutando build...");
  execSync(`${npmCmd} run build`, { cwd: projectDir, stdio: "inherit" });

  console.log("✅ Build completado correctamente");
} catch (error) {
  console.error("❌ Falló la reconstrucción limpia.");
  console.error("Tip: revisa red/proxy y versión de Node (recomendado Node 20+).");
  process.exit(1);
}
