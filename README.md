# IONOS SMTP Relay - Micro-servicio de Email

Micro-servicio HTTP desarrollado con Node.js + Express para envío de emails usando IONOS SMTP a través de Nodemailer.

## Características

- ✅ **Seguridad**: Helmet, CORS, Rate Limiting
- ✅ **Validación**: Esquemas Zod para validación robusta
- ✅ **Logging**: Pino con request IDs para trazabilidad
- ✅ **Health Check**: Endpoint GET /health
- ✅ **SMTP IONOS**: Configuración optimizada para smtp.ionos.com
- ✅ **Attachments**: Soporte para archivos adjuntos en base64
- ✅ **Error Handling**: Mapeo inteligente de errores SMTP
- ✅ **Production Ready**: Blueprint para Render

## Instalación Local

### 1. Clonar y configurar

```bash
git clone <tu-repo>
cd ionos-smtp-relay
npm install
cp .env.example .env
```

### 2. Configurar variables de entorno

Edita el archivo `.env` con tus credenciales de IONOS:

```env
SMTP_HOST=smtp.ionos.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@dominio.com
SMTP_PASS=tu-contraseña
FROM_EMAIL=Tu Nombre <tu-email@dominio.com>
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
PORT=10000
```

### 3. Iniciar servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:10000`

## Uso

### Health Check

```bash
curl -s http://localhost:10000/health
```

**Respuesta:**

```json
{ "status": "ok" }
```

### Enviar Email Simple

```bash
curl -X POST http://localhost:10000/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ganaconinteligenciaartificial@gmail.com",
    "subject": "Prueba desde IONOS",
    "text": "Hola desde nuestro micro-servicio!"
  }'
```

### Enviar Email con HTML

```bash
curl -X POST http://localhost:10000/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["email1@domain.com", "email2@domain.com"],
    "subject": "Email con HTML",
    "html": "<h1>¡Hola!</h1><p>Este es un email con <strong>HTML</strong></p>"
  }'
```

### Enviar Email con Attachment

```bash
curl -X POST http://localhost:10000/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@domain.com",
    "subject": "Email con adjunto",
    "text": "Email con archivo adjunto",
    "attachments": [
      {
        "filename": "documento.pdf",
        "content": "JVBERi0xLjQKJcKlwrHCqcOX...",
        "contentType": "application/pdf"
      }
    ]
  }'
```

**Respuesta exitosa:**

```json
{
  "messageId": "<12345@ionos.com>",
  "accepted": ["destinatario@domain.com"],
  "rejected": []
}
```

## Configuración SMTP IONOS

### Opción 1: Puerto 587 con STARTTLS (Recomendado)

```env
SMTP_PORT=587
SMTP_SECURE=false
```

### Opción 2: Puerto 465 con SSL

```env
SMTP_PORT=465
SMTP_SECURE=true
```

## Rate Limiting

- **Ventana**: 60 segundos (configurable con `RATE_LIMIT_WINDOW_MS`)
- **Límite**: 30 requests por ventana (configurable con `RATE_LIMIT_MAX`)
- **Headers**: Incluye `X-RateLimit-*` headers en respuestas

## Códigos de Error

| Código | Descripción                 |
| ------ | --------------------------- |
| 400    | Request malformada          |
| 401    | Error de autenticación SMTP |
| 422    | Datos de entrada inválidos  |
| 429    | Rate limit excedido         |
| 502    | Error de conexión SMTP      |
| 500    | Error interno del servidor  |

## Despliegue en Render

### 1. Usando Blueprint (render.yaml)

El proyecto incluye un archivo `render.yaml` para despliegue automático:

```bash
# Conectar tu repositorio GitHub a Render
# Render detectará automáticamente el archivo render.yaml
```

### 2. Configurar Secrets en Render Dashboard

En el Dashboard de Render, crear los siguientes secrets:

- `smtp_user`: Tu email de IONOS
- `smtp_pass`: Tu contraseña de IONOS

### 3. Variables de entorno automáticas

El blueprint configura automáticamente:

- `SMTP_HOST=smtp.ionos.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `FROM_EMAIL=No Reply <direcciongeneral@piensaajedrez.com>`
- Rate limiting por defecto

## Troubleshooting

### Error de autenticación

```
Error 401: Error de autenticación SMTP
```

- Verificar `SMTP_USER` y `SMTP_PASS`
- Asegurar que la cuenta IONOS tenga SMTP habilitado

### Error de conexión

```
Error 502: Error de conexión con el servidor SMTP
```

- Verificar `SMTP_HOST=smtp.ionos.com`
- Probar puerto 465 con `SMTP_SECURE=true`
- Revisar firewall/proxy

### Email rechazado

```
Error 422: Dirección de email inválida o rechazada
```

- Verificar formato de emails en campo `to`
- Confirmar que el dominio `FROM_EMAIL` esté verificado en IONOS

### Timeout

- Aumentar timeout en configuración de red
- Verificar conexión a internet

## Desarrollo

### Scripts disponibles

```bash
npm start    # Iniciar servidor
npm run dev  # Iniciar en modo desarrollo
npm run lint # Ejecutar linter
```

### Estructura del proyecto

```
ionos-smtp-relay/
├── src/
│   └── validate.js     # Esquemas de validación Zod
├── server.js           # Servidor Express principal
├── package.json        # Dependencias y scripts
├── render.yaml         # Blueprint para Render
├── .env.example        # Variables de entorno de ejemplo
└── README.md          # Documentación
```

## Licencia

MIT License
