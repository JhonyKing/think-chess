import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createUser as createUserApi } from "../../services/apiUsers";

/**
 * Custom hook for creating a new user.
 *
 * @returns {{ mutate: function, isPending: boolean }} Returns the mutation function and loading state.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: createUserApi,
    onSuccess: () => {
      toast.success("Nuevo usuario creado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      console.error("Create user error:", err);
      toast.error(err.message || "No se pudo crear el usuario.");
    },
  });

  return { createUser, isCreating };
}
