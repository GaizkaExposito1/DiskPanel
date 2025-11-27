# Configuración del Dashboard

## Auto-Refresh del Dashboard Principal

El dashboard principal (resumen de discos) se actualiza automáticamente de forma periódica.

### Configuración

Edita el archivo `backend/.env` para cambiar el intervalo de actualización:

```env
# Intervalo de actualización en milisegundos (default: 60000 = 1 minuto)
DASHBOARD_REFRESH_INTERVAL=60000
```

### Ejemplos de configuración:

- **30 segundos**: `DASHBOARD_REFRESH_INTERVAL=30000`
- **1 minuto** (default): `DASHBOARD_REFRESH_INTERVAL=60000`
- **2 minutos**: `DASHBOARD_REFRESH_INTERVAL=120000`
- **5 minutos**: `DASHBOARD_REFRESH_INTERVAL=300000`
- **Desactivar** (0 = sin auto-refresh): `DASHBOARD_REFRESH_INTERVAL=0`

### Características:

✅ **Auto-refresh solo en página principal**: El refresh automático solo funciona cuando estás viendo el resumen global de discos. Cuando seleccionas un disco específico, el auto-refresh se desactiva automáticamente.

✅ **Indicador visual**: En la esquina superior derecha del dashboard verás:
- 🟢 Punto verde pulsante indicando que el auto-refresh está activo
- Intervalo configurado (ej: "Actualización automática: 60s")
- Hora de la última actualización

✅ **Sin interrupciones**: El auto-refresh se ejecuta en segundo plano sin interrumpir tu navegación.

### Nota:
Después de cambiar el valor en `.env`, debes **reiniciar el servidor backend** para que los cambios surtan efecto.
