import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateUser as updateUserApi } from "../../services/apiUsers";

/**
 * Custom hook for updating an existing user.
 *
 * @returns {{ mutate: function, isPending: boolean }} Returns the mutation function and loading state.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    // The mutation function now expects an object { userToUpdate, userName }
    mutationFn: ({ userToUpdate, userName }) =>
      updateUserApi(userToUpdate, userName),
    onSuccess: () => {
      toast.success("Usuario actualizado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["professorsList"] });
    },
    onError: (err) => {
      console.error("Update user error:", err);
      toast.error(err.message || "No se pudo actualizar el usuario.");
    },
  });

  return { updateUser, isUpdating };
}
