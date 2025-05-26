import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { deleteUser as deleteUserApi } from "../../services/apiUsers";

/**
 * Custom hook for deleting a user.
 *
 * @returns {{ mutate: function, isPending: boolean }} Returns the mutation function and loading state.
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: deleteUserApi, // Pass the user name (string) directly
    onSuccess: () => {
      toast.success("Usuario eliminado exitosamente.");
      // Invalidate queries to refetch the user list after deletion
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      console.error("Delete user error:", err);
      toast.error(err.message || "No se pudo eliminar el usuario.");
    },
  });

  return { deleteUser, isDeleting };
}
