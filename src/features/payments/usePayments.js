import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import supabase from "../../services/supabase";
import {
  getPayments,
  createPago,
  getBancos,
  getNextNumeroRecibo,
  getLastPaymentByStudent,
  getPaymentsByStudentAndMonth,
} from "../../services/apiPayments";

/**
 * Hook para obtener pagos
 */
export function usePayments() {
  const {
    isLoading,
    data: payments,
    error,
  } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  return { isLoading, payments, error };
}

/**
 * Hook para obtener bancos
 */
export function useBancos() {
  const {
    isLoading,
    data: bancos,
    error,
  } = useQuery({
    queryKey: ["bancos"],
    queryFn: getBancos,
  });

  return { isLoading, bancos, error };
}

/**
 * Hook para obtener el siguiente número de recibo
 */
export function useNextNumeroRecibo(fecha) {
  const {
    isLoading,
    data: nextNumero,
    error,
  } = useQuery({
    queryKey: ["nextNumeroRecibo", fecha],
    queryFn: () => getNextNumeroRecibo(fecha),
    enabled: !!fecha,
  });

  return { isLoading, nextNumero, error };
}

/**
 * Hook para obtener el último pago de un estudiante (para precargar banco)
 */
export function useLastPaymentByStudent(numeroControl) {
  const {
    isLoading,
    data: lastPayment,
    error,
  } = useQuery({
    queryKey: ["lastPayment", numeroControl],
    queryFn: () => getLastPaymentByStudent(numeroControl),
    enabled: !!numeroControl,
    retry: 1, // Solo reintentar una vez
    retryOnMount: false,
    refetchOnWindowFocus: false,
    // Si hay error, devolver null en lugar de fallar
    onError: (err) => {
      console.warn(
        "Could not fetch last payment, continuing without preload:",
        err
      );
    },
  });

  return { isLoading, lastPayment: lastPayment || null, error };
}

/**
 * Hook para crear un pago
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  const { mutate: createPayment, isPending: isCreating } = useMutation({
    mutationFn: createPago,
    onSuccess: () => {
      toast.success("Pago registrado correctamente");
      // Invalidar todas las queries relacionadas con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentAndMonth"],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentsAndCourse"],
      });
      queryClient.invalidateQueries({ queryKey: ["nextNumeroRecibo"] });
      queryClient.invalidateQueries({ queryKey: ["lastPayment"] });
      // También invalidar estudiantes porque el estado de pago puede afectar la vista
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      console.error("Error creating payment:", err);
      console.error("Payment error details:", err);
      toast.error(err.message || "Error al registrar el pago");
    },
  });

  return { createPayment, isCreating };
}

/**
 * Hook para actualizar un pago
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  const { mutate: updatePayment, isPending: isUpdating } = useMutation({
    mutationFn: async ({ paymentData, numeroRecibo }) => {
      console.log(
        "updatePayment - Datos que se van a actualizar:",
        paymentData
      );
      console.log("updatePayment - Número de recibo:", numeroRecibo);

      const { data, error } = await supabase
        .from("PAGO")
        .update(paymentData)
        .eq("NumeroRecibo", numeroRecibo)
        .select();

      if (error) {
        console.error("Error en updatePayment:", error);
        throw new Error(error.message || "Error al actualizar el pago");
      }

      console.log("updatePayment - Pago actualizado exitosamente:", data);
      return data;
    },
    onSuccess: () => {
      toast.success("Pago actualizado correctamente");
      // Invalidar todas las queries relacionadas con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentAndMonth"],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentsAndCourse"],
      });
      queryClient.invalidateQueries({ queryKey: ["nextNumeroRecibo"] });
      queryClient.invalidateQueries({ queryKey: ["lastPayment"] });
      // También invalidar estudiantes porque el estado de pago puede afectar la vista
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      console.error("Error updating payment:", err);
      toast.error(err.message || "Error al actualizar el pago");
    },
  });

  return { updatePayment, isUpdating };
}

/**
 * Hook para eliminar un pago
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  const { mutate: deletePayment, isPending: isDeleting } = useMutation({
    mutationFn: async (numeroRecibo) => {
      const { error } = await supabase
        .from("PAGO")
        .delete()
        .eq("NumeroRecibo", numeroRecibo);

      if (error) throw new Error(error.message || "Error al eliminar el pago");
      return numeroRecibo;
    },
    onSuccess: () => {
      toast.success("Pago eliminado correctamente");
      // Invalidar todas las queries relacionadas con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentAndMonth"],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentsAndCourse"],
      });
      queryClient.invalidateQueries({ queryKey: ["nextNumeroRecibo"] });
      queryClient.invalidateQueries({ queryKey: ["lastPayment"] });
      // También invalidar estudiantes porque el estado de pago puede afectar la vista
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => {
      console.error("Error deleting payment:", err);
      toast.error(err.message || "Error al eliminar el pago");
    },
  });

  return { deletePayment, isDeleting };
}

/**
 * Hook para obtener todos los pagos de un estudiante en un mes específico
 */
export function usePaymentsByStudentAndMonth(
  numeroControl,
  mesPagado,
  idCurso
) {
  const {
    isLoading,
    data: payments,
    error,
  } = useQuery({
    queryKey: ["paymentsByStudentAndMonth", numeroControl, mesPagado, idCurso],
    queryFn: () =>
      getPaymentsByStudentAndMonth(numeroControl, mesPagado, idCurso),
    enabled: !!numeroControl && !!mesPagado && !!idCurso,
    retry: 1,
    retryOnMount: false,
    refetchOnWindowFocus: false,
  });

  return { isLoading, payments: payments || [], error };
}
