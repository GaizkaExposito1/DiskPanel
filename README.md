# Panel de administración de archivos

Proyecto completo (backend + frontend) para administrar discos, carpetas y archivos en Windows.

## Resumen rápido:
- Backend: Node.js + Express + i18next + archiver (para descargar carpetas en ZIP)
- Frontend: React (Vite) + react-i18next
- Multilenguaje: Español (es) e Inglés (en). Detección por Accept-Language y selector en UI.
- Seguridad: Modo sandbox forzado en C:\, límite de 95% de uso de disco
- Diseño: Corporativo minimalista profesional

Estructura del proyecto: ver el árbol de ficheros en la entrega.

## Requisitos previos (Windows 10 Home):
- Node.js LTS (>=16)
- Git (opcional)

## Inicio rápido:

### Opción 1: Scripts batch (recomendado)
```batch
# Iniciar ambos servidores a la vez
start-all.bat

# O iniciarlos por separado:
start-backend.bat   # Backend en http://localhost:4000
start-frontend.bat  # Frontend en http://localhost:5173
```

### Opción 2: Manual

Instalación y ejecución (PowerShell):

cd proyecto-root\backend; npm install
cd ..\frontend; npm install

En dos terminales:
cd proyecto-root\backend; npm run dev
cd proyecto-root\frontend; npm run dev

## Configuración

Variables importantes en `backend/.env` (usar `.env.example` como plantilla):
- ADMIN_USER=admin
- ADMIN_PASS=changeme
- JWT_SECRET=tu_secreto
- DEFAULT_LANG=es
- SANDBOX_MODE=false (pero C:\ siempre usa sandbox)
- PORT=4000

## Credenciales por defecto:
- Usuario: `admin`
- Contraseña: `changeme`

## Funcionalidades principales:
- ✅ Visualizar discos y su uso (con código de colores)
- ✅ Navegar por carpetas
- ✅ Crear carpetas
- ✅ Subir archivos (con límite de 95% de uso de disco)
- ✅ Descargar archivos
- ✅ Descargar carpetas completas (ZIP comprimido)
- ✅ Renombrar archivos/carpetas
- ✅ Eliminar archivos/carpetas
- ✅ Dashboard con resumen y gráficos
- ✅ Navegador rápido (Ctrl+K)
- ✅ Auto-refresh configurable
- ✅ Multilenguaje (ES/EN)
- ✅ Modo sandbox forzado en C:\

## Código de colores de uso de disco:
- 🔵 0-59%: Azul (normal)
- 🟡 60-79%: Amarillo (advertencia)
- 🟠 80-89%: Naranja (precaución)
- 🔴 90%+: Rojo (crítico)
- 🚫 95%+: Bloqueado para subidas

## i18n (Internacionalización)

Cómo probar i18n:
- Detectar Accept-Language con curl:
  ```bash
  curl -H "Accept-Language: en" http://localhost:4000/api/disks
  curl -H "Accept-Language: es" http://localhost:4000/api/disks
  ```
- Cambiar idioma en UI con el selector del encabezado (se guarda en cookie/localStorage).

Cómo añadir un nuevo idioma:
1. Añadir carpeta de traducciones en backend `src/locales/xx/translation.json` y frontend `src/locales/xx/translation.json`.
2. Añadir las claves faltantes (ver archivos `translation.json`).
3. Reiniciar backend/frontend (i18next recargará en dev con fs backend).

## Seguridad

Notas sobre seguridad y límites:
- La aplicación opera dentro de una carpeta raíz por disco (ej. D:\\miapp_storage) y valida rutas con `path.resolve` para evitar path traversal.
- **C:\\ siempre opera en modo sandbox** independientemente de la configuración SANDBOX_MODE.
- Límite de subida al 95% de uso de disco para prevenir llenar el sistema.
- Filtrado de archivos del sistema Windows (System Volume Information, $Recycle.Bin, etc.)
- No se usa BBDD como fuente de verdad de archivos.

## Elección de librerías

Elección de librerías i18n:
- Backend: `i18next` + `i18next-fs-backend` + `i18next-http-middleware` — bien soportado en Node y permite recarga desde disco.
- Frontend: `react-i18next` — integración React sencilla y buena detección de lenguaje.

Pros/Contras breves:
- `drivelist` vs `wmic`: `drivelist` es cross-platform y más cómodo; `wmic` es nativo en Windows pero su salida puede variar. Implementamos `drivelist` con fallback a `wmic`.
- `archiver` para compresión ZIP: Librería estable y bien mantenida para crear archivos ZIP en Node.js.

---

**Proyecto listo para usar. Accede a http://localhost:5173 tras iniciar ambos servidores.**
