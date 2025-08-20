import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getBanks,
  createEditBank,
  deleteBank as deleteBankApi,
} from "./bankApi";

// Hook to fetch banks
export function useBanks() {
  const {
    isLoading,
    data: banks,
    error,
  } = useQuery({
    queryKey: ["banks"],
    queryFn: getBanks,
  });
  return { isLoading, banks, error };
}

// Hook to create a bank
export function useCreateBank() {
  const queryClient = useQueryClient();

  const { mutate: createBank, isLoading: isCreating } = useMutation({
    mutationFn: createEditBank,
    onSuccess: () => {
      toast.success("Banco creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      // Los bancos están relacionados con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { createBank, isCreating };
}

// Hook to edit a bank
export function useEditBank() {
  const queryClient = useQueryClient();

  const { mutate: editBank, isLoading: isEditing } = useMutation({
    mutationFn: ({ newBankData, id }) => createEditBank(newBankData, id),
    onSuccess: () => {
      toast.success("Banco actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      // Los bancos están relacionados con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { editBank, isEditing };
}

// Hook to delete a bank
export function useDeleteBank() {
  const queryClient = useQueryClient();

  const { isLoading: isDeleting, mutate: deleteBank } = useMutation({
    mutationFn: deleteBankApi,
    onSuccess: () => {
      toast.success("Banco eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["banks"] });
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      // Los bancos están relacionados con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isDeleting, deleteBank };
}
