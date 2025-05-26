import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getSuppliers,
  createEditSupplier,
  deleteSupplier as deleteSupplierApi,
} from "./supplierApi";

// Hook to fetch suppliers
export function useSuppliers() {
  const {
    isLoading,
    data: suppliers,
    error,
  } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });
  return { isLoading, suppliers, error };
}

// Hook to create a supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  const { mutate: createSupplier, isLoading: isCreating } = useMutation({
    mutationFn: createEditSupplier,
    onSuccess: () => {
      toast.success("Proveedor creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { createSupplier, isCreating };
}

// Hook to edit a supplier
export function useEditSupplier() {
  const queryClient = useQueryClient();

  const { mutate: editSupplier, isLoading: isEditing } = useMutation({
    mutationFn: ({ newSupplierData, id }) =>
      createEditSupplier(newSupplierData, id),
    onSuccess: () => {
      toast.success("Proveedor actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { editSupplier, isEditing };
}

// Hook to delete a supplier
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  const { isLoading: isDeleting, mutate: deleteSupplier } = useMutation({
    mutationFn: deleteSupplierApi,
    onSuccess: () => {
      toast.success("Proveedor eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isDeleting, deleteSupplier };
}
