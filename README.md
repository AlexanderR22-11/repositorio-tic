# Repositorio-TIC

Sistema web académico para la **Universidad Tecnológica de Nayarit**, orientado a la gestión y consulta de material escolar por roles (alumno, maestro y administrador).

## Cobertura de la rúbrica (resumen)

- **Capítulo 1 (Definición del proyecto):** problemática, objetivo y usuarios definidos en la sección de planeación del inicio.
- **Capítulo 2 (Planeación):** funcionalidades clave, módulos y flujo general de uso visibles en la interfaz.
- **Capítulo 3 (Arquitectura):** estructura de páginas base (`/`, `/login`, `/register`, `/dashboard/alumno`, `/dashboard/maestro`) y navegación persistente.
- **Capítulo 4 (UI):** identidad visual consistente con Tailwind + DaisyUI.
- **Capítulo 5 (Frontend):** HTML semántico, componentes visuales y búsqueda interactiva.
- **Capítulo 6 (Usabilidad):** navegación clara, filtros y organización de información por secciones.
- **Capítulo 7 (Responsive):** distribución en `grid` adaptable para móvil y escritorio.
- **Capítulo 8 (Exposición):** guía resumida integrada para explicar problemática, módulos, navegación y planeación de seguridad/autenticación por rol.

## Instalación rápida de dependencias

Desde la raíz del proyecto, ejecuta:

```bash
./install-deps.sh
```

Este script limpia `node_modules` y reinstala dependencias en `backend` y `frontend` con `npm ci`.
