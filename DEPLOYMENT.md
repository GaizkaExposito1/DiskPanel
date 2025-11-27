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

## Despliegue en IIS (Windows Server / IIS 10+)

### Requisitos previos
1. **IIS instalado** en tu servidor Windows
2. **Node.js** instalado en el servidor (v14+)
3. **iisnode** instalado (permite ejecutar Node.js desde IIS)
4. **URL Rewrite** module instalado en IIS

### Paso 1: Instalar componentes en Windows

```powershell
# 1. Instalar Node.js
# Descargar desde https://nodejs.org/

# 2. Instalar iisnode
# Descargar desde https://github.com/Azure/iisnode/releases
# O desde: https://www.iisnode.org/

# 3. Instalar URL Rewrite Module for IIS
# Descargar desde: https://www.iis.net/downloads/microsoft/url-rewrite
```

### Paso 2: Preparar archivos para IIS

```powershell
# 1. Compilar frontend
cd e:\DashboardApp\proyecto-root\frontend
npm install
npm run build

# 2. Copiar dist a backend (para servir archivos estáticos)
xcopy /E /I /Y dist C:\inetpub\wwwroot\DiskPanel\public\

# 3. Instalar dependencias backend
cd e:\DashboardApp\proyecto-root\backend
npm install --production
```

### Paso 3: Crear carpeta en IIS

```powershell
# Crear la carpeta para la aplicación
mkdir "C:\inetpub\wwwroot\DiskPanel"
mkdir "C:\inetpub\wwwroot\DiskPanel\public"

# Copiar archivos del backend
xcopy /E /I /Y "e:\DashboardApp\proyecto-root\backend\*" "C:\inetpub\wwwroot\DiskPanel\"

# Crear carpeta de logs
mkdir "C:\inetpub\wwwroot\DiskPanel\logs"
```

### Paso 4: Configurar archivo web.config para IIS

Crea `C:\inetpub\wwwroot\DiskPanel\web.config`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- iisnode configuration -->
    <iisnode 
      node_env="production"
      nodeProcessCountPerApplication="1"
      maxLogFiles="20"
      maxLogFileSizeInKB="1024"
      loggingEnabled="true"
      logDirectory="logs"
      watchedFiles="*.js"
      uncFileChangesPollingInterval="5000"
      appendSourceFileNameToErrors="true"
      debuggingEnabled="false"
      enableXFF="true"
    />

    <!-- URL Rewrite para Node.js -->
    <rewrite>
      <rules>
        <rule name="DiskPanel" stopProcessing="true">
          <match url="^(.*)$" ignoreCase="false" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" ignoreCase="false" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" ignoreCase="false" negate="true" />
          </conditions>
          <action type="Rewrite" url="src/index.js" />
        </rule>
      </rules>
    </rewrite>

    <!-- Configuración de seguridad -->
    <security>
      <requestFiltering>
        <fileExtensions>
          <add fileExtension=".js" allowed="true" />
        </fileExtensions>
      </requestFiltering>
    </security>

    <!-- Headers de CORS -->
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
      </customHeaders>
    </httpProtocol>

    <!-- Configuración de máquina virtual -->
    <system.webServer>
      <staticContent>
        <mimeMap fileExtension=".json" mimeType="application/json" />
      </staticContent>
    </system.webServer>
  </system.webServer>

  <!-- Variables de entorno -->
  <appSettings>
    <add key="PORT" value="80" />
    <add key="NODE_ENV" value="production" />
  </appSettings>
</configuration>
```

### Paso 5: Crear sitio web en IIS

1. **Abre IIS Manager**
   - Presiona `Win + R` y escribe `inetmgr`

2. **Crea un nuevo sitio web**
   - Click derecho en "Sites" → "Add Website"
   - **Site name**: `DiskPanel`
   - **Physical path**: `C:\inetpub\wwwroot\DiskPanel`
   - **Host name**: `diskpanel.local` (o tu dominio)
   - **Port**: `80` (o puerto personalizado)

3. **Configura el Application Pool**
   - Click derecho en "Application Pools" → "Add Application Pool"
   - **Name**: `DiskPanel`
   - **.NET CLR version**: `No Managed Code`
   - **Managed pipeline mode**: `Integrated`
   - Click OK

4. **Asigna el Application Pool al sitio**
   - Selecciona el sitio "DiskPanel"
   - En la columna derecha, haz click en "Application Pool"
   - Selecciona `DiskPanel` del dropdown

### Paso 6: Configurar permisos de carpeta

```powershell
# Dar permisos de lectura/escritura a IIS_IUSRS
icacls "C:\inetpub\wwwroot\DiskPanel" /grant "IIS_IUSRS:(OI)(CI)(M)" /T

# O específicamente para la carpeta de logs
icacls "C:\inetpub\wwwroot\DiskPanel\logs" /grant "IIS_IUSRS:(OI)(CI)(M)" /T
```

### Paso 7: Crear archivo .env en IIS

Crea `C:\inetpub\wwwroot\DiskPanel\.env`:

```
PORT=80
JWT_SECRET=tu_secreto_muy_seguro_aqui
APP_ROOT_FOLDER=web_storage
SANDBOX_MODE=false
MAX_UPLOAD_BYTES=104857600
ALLOWED_EXTENSIONS=.txt,.pdf,.jpg,.png,.zip,.docx,.xls,.xlsx,.doc
DASHBOARD_REFRESH_INTERVAL=60000
NODE_ENV=production
LOG_LEVEL=info
```

### Paso 8: Iniciar la aplicación

1. **Desde IIS Manager**
   - Selecciona el sitio "DiskPanel"
   - Click en "Start" (si está detenido)
   - El sitio debe estar "Running" (verde)

2. **Verificar que funciona**
   - Abre navegador: `http://diskpanel.local` (o tu host)
   - Debes ver la aplicación DiskPanel

### Troubleshooting en IIS

**El sitio no inicia**
```powershell
# Revisar logs de iisnode
type "C:\inetpub\wwwroot\DiskPanel\logs\*.txt"

# Reiniciar el Application Pool
Get-WebAppPoolState -Name "DiskPanel" | Restart-WebAppPool
```

**Error "node is not recognized"**
- Node.js no está en PATH
- Solución: Instala Node.js y reinicia IIS
  ```powershell
  iisreset
  ```

**Puerto 80 en uso**
- Cambia el puerto en IIS o en la variable PORT del .env

**Los archivos estáticos no cargan**
- Asegúrate de haber ejecutado `npm run build`
- Verifica que `public/` exista en `C:\inetpub\wwwroot\DiskPanel\`

**CORS errors**
- Las headers ya están configuradas en web.config
- Si persiste, edita `backend/src/app.js` y ajusta CORS

### Monitoreo y Mantenimiento

```powershell
# Ver estado del Application Pool
Get-WebAppPoolState -Name "DiskPanel"

# Detener la aplicación
Stop-WebAppPool -Name "DiskPanel"

# Iniciar la aplicación
Start-WebAppPool -Name "DiskPanel"

# Reciclar el Application Pool
Restart-WebAppPool -Name "DiskPanel"

# Ver logs en tiempo real
Get-Content "C:\inetpub\wwwroot\DiskPanel\logs\*.txt" -Wait
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
