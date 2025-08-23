import { useQuery } from "@tanstack/react-query";
import {
  getStudentsBySchool,
  getPaymentsByStudentsAndCourse,
  getAllPaymentsByCourse,
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

/**
 * Hook para obtener TODOS los pagos de un curso
 * (incluyendo de estudiantes dados de baja DURANTE el curso)
 */
export function useAllPaymentsByCourse(courseId, schoolName) {
  return useQuery({
    queryKey: ["allPaymentsByCourse", courseId, schoolName],
    queryFn: () => getAllPaymentsByCourse(courseId, schoolName),
    enabled: !!courseId && !!schoolName,
  });
}
