import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getExpenses as getExpensesApi,
  createExpense as createExpenseApi,
  editExpense as editExpenseApi,
  deleteExpense as deleteExpenseApi,
  getMaxExpenseId as getMaxExpenseIdApi,
} from "./expenseApi";

// Hook to fetch expenses
export function useExpenses() {
  const {
    isLoading,
    data: expensesDataObj,
    error,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => getExpensesApi(),
  });

  return {
    isLoading,
    expenses: expensesDataObj?.data,
    count: expensesDataObj?.count,
    error,
  };
}

// Hook to create an expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  const { mutate: createExpenseMutate, isLoading: isCreating } = useMutation({
    mutationFn: createExpenseApi,
    onSuccess: () => {
      toast.success("Gasto creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["maxExpenseId"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { createExpenseMutate, isCreating };
}

// Hook to edit an expense
export function useEditExpense() {
  const queryClient = useQueryClient();

  const { mutate: editExpenseMutate, isLoading: isEditing } = useMutation({
    mutationFn: ({ newData, id }) => editExpenseApi({ newData, id }),
    onSuccess: () => {
      toast.success("Gasto actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { editExpenseMutate, isEditing };
}

// Hook to delete an expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  const { isLoading: isDeleting, mutate: deleteExpenseMutate } = useMutation({
    mutationFn: deleteExpenseApi,
    onSuccess: () => {
      toast.success("Gasto eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["maxExpenseId"] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { isDeleting, deleteExpenseMutate };
}

// Hook to fetch the maximum expense ID
export function useMaxExpenseId(options = {}) {
  const {
    data: maxExpenseId,
    isLoading: isLoadingMaxId,
    error,
  } = useQuery({
    queryKey: ["maxExpenseId"],
    queryFn: getMaxExpenseIdApi,
    staleTime: 0,
    retry: false,
    ...options,
  });

  if (error && !options.enabled) {
    console.error("Error in useMaxExpenseId hook:", error.message);
    toast.error("No se pudo obtener el ID máximo para el nuevo gasto.");
  }

  return { maxExpenseId, isLoadingMaxId, error };
}
