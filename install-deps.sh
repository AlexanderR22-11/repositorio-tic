#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install_project() {
  local dir="$1"
  echo "\n==> Instalando dependencias en ${dir}"
  cd "${ROOT_DIR}/${dir}"

  if [[ -d node_modules ]]; then
    python - <<'PY'
import os, shutil
if os.path.isdir('node_modules'):
    shutil.rmtree('node_modules')
print('node_modules limpio')
PY
  fi

  npm ci --no-audit --no-fund
}

install_project backend
install_project frontend

echo "\n✅ Dependencias instaladas en backend y frontend"
