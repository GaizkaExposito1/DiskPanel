# Guía de Despliegue en Producción

## Pasos para poner la aplicación en producción en tu PC

### 1. Build del Frontend
```powershell
cd e:\DashboardApp\proyecto-root\frontend
npm run build
```
Esto generará una carpeta `dist/` con los archivos optimizados.

### 2. Instalar dependencias del Backend
```powershell
cd e:\DashboardApp\proyecto-root\backend
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la carpeta `backend/`:

```
PORT=4000
JWT_SECRET=tu_secreto_muy_seguro_aqui
APP_ROOT_FOLDER=miapp_storage
SANDBOX_MODE=false
MAX_UPLOAD_BYTES=104857600
ALLOWED_EXTENSIONS=.txt,.pdf,.jpg,.png,.zip,.docx,.xls,.xlsx,.doc
DASHBOARD_REFRESH_INTERVAL=60000
NODE_ENV=production
```

**Notas importantes:**
- `JWT_SECRET`: Cambia esto a un valor seguro y único
- `SANDBOX_MODE`: true si quieres limitar al acceso a APP_ROOT_FOLDER, false para acceso completo a discos
- `PORT`: Puerto en el que escuchará el servidor (por defecto 4000)

### 4. Iniciar el servidor en producción
```powershell
cd e:\DashboardApp\proyecto-root\backend
npm start
```

O si quieres usar `node` directamente:
```powershell
node src/index.js
```

El servidor servirá:
- **Backend API** en `http://79.116.36.78:4000/api/*`
- **Frontend** en `http://79.116.36.78:4000/`

### 5. Acceder a la aplicación
Abre tu navegador y ve a:
```
http://79.116.36.78:4000
```

## Automatizar el inicio (Opcional)

### Opción A: Crear un archivo de inicio
Crea `start-production.bat`:

```batch
@echo off
cd /d e:\DashboardApp\proyecto-root\backend
node src/index.js
pause
```

### Opción B: Usar PM2 (Gestor de procesos)
```powershell
npm install -g pm2

# Iniciar la app
pm2 start src/index.js --name "DashboardApp"

# Ver logs
pm2 logs DashboardApp

# Detener
pm2 stop DashboardApp

# Reiniciar al encender PC
pm2 startup
pm2 save
```

## Configuración de seguridad para producción

1. **JWT Secret**: Genera un valor fuerte
   ```powershell
   [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

2. **HTTPS** (Opcional): Si quieres HTTPS local, necesitarás un certificado SSL
   - Puedes generar uno autofirmado con OpenSSL

3. **Credenciales**: Cambia las credenciales predeterminadas en la base de datos

## Troubleshooting

**Error: "Cannot find module"**
- Ejecuta `npm install` en la carpeta backend

**Puerto 4000 en uso**
- Cambia PORT en `.env` o cierra la aplicación que lo usa

**Frontend no se carga**
- Asegúrate de haber ejecutado `npm run build` en frontend/
- Verifica que la carpeta `frontend/dist/` existe

**CORS error**
- La configuración ya permite todas las origins en producción
- Si aún hay problemas, ajusta CORS en `backend/src/app.js`
