/**
 * Utilidades para probar el servicio de email
 * Solo para desarrollo y testing
 */

import {
  checkMicroserviceHealth,
  sendEmail,
} from "../services/apiEmailService";

/**
 * Prueba básica del health check del micro-servicio
 */
export async function testMicroserviceHealth() {
  console.log("🩺 Probando health check del micro-servicio...");

  try {
    const health = await checkMicroserviceHealth();

    if (health.available) {
      console.log(
        "✅ Micro-servicio IONOS SMTP está disponible:",
        health.status
      );
      return true;
    } else {
      console.error("❌ Micro-servicio no disponible:", health.error);
      return false;
    }
  } catch (error) {
    console.error("❌ Error al verificar health:", error.message);
    return false;
  }
}

/**
 * Prueba de envío de email de prueba
 */
export async function testSendEmail(
  destinatario = "ganaconinteligenciaartificial@gmail.com"
) {
  console.log("📧 Probando envío de email de prueba...");

  try {
    const result = await sendEmail({
      destinatario,
      asunto: "🧪 Prueba de integración - Micro-servicio IONOS SMTP",
      contenido: `
        ¡Hola!
        
        Este es un email de prueba enviado desde la aplicación Piensa Ajedrez 
        usando el micro-servicio IONOS SMTP desplegado en Render.
        
        ✅ Micro-servicio: https://ionos-smtp-relay.onrender.com
        ✅ SMTP Server: smtp.ionos.com:587 (STARTTLS)
        ✅ Fecha/Hora: ${new Date().toLocaleString("es-ES")}
        
        Si recibes este correo, significa que la integración está funcionando correctamente.
        
        Saludos,
        Sistema de Pagos - Piensa Ajedrez
      `,
      plantilla: "test",
    });

    console.log("✅ Email de prueba enviado exitosamente:", result);
    return result;
  } catch (error) {
    console.error("❌ Error al enviar email de prueba:", error.message);
    throw error;
  }
}

/**
 * Ejecuta todas las pruebas del servicio de email
 */
export async function runAllEmailTests() {
  console.log("🚀 Ejecutando todas las pruebas del servicio de email...");

  try {
    // 1. Probar health check
    const healthOk = await testMicroserviceHealth();

    if (!healthOk) {
      console.error(
        "❌ Health check falló, no se puede continuar con las pruebas"
      );
      return false;
    }

    // 2. Probar envío de email
    await testSendEmail();

    console.log(
      "✅ Todas las pruebas del servicio de email pasaron correctamente!"
    );
    return true;
  } catch (error) {
    console.error(
      "❌ Las pruebas del servicio de email fallaron:",
      error.message
    );
    return false;
  }
}

// Función auxiliar para usar en la consola del navegador
window.testEmailService = {
  health: testMicroserviceHealth,
  send: testSendEmail,
  runAll: runAllEmailTests,
};

console.log(
  "🔧 Utilidades de prueba de email disponibles en window.testEmailService"
);



