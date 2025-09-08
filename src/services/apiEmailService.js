import supabase from "./supabase";
import { generateEmailHTML } from "../templates/emailTemplate";

// Configuración del micro-servicio IONOS SMTP
const MICROSERVICE_CONFIG = {
  endpoint: "https://ionos-smtp-relay.onrender.com",
  timeout: 30000, // 30 segundos de timeout
  healthEndpoint: "/health",
};

/**
 * Verifica si el micro-servicio está disponible
 */
export async function checkMicroserviceHealth() {
  try {
    const response = await fetch(
      `${MICROSERVICE_CONFIG.endpoint}${MICROSERVICE_CONFIG.healthEndpoint}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 segundos de timeout para health check
      }
    );

    if (response.ok) {
      const health = await response.json();
      console.log("✅ Micro-servicio IONOS SMTP disponible:", health);
      return { available: true, status: health };
    } else {
      console.warn(
        "⚠️ Micro-servicio responde pero con error:",
        response.status
      );
      return { available: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.warn("⚠️ Micro-servicio no disponible:", error.message);
    return { available: false, error: error.message };
  }
}

/**
 * Obtiene la configuración de correo desde la base de datos
 * El micro-servicio IONOS SMTP maneja toda la configuración SMTP internamente
 */
export async function getEmailConfig() {
  try {
    const { data, error } = await supabase
      .from("CORREO")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      // Si no hay configuración en BD, usar configuración por defecto
      return {
        NombreRemitente: "Piensa Ajedrez",
        EmailEnvio: "direcciongeneral@piensaajedrez.com",
        EmailRespuesta: "direcciongeneral@piensaajedrez.com",
        MicroserviceEndpoint: MICROSERVICE_CONFIG.endpoint,
      };
    }

    return {
      ...data,
      MicroserviceEndpoint: MICROSERVICE_CONFIG.endpoint,
    };
  } catch (error) {
    console.error("Error al obtener configuración de correo:", error);
    throw error;
  }
}

/**
 * Obtiene plantillas de correo por tipo
 */
export async function getEmailTemplateByType(tipoPlantilla) {
  try {
    const { data, error } = await supabase
      .from("PLANTILLADECORREO")
      .select("*")
      .eq("TipoDeCorreo", tipoPlantilla)
      .limit(1)
      .single();

    if (error) {
      console.error("Error al obtener plantilla:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error al obtener plantilla de correo:", error);
    return null;
  }
}

/**
 * Obtiene todas las plantillas de correo disponibles
 */
export async function getAllEmailTemplates() {
  try {
    const { data, error } = await supabase
      .from("PLANTILLADECORREO")
      .select("*")
      .order("TipoDeCorreo");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener plantillas:", error);
    throw error;
  }
}

/**
 * Actualiza plantillas de correo para cambiar texto morado a blanco
 */
export async function fixPurpleTextInTemplates() {
  try {
    console.log("🔧 Corrigiendo texto morado en plantillas...");

    const { data: templates, error } = await supabase
      .from("PLANTILLADECORREO")
      .select("*");

    if (error) throw error;

    for (const template of templates) {
      let plantillaModificada = template.Plantilla;
      let cambiosRealizados = false;

      // Cambiar colores morados a blanco
      const coloresMorados = [
        "#9E9B94",
        "#purple",
        "#9370DB",
        "#8A2BE2",
        "#663399",
      ];

      for (const colorMorado of coloresMorados) {
        if (plantillaModificada.includes(colorMorado)) {
          plantillaModificada = plantillaModificada.replace(
            new RegExp(colorMorado, "gi"),
            "#CFCAC0"
          );
          cambiosRealizados = true;
        }
      }

      // También cambiar color: purple; a color: #CFCAC0;
      if (plantillaModificada.includes("color: purple")) {
        plantillaModificada = plantillaModificada.replace(
          /color:\s*purple/gi,
          "color: #CFCAC0"
        );
        cambiosRealizados = true;
      }

      if (cambiosRealizados) {
        const { error: updateError } = await supabase
          .from("PLANTILLADECORREO")
          .update({ Plantilla: plantillaModificada })
          .eq("id", template.id);

        if (updateError) {
          console.error(
            `Error actualizando plantilla ${template.TipoDeCorreo}:`,
            updateError
          );
        } else {
          console.log(`✅ Plantilla ${template.TipoDeCorreo} actualizada`);
        }
      }
    }

    console.log("🎨 Corrección de colores completada");
    return true;
  } catch (error) {
    console.error("❌ Error corrigiendo colores:", error);
    throw error;
  }
}

/**
 * Procesa una plantilla reemplazando variables con datos del alumno/pago
 */
export function processEmailTemplate(template, data) {
  if (!template || !template.Plantilla) {
    console.error("❌ Template inválido:", template);
    return {
      asunto: "Sin asunto",
      contenido: "Sin contenido",
      template: "Sin plantilla",
    };
  }

  let plantillaCompleta = template.Plantilla;

  // Extraer asunto y contenido de la plantilla
  let asunto = "";
  let contenido = plantillaCompleta;

  // Si la plantilla tiene formato "Asunto: ... \n\n contenido"
  if (plantillaCompleta.startsWith("Asunto:")) {
    const lineas = plantillaCompleta.split("\n");
    asunto = lineas[0].replace("Asunto:", "").trim();
    contenido = lineas.slice(2).join("\n").trim(); // Saltar línea vacía
  }

  console.log("📧 Procesando plantilla:", {
    tipo: template.TipoDeCorreo,
    asuntoOriginal: asunto,
    contenidoLength: contenido.length,
    data: data,
  });

  // Variables disponibles para reemplazar (usando exactamente las que están en la BD)
  const variables = {
    "{{Nombre}}": data.nombreAlumno || data.NumeroControl || "",
    "{{NumeroControl}}": data.NumeroControl || "",
    "{{ApellidoPaterno}}": data.apellidoPaterno || "",
    "{{ApellidoMaterno}}": data.apellidoMaterno || "",
    "{{NombreEscuela}}": data.escuela || data.nombreEscuela || "",
    "{{Monto}}": data.monto ? `$${Number(data.monto).toFixed(2)}` : "$0.00",
    "{{MontoTotal}}": data.montoTotal
      ? `$${Number(data.montoTotal).toFixed(2)}`
      : "$0.00",
    "{{Abonado}}": data.monto ? `$${Number(data.monto).toFixed(2)}` : "$0.00",
    "{{SaldoPendiente}}": data.saldoPendiente
      ? `$${Number(data.saldoPendiente).toFixed(2)}`
      : "$0.00",
    "{{FechaPago}}": data.fecha || new Date().toLocaleDateString("es-MX"),
    "{{FechaActual}}": data.fecha || new Date().toLocaleDateString("es-MX"),
    "{{FechaVencimiento}}":
      data.fecha || new Date().toLocaleDateString("es-MX"),
    "{{FechaLimite}}": data.fecha || new Date().toLocaleDateString("es-MX"),
    "{{MontoConRecargo}}": data.montoConRecargo
      ? `$${Number(data.montoConRecargo).toFixed(2)}`
      : "$0.00",
    "{{Descripcion}}": data.descripcion || data.concepto || "",
    "{{MetodoDePago}}": data.metodoPago || "Efectivo",
    "{{MensualidadPorAlumno}}": data.montoTotal || "$0.00",
  };

  // Reemplazar variables en contenido y asunto
  Object.entries(variables).forEach(([variable, valor]) => {
    contenido = contenido.replace(
      new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"),
      valor
    );
    asunto = asunto.replace(
      new RegExp(variable.replace(/[{}]/g, "\\$&"), "g"),
      valor
    );
  });

  console.log("✅ Plantilla procesada:", {
    asuntoFinal: asunto,
    contenidoPreview: contenido.substring(0, 100) + "...",
  });

  return {
    asunto: asunto || `Notificación - ${template.TipoDeCorreo}`,
    contenido,
    template: template.TipoDeCorreo,
  };
}

/**
 * Envía email usando el micro-servicio IONOS SMTP desplegado en Render
 */
export async function sendEmail(emailData) {
  try {
    console.log(
      "📧 Enviando correo usando micro-servicio IONOS SMTP en Render:",
      {
        destinatario: emailData.destinatario,
        asunto: emailData.asunto,
        servicio: MICROSERVICE_CONFIG.endpoint,
      }
    );

    // Verificar que el micro-servicio esté disponible (opcional, pero útil para debugging)
    // Comentado para evitar latencia adicional, pero se puede descomentar si hay problemas
    // const health = await checkMicroserviceHealth();
    // if (!health.available) {
    //   console.warn("⚠️ Micro-servicio no disponible, intentando enviar de todas formas...");
    // }

    // Preparar los datos para el micro-servicio
    const emailPayload = {
      to: emailData.destinatario,
      subject: emailData.asunto,
      html: emailData.contenido.replace(/\n/g, "<br>"), // Convertir saltos de línea a HTML
      text: emailData.contenido, // También enviar version texto plano
    };

    let result;

    try {
      // Llamar al micro-servicio IONOS SMTP desplegado en Render
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        MICROSERVICE_CONFIG.timeout
      );

      const response = await fetch(`${MICROSERVICE_CONFIG.endpoint}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Mapear errores específicos del micro-servicio
        if (response.status === 422) {
          throw new Error(
            `Error de validación: ${
              errorData.message || "Datos de email inválidos"
            }`
          );
        } else if (response.status === 500) {
          throw new Error(
            `Error del servidor SMTP: ${
              errorData.message || "Error interno del servidor"
            }`
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit excedido. Intente nuevamente en unos momentos."
          );
        }

        throw new Error(
          errorData.message ||
            errorData.error ||
            `Error del servidor: ${response.status} ${response.statusText}`
        );
      }

      result = await response.json();
      console.log(
        "✅ Correo enviado EXITOSAMENTE via micro-servicio IONOS:",
        result
      );

      // Validar respuesta del micro-servicio
      if (!result.messageId) {
        console.warn("⚠️ Respuesta del micro-servicio sin messageId:", result);
      }
    } catch (emailError) {
      console.error("❌ ERROR AL ENVIAR CORREO:", emailError.message);

      // Verificar si es un error de abort/timeout
      if (emailError.name === "AbortError") {
        throw new Error(
          `❌ TIMEOUT AL ENVIAR CORREO. El micro-servicio tardó más de ${
            MICROSERVICE_CONFIG.timeout / 1000
          } segundos en responder. ` +
            "Esto puede ser normal en el primer uso (cold start). Intente nuevamente."
        );
      }

      // Verificar si es un error de conexión al micro-servicio
      if (
        emailError.message.includes("Failed to fetch") ||
        emailError.message.includes("ERR_CONNECTION_REFUSED") ||
        emailError.message.includes("NetworkError")
      ) {
        throw new Error(
          "❌ NO SE PUEDE CONECTAR AL MICRO-SERVICIO DE CORREOS. " +
            `El servicio está desplegado en ${MICROSERVICE_CONFIG.endpoint}. ` +
            "Verifique su conexión a internet o que el servicio esté disponible."
        );
      }

      // Re-lanzar el error original si ya tiene un mensaje descriptivo
      throw emailError;
    }

    // Registrar el envío exitoso en logs
    await logEmailSent({
      destinatario: emailData.destinatario,
      asunto: emailData.asunto,
      plantilla: emailData.plantilla,
      fechaEnvio: new Date().toISOString(),
      estado: "enviado",
      messageId: result.messageId,
    });

    console.log("✅ Correo enviado exitosamente:", result);

    return {
      success: true,
      messageId: result.messageId,
      message: "Correo enviado exitosamente",
    };
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);

    // Registrar el error en logs
    await logEmailSent({
      destinatario: emailData.destinatario,
      asunto: emailData.asunto,
      plantilla: emailData.plantilla,
      fechaEnvio: new Date().toISOString(),
      estado: "error",
      error: error.message,
    });

    throw error;
  }
}

/**
 * Registra el envío de email en logs (opcional, para auditoría)
 */
async function logEmailSent(logData) {
  try {
    // Aquí podrías guardar en una tabla de logs si la tienes
    console.log("📋 Log de envío:", logData);
  } catch (error) {
    console.error("Error al registrar log de email:", error);
  }
}

/**
 * Envía correo usando plantillas HTML personalizadas y datos de la BD
 */
export async function sendEmailWithTemplate(
  tipoPlantilla,
  alumnoData,
  paymentData = {}
) {
  try {
    // Corregir texto morado al inicio (solo una vez)
    if (!window.emailTemplatesFixed) {
      await fixPurpleTextInTemplates();
      window.emailTemplatesFixed = true;
    }
    console.log("📧 Enviando correo con plantilla:", tipoPlantilla);
    console.log("👤 Datos del alumno:", alumnoData);
    console.log("💰 Datos del pago:", paymentData);

    // Validar que el alumno tenga correo
    const destinatario = alumnoData.Correo || paymentData.Correo;
    if (!destinatario) {
      throw new Error("El alumno no tiene correo electrónico registrado");
    }

    // Obtener información de la escuela del alumno para calcular montos correctos
    let schoolInfo = null;
    if (alumnoData.NombreEscuela) {
      try {
        const { data: schoolData, error } = await supabase
          .from("ESCUELA")
          .select("MensualidadPorAlumno, Inscripcion")
          .eq("Nombre", alumnoData.NombreEscuela)
          .single();

        if (!error && schoolData) {
          schoolInfo = schoolData;
          console.log("📚 Información de escuela obtenida:", schoolData);
        }
      } catch (err) {
        console.warn("⚠️ No se pudo obtener información de la escuela:", err);
      }
    }

    // Calcular monto total según el tipo de pago
    let montoTotal = 0;
    if (paymentData.MesPagado === "Inscripcion" && schoolInfo?.Inscripcion) {
      montoTotal = schoolInfo.Inscripcion;
    } else if (schoolInfo?.MensualidadPorAlumno) {
      montoTotal = schoolInfo.MensualidadPorAlumno;
    }

    console.log("💰 Monto total calculado:", {
      mesPagado: paymentData.MesPagado,
      montoTotal,
      inscripcion: schoolInfo?.Inscripcion,
      mensualidad: schoolInfo?.MensualidadPorAlumno,
    });

    // Preparar datos del estudiante
    const studentData = {
      nombre: alumnoData.Nombre
        ? `${alumnoData.Nombre} ${alumnoData.ApellidoPaterno || ""} ${
            alumnoData.ApellidoMaterno || ""
          }`.trim()
        : alumnoData.NumeroControl,
      numeroControl: alumnoData.NumeroControl,
      escuela: alumnoData.NombreEscuela,
      correo: destinatario,
    };

    // Preparar datos del pago
    const paymentDetails = {
      numeroRecibo: paymentData.NumeroRecibo || "",
      numeroControl: alumnoData.NumeroControl,
      concepto: paymentData.MesPagado || "Pago",
      monto: paymentData.Monto ? Number(paymentData.Monto).toFixed(2) : "0.00",
      montoTotal: montoTotal ? Number(montoTotal).toFixed(2) : "0.00",
      saldoPendiente: paymentData.SaldoPendiente
        ? Number(paymentData.SaldoPendiente).toFixed(2)
        : "0.00",
      fecha: paymentData.FechaHora
        ? new Date(paymentData.FechaHora).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date().toLocaleDateString("es-ES"),
      metodoPago: paymentData.MetodoPago || "Efectivo",
      descripcion: paymentData.MesPagado || "Mensualidad",
    };

    // SIEMPRE usar plantillas de la base de datos
    console.log("📝 Obteniendo plantilla de la BD:", tipoPlantilla);
    const template = await getEmailTemplateByType(tipoPlantilla);

    if (!template) {
      throw new Error(`No se encontró plantilla para tipo: ${tipoPlantilla}`);
    }

    console.log("✅ Plantilla encontrada:", {
      tipo: template.TipoDeCorreo,
      plantillaLength: template.Plantilla?.length || 0,
    });

    // Procesar plantilla con datos reales de la BD
    const emailContent = processEmailTemplate(template, {
      nombreAlumno: studentData.nombre,
      NumeroControl: alumnoData.NumeroControl,
      apellidoPaterno: alumnoData.ApellidoPaterno || "",
      apellidoMaterno: alumnoData.ApellidoMaterno || "",
      escuela: alumnoData.NombreEscuela || "",
      nombreEscuela: alumnoData.NombreEscuela || "",
      monto: paymentData.Monto,
      montoTotal: paymentDetails.montoTotal,
      saldoPendiente: paymentData.SaldoPendiente,
      fecha: paymentDetails.fecha,
      concepto: paymentDetails.concepto,
      numeroRecibo: paymentDetails.numeroRecibo,
      metodoPago: paymentDetails.metodoPago,
      descripcion: paymentDetails.descripcion,
    });

    // Generar HTML con plantilla de la BD
    const htmlContent = generateEmailHTML({
      titulo: emailContent.asunto || tipoPlantilla,
      contenido: emailContent.contenido,
    });

    const asunto = emailContent.asunto || `${tipoPlantilla} - Piensa Ajedrez`;

    console.log("📧 Email preparado:", {
      destinatario,
      asunto,
      tipoPlantilla,
    });

    // Enviar el correo
    const result = await sendEmail({
      destinatario,
      asunto,
      contenido: htmlContent,
      plantilla: tipoPlantilla,
    });

    console.log("✅ Correo enviado exitosamente:", result);
    return result;
  } catch (error) {
    console.error("❌ Error al enviar correo con plantilla:", error);
    throw error;
  }
}

/**
 * Envía recordatorios masivos a alumnos con adeudos
 */
export async function sendMassReminders(
  alumnosConAdeudo,
  mesPagado,
  tipoPlantilla = "CORREO RECORDATORIO"
) {
  try {
    console.log(
      `📧 Enviando ${alumnosConAdeudo.length} correos masivos de tipo: ${tipoPlantilla}`
    );
    const results = [];

    for (const alumno of alumnosConAdeudo) {
      try {
        const result = await sendEmailWithTemplate(tipoPlantilla, alumno, {
          MesPagado: mesPagado,
          Monto: 0, // Para recordatorios no hay monto específico
          SaldoPendiente: 0,
          FechaHora: new Date().toISOString(),
          NumeroRecibo: "",
        });

        results.push({
          alumno: alumno.NumeroControl,
          nombre: `${alumno.Nombre || ""} ${
            alumno.ApellidoPaterno || ""
          }`.trim(),
          success: true,
          result,
        });

        console.log(
          `✅ Correo enviado a ${alumno.NumeroControl}: ${result.messageId}`
        );
      } catch (error) {
        console.error(
          `❌ Error enviando a ${alumno.NumeroControl}:`,
          error.message
        );
        results.push({
          alumno: alumno.NumeroControl,
          nombre: `${alumno.Nombre || ""} ${
            alumno.ApellidoPaterno || ""
          }`.trim(),
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      `📊 Envío masivo completado: ${results.filter((r) => r.success).length}/${
        results.length
      } exitosos`
    );
    return results;
  } catch (error) {
    console.error("Error en envío masivo:", error);
    throw error;
  }
}

// Funciones auxiliares eliminadas - ahora usamos backend Node.js directo
