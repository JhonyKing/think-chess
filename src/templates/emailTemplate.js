/**
 * Plantilla HTML base para todos los correos de Piensa Ajedrez
 * Basada en el diseño proporcionado con estilos corporativos
 */

/**
 * Genera el HTML completo para un correo electrónico
 * @param {Object} options - Opciones del correo
 * @param {string} options.titulo - Título principal del correo
 * @param {string} options.contenido - Contenido HTML del cuerpo del correo
 * @param {string} options.logoUrl - URL del logo (opcional)
 * @param {boolean} options.incluirBoton - Si incluir botón de acción
 * @param {string} options.textoBoton - Texto del botón
 * @param {string} options.urlBoton - URL del botón
 * @param {string} options.notaAdicional - Nota adicional al final
 * @returns {string} HTML completo del correo
 */
export function generateEmailHTML({
  titulo = "Piensa Ajedrez",
  contenido = "",
  logoUrl = "https://i.imgur.com/logo_piensa_ajedrez.jpg",
  incluirBoton = false,
  textoBoton = "",
  urlBoton = "",
  notaAdicional = "",
}) {
  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${titulo} • Piensa Ajedrez</title>
  </head>
  <body style="margin:0; padding:0; background:#0B0B0B;">
    <table role="presentation" align="center" width="100%" style="background:#0B0B0B;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" style="max-width:600px; background:#1A1A1A; border-radius:12px; overflow:hidden; color:#F7F5EF; font-family:Segoe UI, Arial, sans-serif;">
            <!-- Header con logo -->
            <tr>
              <td align="center" style="padding:24px;">
                <img src="${logoUrl}" 
                     width="120" height="120" 
                     alt="Piensa Ajedrez" 
                     style="display:block; border:0; border-radius: 50%;"
                     onerror="this.style.display='none';">
              </td>
            </tr>
            <!-- Borde dorado -->
            <tr><td style="height:6px; background:#D4AF37;"></td></tr>
            <!-- Contenido -->
            <tr>
              <td style="padding:28px;">
                <h1 style="color:#D4AF37; margin:0 0 20px; font-size:28px; line-height:34px;">
                  ${titulo}
                </h1>
                <div style="margin:0 0 20px; font-size:16px; line-height:24px;">
                  ${contenido}
                </div>
                ${
                  incluirBoton
                    ? `
                <!-- Botón -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="left" style="margin:0 0 18px 0;">
                  <tr>
                    <td>
                      <a href="${urlBoton}"
                         style="background:#D4AF37; color:#0B0B0B; display:inline-block; font-size:16px; font-weight:700; line-height:44px; text-align:center; text-decoration:none; border-radius:6px; padding:0 22px;">
                        ${textoBoton}
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="clear:both;"></div>
                `
                    : ""
                }
                ${
                  notaAdicional
                    ? `
                <p style="margin-top:20px; font-size:13px; color:#CFCAC0;">
                  ${notaAdicional}
                </p>
                `
                    : ""
                }
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:18px 28px; background:#141414; font-size:12px; line-height:18px; color:#CFCAC0;">
                <strong style="color:#D4AF37;">Piensa Ajedrez</strong><br>
                Blvd. Municipio Libre #4702, Col. Los Encinos · Nuevo Laredo, Tamps.<br>
                WhatsApp: <a href="https://wa.me/526671433734" style="color:#D4AF37; text-decoration:none;">(867) 143-3734</a><br><br>
                <span style="font-size:11px; color:#CFCAC0;">
                  Si no deseas recibir estos mensajes, puedes 
                  <a href="#" style="color:#D4AF37; text-decoration:none;">darte de baja aquí</a>.
                </span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px; font-size:11px; color:#CFCAC0;">
                © 2025 Piensa Ajedrez — Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Plantillas específicas para diferentes tipos de correo
 */

/**
 * Plantilla para correo de agradecimiento por pago
 */
export function generatePaymentThankYouEmail(paymentData, studentData) {
  const contenido = `
    <p>Estimado/a <strong>${studentData.nombre}</strong>,</p>
    
    <p>Hemos recibido exitosamente su pago. A continuación los detalles de su recibo:</p>
    
    <div style="background:#141414; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid #D4AF37;">
      <h3 style="color:#D4AF37; margin:0 0 15px; font-size:18px;">Detalles del Recibo</h3>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Recibo:</strong> ${paymentData.numeroRecibo}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Control:</strong> ${paymentData.numeroControl}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Concepto:</strong> ${paymentData.concepto}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Monto:</strong> <span style="color:#D4AF37; font-weight:700;">$${paymentData.monto}</span></p>
      <p style="margin:5px 0; font-size:14px;"><strong>Fecha:</strong> ${paymentData.fecha}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Método:</strong> ${paymentData.metodoPago}</p>
    </div>
    
    <p>Gracias por confiar en <strong>Piensa Ajedrez</strong> para el desarrollo cognitivo de su hijo/a.</p>
    
    <p style="color:#D4AF37; font-weight:600;">¡Nos vemos en las clases!</p>
  `;

  return generateEmailHTML({
    titulo: "¡Gracias por tu Pago!",
    contenido,
    incluirBoton: true,
    textoBoton: "Ver Horarios de Clases",
    urlBoton:
      "https://wa.me/526671433734?text=Quiero%20información%20de%20horarios",
    notaAdicional: "Conserva este correo como comprobante de pago.",
  });
}

/**
 * Plantilla para correo de abono
 */
export function generatePartialPaymentEmail(paymentData, studentData) {
  const contenido = `
    <p>Estimado/a <strong>${studentData.nombre}</strong>,</p>
    
    <p>Hemos registrado su abono exitosamente. A continuación los detalles:</p>
    
    <div style="background:#141414; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid #D4AF37;">
      <h3 style="color:#D4AF37; margin:0 0 15px; font-size:18px;">Detalles del Abono</h3>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Recibo:</strong> ${paymentData.numeroRecibo}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Concepto:</strong> ${paymentData.concepto}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Abono realizado:</strong> <span style="color:#43a047; font-weight:700;">$${paymentData.monto}</span></p>
      <p style="margin:5px 0; font-size:14px;"><strong>Saldo pendiente:</strong> <span style="color:#fb8c00; font-weight:700;">$${paymentData.saldoPendiente}</span></p>
      <p style="margin:5px 0; font-size:14px;"><strong>Fecha:</strong> ${paymentData.fecha}</p>
    </div>
    
    <p>Para completar su pago, el saldo restante es de <strong style="color:#fb8c00;">$${paymentData.saldoPendiente}</strong>.</p>
    
    <p>Puede realizar el pago pendiente en nuestras instalaciones o contactarnos para coordinar.</p>
  `;

  return generateEmailHTML({
    titulo: "Abono Registrado",
    contenido,
    incluirBoton: true,
    textoBoton: "Completar Pago",
    urlBoton: "https://wa.me/526671433734?text=Quiero%20completar%20mi%20pago",
    notaAdicional:
      "Recuerda que puedes completar tu pago en cualquier momento.",
  });
}

/**
 * Plantilla para correo de recordatorio
 */
export function generateReminderEmail(
  studentData,
  conceptoPago,
  estaVencido = false
) {
  const contenido = `
    <p>Estimado/a <strong>${studentData.nombre}</strong>,</p>
    
    <p>Le recordamos que tiene un pago ${
      estaVencido
        ? '<strong style="color:#e53935;">VENCIDO</strong>'
        : "pendiente"
    } 
       correspondiente a <strong>${conceptoPago}</strong>.</p>
    
    <div style="background:${
      estaVencido ? "#2d1b1b" : "#141414"
    }; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid ${
    estaVencido ? "#e53935" : "#fb8c00"
  };">
      <h3 style="color:${
        estaVencido ? "#e53935" : "#fb8c00"
      }; margin:0 0 15px; font-size:18px;">
        ${estaVencido ? "⚠️ Pago Vencido" : "📅 Recordatorio de Pago"}
      </h3>
      <p style="margin:5px 0; font-size:14px;"><strong>Alumno:</strong> ${
        studentData.nombre
      }</p>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Control:</strong> ${
        studentData.numeroControl
      }</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Concepto:</strong> ${conceptoPago}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Escuela:</strong> ${
        studentData.escuela
      }</p>
    </div>
    
    <p>${
      estaVencido
        ? "Para evitar la suspensión temporal de clases, es importante regularizar el pago a la brevedad."
        : "Le invitamos a realizar su pago para mantener activo el servicio educativo."
    }</p>
    
    <p>Puede realizar el pago en nuestras instalaciones o contactarnos para más información.</p>
  `;

  return generateEmailHTML({
    titulo: estaVencido ? "Pago Vencido" : "Recordatorio de Pago",
    contenido,
    incluirBoton: true,
    textoBoton: "Realizar Pago",
    urlBoton: "https://wa.me/526671433734?text=Quiero%20realizar%20mi%20pago",
    notaAdicional: estaVencido
      ? "Es importante regularizar el pago para continuar con el servicio."
      : "Agradecemos su puntualidad en los pagos.",
  });
}

/**
 * Plantilla para correo de bienvenida
 */
export function generateWelcomeEmail(studentData) {
  const contenido = `
    <p>¡Bienvenido/a a la familia <strong style="color:#D4AF37;">Piensa Ajedrez</strong>!</p>
    
    <p>Estimado/a <strong>${studentData.nombre}</strong>,</p>
    
    <p>Nos da mucho gusto tenerte como parte de nuestra comunidad educativa. El ajedrez es una herramienta poderosa 
       para el desarrollo cognitivo y estamos emocionados de acompañarte en este viaje de aprendizaje.</p>
    
    <div style="background:#141414; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid #D4AF37;">
      <h3 style="color:#D4AF37; margin:0 0 15px; font-size:18px;">Datos de Registro</h3>
      <p style="margin:5px 0; font-size:14px;"><strong>Nombre:</strong> ${studentData.nombre}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Control:</strong> ${studentData.numeroControl}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Escuela:</strong> ${studentData.escuela}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Correo:</strong> ${studentData.correo}</p>
    </div>
    
    <h3 style="color:#D4AF37; font-size:20px; margin:25px 0 15px;">¿Qué sigue ahora?</h3>
    
    <ul style="margin:0 0 20px; padding-left:20px; font-size:16px; line-height:24px;">
      <li style="margin-bottom:8px;">Recibirás información sobre horarios y grupos disponibles</li>
      <li style="margin-bottom:8px;">Te contactaremos para coordinar tu primera clase</li>
      <li style="margin-bottom:8px;">Podrás acceder a material educativo complementario</li>
      <li style="margin-bottom:8px;">Participarás en torneos y actividades especiales</li>
    </ul>
    
    <p style="color:#D4AF37; font-weight:600;">¡Estamos listos para comenzar esta aventura contigo!</p>
  `;

  return generateEmailHTML({
    titulo: "¡Bienvenido/a!",
    contenido,
    incluirBoton: true,
    textoBoton: "Conocer Horarios",
    urlBoton:
      "https://wa.me/526671433734?text=Soy%20nuevo%20alumno%20y%20quiero%20información",
    notaAdicional:
      "Si tienes dudas, no dudes en contactarnos. ¡Estamos aquí para ayudarte!",
  });
}

/**
 * Plantilla para correo de disculpas
 */
export function generateApologyEmail(
  studentData,
  motivoDisculpa = "cancelación del recibo"
) {
  const contenido = `
    <p>Estimado/a <strong>${studentData.nombre}</strong>,</p>
    
    <p>Nos ponemos en contacto para informarle sobre la <strong>${motivoDisculpa}</strong> y ofrecerle nuestras disculpas.</p>
    
    <div style="background:#2d1b1b; border-radius:8px; padding:20px; margin:20px 0; border-left:4px solid #e53935;">
      <h3 style="color:#e53935; margin:0 0 15px; font-size:18px;">Información de la Disculpa</h3>
      <p style="margin:5px 0; font-size:14px;"><strong>Alumno:</strong> ${studentData.nombre}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>No. Control:</strong> ${studentData.numeroControl}</p>
      <p style="margin:5px 0; font-size:14px;"><strong>Motivo:</strong> ${motivoDisculpa}</p>
    </div>
    
    <p>Entendemos que esta situación puede causar inconvenientes y nos comprometemos a brindarle la mejor atención 
       para resolver cualquier duda o problema que pueda surgir.</p>
    
    <p>Por favor, no dude en contactarnos si necesita aclaraciones adicionales o asistencia.</p>
    
    <p style="color:#D4AF37; font-weight:600;">Agradecemos su comprensión y paciencia.</p>
  `;

  return generateEmailHTML({
    titulo: "Disculpas - Piensa Ajedrez",
    contenido,
    incluirBoton: true,
    textoBoton: "Contactar Soporte",
    urlBoton:
      "https://wa.me/526671433734?text=Necesito%20ayuda%20con%20mi%20cuenta",
    notaAdicional:
      "Estamos comprometidos con brindar el mejor servicio posible.",
  });
}
