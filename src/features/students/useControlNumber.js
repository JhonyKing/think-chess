import { useQuery } from "@tanstack/react-query";
import { getLatestNumeroControlForCurrentYear } from "../../services/apiStudents";

/**
 * Hook para generar automáticamente el siguiente número de control
 * Formato: YYMMM### donde:
 * - YY: últimos dos dígitos del año actual
 * - MMM: "100" fijo
 * - ###: secuencia incremental de 3 dígitos (001, 002, etc.)
 */
export function useControlNumber() {
  const {
    data: nextControlNumber,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["nextControlNumber"],
    queryFn: async () => {
      // Obtener el último número de control del año actual
      const latestControlNumber = await getLatestNumeroControlForCurrentYear();

      // Generar el siguiente número
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const prefix = `${currentYear}100`;

      let nextSequenceNumber = 1;

      if (latestControlNumber && latestControlNumber.startsWith(prefix)) {
        // Extraer la secuencia del último número
        const lastSequence = parseInt(
          latestControlNumber.slice(prefix.length),
          10
        );
        if (!isNaN(lastSequence)) {
          nextSequenceNumber = lastSequence + 1;
        }
      }

      // Formatear con ceros a la izquierda (3 dígitos)
      const sequenceString = nextSequenceNumber.toString().padStart(3, "0");

      return `${prefix}${sequenceString}`;
    },
    staleTime: 0, // Siempre refrescar para obtener el número más actual
    cacheTime: 0, // No cachear para evitar duplicados
  });

  return {
    nextControlNumber,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Función auxiliar para validar si un número de control tiene el formato correcto
 */
export function validateControlNumberFormat(controlNumber) {
  if (!controlNumber || typeof controlNumber !== "string") {
    return false;
  }

  // Debe tener exactamente 8 caracteres
  if (controlNumber.length !== 8) {
    return false;
  }

  // Los primeros 2 dígitos deben ser números (año)
  const yearPart = controlNumber.slice(0, 2);
  if (!/^\d{2}$/.test(yearPart)) {
    return false;
  }

  // Los siguientes 3 caracteres deben ser "100"
  const fixedPart = controlNumber.slice(2, 5);
  if (fixedPart !== "100") {
    return false;
  }

  // Los últimos 3 caracteres deben ser números
  const sequencePart = controlNumber.slice(5);
  if (!/^\d{3}$/.test(sequencePart)) {
    return false;
  }

  return true;
}

/**
 * Función auxiliar para obtener el año del número de control
 */
export function getYearFromControlNumber(controlNumber) {
  if (!validateControlNumberFormat(controlNumber)) {
    return null;
  }

  const yearPart = controlNumber.slice(0, 2);
  const fullYear = parseInt(`20${yearPart}`, 10);

  return fullYear;
}


