import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { EMAIL_CONFIG, SERVER_CONFIG } from "./config.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Crear transportador de correo
const createTransporter = () => {
  console.log("🔧 Configurando transportador SMTP IONOS...");
  return nodemailer.createTransporter({
    ...EMAIL_CONFIG,
    debug: true, // Para debug detallado
    logger: true,
  });
};

// Endpoint principal para enviar correos
app.post("/api/send-email", async (req, res) => {
  try {
    const {
      destinatario,
      asunto,
      contenido,
      tipoPlantilla,
      alumnoData,
      paymentData,
    } = req.body;

    console.log("📧 Petición de envío recibida:", {
      destinatario,
      asunto,
      tipoPlantilla,
      timestamp: new Date().toISOString(),
    });

    // Validaciones
    if (!destinatario || !asunto || !contenido) {
      return res.status(400).json({
        success: false,
        error: "Faltan campos requeridos: destinatario, asunto, contenido",
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return res.status(400).json({
        success: false,
        error: "El email del destinatario no es válido",
      });
    }

    // Crear transportador
    const transporter = createTransporter();

    // Configurar opciones del correo
    const mailOptions = {
      from: {
        name: SERVER_CONFIG.fromName,
        address: SERVER_CONFIG.fromAddress,
      },
      to: destinatario,
      subject: asunto,
      html: contenido.replace(/\n/g, "<br>"),
      text: contenido,
      replyTo: SERVER_CONFIG.fromAddress,
    };

    console.log("📤 Enviando correo con configuración:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
    });

    // Verificar conexión SMTP
    console.log("🔍 Verificando conexión SMTP...");
    await transporter.verify();
    console.log("✅ Conexión SMTP verificada correctamente");

    // Enviar el correo
    console.log("🚀 Enviando correo...");
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Correo enviado exitosamente:", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    // Respuesta exitosa
    res.json({
      success: true,
      messageId: info.messageId,
      info: "Correo enviado exitosamente via IONOS SMTP",
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (error) {
    console.error("❌ Error al enviar correo:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack,
    });

    // Respuesta de error
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      command: error.command,
      info: "Error al enviar correo via IONOS SMTP",
    });
  }
});

// Endpoint de prueba
app.post("/api/test-email", async (req, res) => {
  try {
    console.log("🧪 Enviando correo de prueba...");

    const transporter = createTransporter();

    const testEmail = {
      from: {
        name: SERVER_CONFIG.fromName,
        address: SERVER_CONFIG.fromAddress,
      },
      to: "ganaconinteligenciaartificial@gmail.com",
      subject: "Prueba - Servidor de Correos Academia Piensa Ajedrez",
      html: `
        <h2>🎯 Prueba de Correo - Academia Piensa Ajedrez</h2>
        <p>Este es un correo de prueba del servidor de correos.</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-MX")}</p>
        <p><strong>Estado:</strong> ✅ Servidor funcionando correctamente</p>
        <p><strong>SMTP:</strong> IONOS configurado</p>
        <hr>
        <p><em>Sistema automatizado - No responder</em></p>
      `,
      text: `Prueba de correo - Academia Piensa Ajedrez\n\nFecha: ${new Date().toLocaleString(
        "es-MX"
      )}\nEstado: Servidor funcionando correctamente`,
    };

    await transporter.verify();
    const info = await transporter.sendMail(testEmail);

    res.json({
      success: true,
      message: "Correo de prueba enviado exitosamente",
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    console.error("❌ Error en prueba de correo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint de estado
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Email Server - Academia Piensa Ajedrez",
    timestamp: new Date().toISOString(),
    smtp: {
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
    },
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "📧 Servidor de Correos - Academia Piensa Ajedrez",
    status: "Activo",
    endpoints: [
      "POST /api/send-email - Enviar correo",
      "POST /api/test-email - Enviar correo de prueba",
      "GET /api/health - Estado del servidor",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error("❌ Error no controlado:", error);
  res.status(500).json({
    success: false,
    error: "Error interno del servidor",
    message: error.message,
  });
});

// Iniciar servidor
const port = SERVER_CONFIG.port;
app.listen(port, () => {
  console.log("🚀 =====================================");
  console.log("📧 SERVIDOR DE CORREOS INICIADO");
  console.log("🚀 =====================================");
  console.log(`🌐 Puerto: ${port}`);
  console.log(`📧 SMTP: ${EMAIL_CONFIG.host}:${EMAIL_CONFIG.port}`);
  console.log(`👤 Usuario: ${EMAIL_CONFIG.auth.user}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log("🚀 =====================================");
  console.log("📍 Endpoints disponibles:");
  console.log(`   POST http://localhost:${port}/api/send-email`);
  console.log(`   POST http://localhost:${port}/api/test-email`);
  console.log(`   GET  http://localhost:${port}/api/health`);
  console.log("🚀 =====================================");
});






