import supabase from "./supabase";

// Configuración SMTP de IONOS
const IONOS_CONFIG = {
  host: "smtp.ionos.mx",
  port: 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: "piensaajedrez.com",
    pass: "14100090.Dominio",
  },
  tls: {
    rejectUnauthorized: false, // Para evitar problemas con certificados
  },
};

/**
 * Obtiene la configuración de correo desde la base de datos
 * Si no existe, usa la configuración por defecto de IONOS
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
        ServidorSMTP: IONOS_CONFIG.host,
        Puerto: IONOS_CONFIG.port,
        EmailEnvio: IONOS_CONFIG.auth.user,
        Password: IONOS_CONFIG.auth.pass,
        NombreRemitente: "Piensa Ajedrez",
        EmailRespuesta: IONOS_CONFIG.auth.user,
      };
    }

    return data;
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
      .from("PLANTILLASDECORREO")
      .select("*")
      .eq("TipoPlantilla", tipoPlantilla)
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
      .from("PLANTILLASDECORREO")
      .select("*")
      .order("TipoPlantilla");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener plantillas:", error);
    throw error;
  }
}

/**
 * Procesa una plantilla reemplazando variables con datos del alumno/pago
 */
export function processEmailTemplate(template, data) {
  if (!template || !template.Contenido) return "";

  let contenido = template.Contenido;
  let asunto = template.Asunto || "";

  // Variables disponibles para reemplazar
  const variables = {
    "{{NOMBRE}}": data.nombreAlumno || data.NumeroControl || "",
    "{{MES}}": data.mesPagado || "",
    "{{MONTO}}": data.monto ? `$${Number(data.monto).toFixed(2)}` : "$0.00",
    "{{SALDO}}": data.saldo ? `$${Number(data.saldo).toFixed(2)}` : "$0.00",
    "{{FECHA}}": data.fecha || new Date().toLocaleDateString("es-MX"),
    "{{ESCUELA}}": data.escuela || "",
    "{{NUMERO_CONTROL}}": data.NumeroControl || "",
    "{{NUMERO_RECIBO}}": data.numeroRecibo || "",
  };

  // Reemplazar variables en contenido y asunto
  Object.entries(variables).forEach(([variable, valor]) => {
    contenido = contenido.replace(new RegExp(variable, "g"), valor);
    asunto = asunto.replace(new RegExp(variable, "g"), valor);
  });

  return {
    asunto,
    contenido,
    template: template.Nombre,
  };
}

/**
 * Simula el envío de email (aquí se integraría con el API real de IONOS)
 * Por ahora devuelve una promesa que simula el envío
 */
export async function sendEmail(emailData) {
  try {
    // Obtener configuración de correo
    const config = await getEmailConfig();

    console.log("📧 Enviando correo con configuración IONOS:", {
      servidor: config.ServidorSMTP,
      puerto: config.Puerto,
      usuario: config.EmailEnvio,
      para: emailData.destinatario,
      asunto: emailData.asunto,
    });

    // Simular delay de envío
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Aquí iría la integración real con nodemailer o el API de IONOS
    // Por ahora simulamos un envío exitoso

    // Registrar el envío en logs (opcional)
    await logEmailSent({
      destinatario: emailData.destinatario,
      asunto: emailData.asunto,
      plantilla: emailData.plantilla,
      fechaEnvio: new Date().toISOString(),
      estado: "enviado",
    });

    return {
      success: true,
      messageId: `sim_${Date.now()}`,
      message: "Correo enviado exitosamente",
    };
  } catch (error) {
    console.error("Error al enviar correo:", error);

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
 * Envía correo usando una plantilla específica
 */
export async function sendEmailWithTemplate(
  tipoPlantilla,
  alumnoData,
  paymentData = {}
) {
  try {
    // Obtener la plantilla
    const template = await getEmailTemplateByType(tipoPlantilla);

    if (!template) {
      throw new Error(`No se encontró plantilla para tipo: ${tipoPlantilla}`);
    }

    // Procesar la plantilla con los datos
    const emailContent = processEmailTemplate(template, {
      nombreAlumno: alumnoData.Nombre
        ? `${alumnoData.Nombre} ${alumnoData.ApellidoPaterno || ""}`.trim()
        : alumnoData.NumeroControl,
      NumeroControl: alumnoData.NumeroControl,
      mesPagado: paymentData.MesPagado,
      monto: paymentData.Monto,
      saldo: paymentData.SaldoPendiente,
      fecha: paymentData.FechaHora,
      escuela: alumnoData.NombreEscuela,
      numeroRecibo: paymentData.NumeroRecibo,
    });

    // Validar que el alumno tenga correo
    const destinatario = alumnoData.Correo || paymentData.Correo;
    if (!destinatario) {
      throw new Error("El alumno no tiene correo electrónico registrado");
    }

    // Enviar el correo
    const result = await sendEmail({
      destinatario,
      asunto: emailContent.asunto,
      contenido: emailContent.contenido,
      plantilla: emailContent.template,
    });

    return result;
  } catch (error) {
    console.error("Error al enviar correo con plantilla:", error);
    throw error;
  }
}

/**
 * Envía recordatorios masivos a alumnos con adeudos
 */
export async function sendMassReminders(alumnosConAdeudo, mesPagado) {
  try {
    const results = [];

    // Obtener plantilla de recordatorio
    const template = await getEmailTemplateByType("recordatorio");

    if (!template) {
      throw new Error("No se encontró plantilla de recordatorio");
    }

    for (const alumno of alumnosConAdeudo) {
      try {
        const result = await sendEmailWithTemplate("recordatorio", alumno, {
          MesPagado: mesPagado,
          Monto: 0, // Se puede calcular según la mensualidad del curso
          SaldoPendiente: 0,
        });

        results.push({
          alumno: alumno.NumeroControl,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          alumno: alumno.NumeroControl,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Error en envío masivo:", error);
    throw error;
  }
}
