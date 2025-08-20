import { useQuery } from "@tanstack/react-query";
import {
  getStudentsBySchool,
  getPaymentsByStudentsAndCourse,
} from "../../services/apiStudentsPayments";

/**
 * Hook para obtener estudiantes de una escuela
 */
export function useStudentsBySchool(schoolName) {
  return useQuery({
    queryKey: ["studentsBySchool", schoolName],
    queryFn: () => getStudentsBySchool(schoolName),
    enabled: !!schoolName,
  });
}

/**
 * Hook para obtener pagos de estudiantes específicos
 */
export function usePaymentsByStudentsAndCourse(numeroControls, courseId) {
  return useQuery({
    queryKey: ["paymentsByStudentsAndCourse", numeroControls, courseId],
    queryFn: () => getPaymentsByStudentsAndCourse(numeroControls, courseId),
    enabled: !!numeroControls?.length && !!courseId,
  });
}
