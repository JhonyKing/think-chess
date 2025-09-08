const { z } = require("zod");

// Esquema para validar email individual
const emailSchema = z.string().email("Email inválido");

// Esquema para attachments
const attachmentSchema = z.object({
  filename: z.string().min(1, "Filename es requerido"),
  content: z
    .string()
    .min(1, "Content es requerido")
    .refine((content) => {
      try {
        // Validar que sea base64 válido
        Buffer.from(content, "base64");
        return true;
      } catch {
        return false;
      }
    }, "Content debe ser una string base64 válida"),
  contentType: z.string().min(1, "ContentType es requerido"),
});

// Esquema principal para el body del endpoint /send
const sendEmailSchema = z
  .object({
    to: z.union(
      [
        emailSchema,
        z
          .array(emailSchema)
          .min(1, "Debe proporcionar al menos un email destinatario"),
      ],
      {
        required_error: 'Campo "to" es requerido',
        invalid_type_error: 'Campo "to" debe ser un email o array de emails',
      }
    ),

    subject: z
      .string()
      .min(1, "Subject es requerido")
      .max(200, "Subject no puede exceder 200 caracteres"),

    text: z.string().optional(),

    html: z.string().optional(),

    attachments: z.array(attachmentSchema).optional(),
  })
  .refine((data) => data.text || data.html, {
    message: "Debe proporcionar al menos text o html",
    path: ["text", "html"],
  });

/**
 * Valida los datos del body para el endpoint /send
 * @param {Object} data - Datos a validar
 * @returns {Object} - Resultado de la validación
 */
function validateSendEmail(data) {
  try {
    const validatedData = sendEmailSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    return {
      success: false,
      error: error.errors || error.message,
    };
  }
}

module.exports = {
  validateSendEmail,
  sendEmailSchema,
};

