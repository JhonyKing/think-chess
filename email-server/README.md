# 📧 Servidor de Correos - Academia Piensa Ajedrez

Este servidor Node.js maneja el envío de correos electrónicos usando Nodemailer con SMTP de IONOS.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
cd email-server
npm install
```

### 2. Iniciar el servidor

```bash
npm start
```

O desde la raíz del proyecto:

```bash
# Windows
start-email-server.bat

# Linux/Mac
./start-email-server.sh
```

## 📡 Endpoints Disponibles

### POST /api/send-email

Envía un correo electrónico.

**Payload:**

```json
{
  "destinatario": "email@ejemplo.com",
  "asunto": "Asunto del correo",
  "contenido": "Contenido del mensaje...",
  "tipoPlantilla": "CORREO RECORDATORIO",
  "alumnoData": { ... },
  "paymentData": { ... }
}
```

### POST /api/test-email

Envía un correo de prueba para verificar que todo funciona.

### GET /api/health

Verifica el estado del servidor.

## ⚙️ Configuración SMTP

El servidor está configurado para usar IONOS SMTP con las siguientes credenciales:

- **Host:** smtp.ionos.mx
- **Puerto:** 587
- **Seguridad:** STARTTLS
- **Usuario:** Direcciongeneral@piensajedrez.com
- **Contraseña:** [Configurada en config.js]

## 🔧 Troubleshooting

### Error: ECONNREFUSED

- Verificar que el servidor esté ejecutándose en puerto 3001
- Comprobar que no haya otro proceso usando el puerto

### Error: Authentication failed

- Verificar credenciales SMTP en config.js
- Comprobar conectividad a Internet

### Error: CORS

- El servidor ya está configurado para permitir conexiones desde localhost:5173

## 📝 Logs

El servidor muestra logs detallados en consola:

- ✅ Conexiones exitosas
- 📧 Correos enviados
- ❌ Errores detallados
- 🔍 Debug de SMTP






