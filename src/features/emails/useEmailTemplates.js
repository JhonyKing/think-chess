import { useQuery } from "@tanstack/react-query";
import {
  getAllEmailTemplates,
  getEmailTemplateByType,
} from "../../services/apiEmailService";

/**
 * Hook para obtener todas las plantillas de correo
 */
export function useEmailTemplates() {
  const {
    isLoading,
    data: templates,
    error,
  } = useQuery({
    queryKey: ["email-templates"],
    queryFn: getAllEmailTemplates,
  });

  return { isLoading, error, templates };
}

/**
 * Hook para obtener una plantilla específica por tipo
 */
export function useEmailTemplateByType(tipoPlantilla) {
  const {
    isLoading,
    data: template,
    error,
  } = useQuery({
    queryKey: ["email-template", tipoPlantilla],
    queryFn: () => getEmailTemplateByType(tipoPlantilla),
    enabled: !!tipoPlantilla, // Solo ejecutar si se proporciona el tipo
  });

  return { isLoading, error, template };
}

