import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendEmailWithTemplate,
  sendMassReminders,
} from "../../services/apiEmailService";
import { toast } from "react-hot-toast";

/**
 * Hook para enviar un correo con plantilla a un alumno específico
 */
export function useSendEmailWithTemplate() {
  const queryClient = useQueryClient();

  const { mutate: sendEmailMutation, isLoading: isSending } = useMutation({
    mutationFn: ({ tipoPlantilla, alumnoData, paymentData }) =>
      sendEmailWithTemplate(tipoPlantilla, alumnoData, paymentData),

    onSuccess: (data, variables) => {
      toast.success(
        `Correo enviado exitosamente a ${
          variables.alumnoData.Correo || variables.paymentData?.Correo
        }`
      );

      // Invalidar queries relacionadas si es necesario
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },

    onError: (err) => {
      console.error("Error al enviar correo:", err);
      toast.error(err.message || "Error al enviar el correo");
    },
  });

  // Wrapper function que permite pasar callbacks personalizados
  const sendEmail = (emailData, options = {}) => {
    sendEmailMutation(emailData, {
      onSuccess: (data, variables) => {
        // Ejecutar callback personalizado si existe
        if (options.onSuccess) {
          options.onSuccess(data, variables);
        }
      },
      onError: (error) => {
        // Ejecutar callback personalizado si existe
        if (options.onError) {
          options.onError(error);
        }
      },
    });
  };

  return { sendEmail, isSending };
}

/**
 * Hook para enviar recordatorios masivos
 */
export function useSendMassReminders() {
  const queryClient = useQueryClient();

  const { mutate: sendReminders, isLoading: isSendingReminders } = useMutation({
    mutationFn: ({
      alumnosConAdeudo,
      mesPagado,
      tipoPlantilla = "CORREO RECORDATORIO",
    }) => {
      console.log("🚀 useSendMassReminders: mutationFn ejecutada con:", {
        alumnosConAdeudo,
        mesPagado,
        tipoPlantilla,
      });
      return sendMassReminders(alumnosConAdeudo, mesPagado, tipoPlantilla);
    },

    onSuccess: (results) => {
      const exitosos = results.filter((r) => r.success).length;
      const fallidos = results.filter((r) => !r.success).length;

      if (exitosos > 0) {
        toast.success(`${exitosos} recordatorios enviados exitosamente`);
      }
      if (fallidos > 0) {
        toast.error(`${fallidos} recordatorios fallaron al enviarse`);
      }

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },

    onError: (err) => {
      console.error("Error en envío masivo:", err);
      toast.error(err.message || "Error al enviar recordatorios");
    },
  });

  return { sendReminders, isSendingReminders };
}
