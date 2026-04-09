# Repositorio TIC - Universidad Tecnológica de Nayarit

Sistema web académico para centralizar material didáctico por rol (**alumno, maestro, administrador/superadmin**) con autenticación y rutas protegidas.

## Problemática
En la operación académica, los materiales de clase suelen quedar dispersos en canales distintos (chat, correo, carpetas personales), lo que genera:
- Duplicidad y pérdida de versiones.
- Dificultad para ubicar materiales vigentes por materia.
- Falta de trazabilidad de quién sube/edita/elimina contenido.
- Poca separación de permisos por tipo de usuario.

## Objetivo general
Implementar un repositorio institucional que permita:
- **Alumno:** consultar, buscar y descargar materiales.
- **Maestro:** subir, gestionar y depurar materiales de sus materias asignadas.
- **Administrador:** supervisar usuarios, materias, materiales y salidas de reporte/exportación.

---

## Usuarios del sistema y permisos
### 1) Alumno
- Ver listado de materiales.
- Filtrar por materia/tipo y descargar.
- **No** puede crear, editar ni eliminar materiales.

### 2) Maestro
- Subir materiales y registrar metadatos.
- Editar/eliminar materiales de materias autorizadas.
- Filtrar y buscar sus recursos.

### 3) Administrador / Superadmin
- Gestionar usuarios y materias.
- Supervisar materiales globalmente.
- Ejecutar exportaciones/reporte y tareas administrativas.

---

## Módulos del sistema
1. **Inicio / Exploración pública** (`/`, `/explorar`)
2. **Autenticación** (`/login`, `/register`, `/forgot-password`)
3. **Panel alumno** (`/dashboard/alumno`)
4. **Panel maestro** (`/dashboard/maestro`)
5. **Panel administrador** (`/dashboard/admin`)
6. **Materiales / Documentos** (`/api/documents`)
7. **Administración / Exportaciones / Reportes** (`/api/admin/*`)

---

## Flujo general del sistema
1. El usuario accede a **Inicio** y explora materiales públicos.
2. Inicia sesión en `/login`.
3. El sistema identifica su rol y redirige a su dashboard:
   - alumno -> `/dashboard/alumno`
   - maestro -> `/dashboard/maestro`
   - admin/superadmin -> `/dashboard/admin`
4. Desde su panel, cada rol ejecuta acciones permitidas.
5. Las rutas protegidas bloquean accesos fuera de rol y redirigen al dashboard correspondiente.

---

## Autenticación y protección de rutas

### Frontend
- `RutaProtegida` valida sesión y token.
- Si el rol no coincide con la ruta, redirige al dashboard permitido por rol.
- El login soporta almacenamiento por sesión (`sessionStorage`) o persistente (`localStorage`) según “Recuérdame”.

Archivos clave:
- `frontend/src/components/RutaProtegida.jsx`
- `frontend/src/utils/auth.js`
- `frontend/src/App.jsx`

### Backend
- Middleware unificado:
  - `requireAuth` -> valida JWT.
  - `requireRole` -> autoriza uno o múltiples roles.
- Middlewares legacy (`verifyToken.js`, `roleMiddleware.js`) se mantienen como wrappers para compatibilidad.
- Rutas administrativas montadas en `/api/admin`.

Archivos clave:
- `backend/src/middleware/auth.js`
- `backend/src/middleware/verifyToken.js`
- `backend/src/middleware/roleMiddleware.js`
- `backend/src/routes/adminRoutes.js`

---

## Rutas principales del sistema

### Frontend (UI)
- `/`
- `/explorar`
- `/login`
- `/register`
- `/forgot-password` *(placeholder para exposición)*
- `/dashboard/alumno`
- `/dashboard/maestro`
- `/dashboard/admin`

### Backend (API)
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/register-teacher`
- `GET /api/documents`
- `POST /api/documents`
- `PUT /api/documents/:id`
- `DELETE /api/documents/:id`
- `GET /api/admin/export/csv`
- `GET /api/admin/export/json`
- `GET /api/admin/report/pdf`
- `POST /api/admin/backup`
- `POST /api/admin/restore`

---

## Estado funcional vs simulado
### Funcional
- Login/register (si backend+BD activos).
- Guardas por rol en frontend y backend.
- Gestión básica de materiales.
- Paneles diferenciados por rol.

### Simulado (para exposición)
- Recuperación de contraseña (`/forgot-password`) como placeholder UI.
- Algunas acciones de export/reporte en UI administrativa pueden mostrarse en modo demo según entorno.

---

## Credenciales demo (fallback local)
> Útiles cuando backend/BD no están disponibles durante demostración.
- Alumno: `alumno@utn.com` / `123`
- Maestro: `maestro@utn.com` / `123`
- Admin: `admin@utn.com` / `123`

---

## Variables de entorno

### Backend (`backend/.env`)
```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:5173
JWT_SECRET=coloca_un_secreto_largo_y_unico
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=...
```

### Frontend (`frontend/.env`)
```env
VITE_GOOGLE_CLIENT_ID=
```

---

## Ejecución local
Instala dependencias desde la raíz:
```bash
./install-deps.sh
```

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run dev
```

### Build de producción (frontend)
```bash
cd frontend
npm run build
```
