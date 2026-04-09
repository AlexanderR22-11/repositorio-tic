# Frontend (React + Vite)

Este frontend usa **Vite**, por lo que antes de compilar debes instalar dependencias del proyecto.

## Instalación

```bash
cd frontend
npm install
```

## Ejecución local

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

Si te aparece el error:

```bash
sh: 1: vite: not found
```

significa que **no están instaladas correctamente las dependencias** (o `node_modules` quedó incompleto).

### Pasos recomendados para corregirlo


### Opción rápida (recomendada)

Puedes ejecutar una reconstrucción limpia automática con:

```bash
npm run rebuild:clean
```

Este comando:
- elimina `node_modules`,
- ejecuta `npm ci`,
- y después `npm run build`.

1. Verifica versión de Node (se recomienda Node 20+):

```bash
node -v
```

2. Reinstala dependencias:

```bash
cd frontend
npm install
```

3. Si persiste, elimina `node_modules` y reinstala (en tu máquina local):

```bash
rm -rf node_modules
npm ci
npm run build
```

## Capturas de pantalla en este entorno de agente

Cuando el entorno no expone `browser_container`, el agente **no puede generar screenshots automáticos**.
En ese caso, realiza una validación visual manual local:

```bash
cd frontend
npm run dev
```

Y toma capturas desde tu navegador para adjuntarlas al PR.


## ¿Cómo solucionarlo manualmente?

Si `npm run rebuild:clean` se queda colgado, normalmente es problema de red/proxy y no de código.

1. Ejecuta diagnóstico:

```bash
cd frontend
npm run diagnose:build
```

2. Si estás en red corporativa, configura proxy npm (reemplaza datos):

```bash
npm config set proxy http://USUARIO:PASS@HOST:PUERTO
npm config set https-proxy http://USUARIO:PASS@HOST:PUERTO
```

3. Limpia y reinstala:

```bash
npm run rebuild:clean
```

4. Si aún falla, prueba instalación normal:

```bash
npm install
npm run build
```

5. Verifica que exista el binario:

```bash
ls node_modules/.bin/vite
```

Si ese archivo no existe, la instalación quedó incompleta.
