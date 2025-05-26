import { useQuery } from "@tanstack/react-query";
import { getUsers as getUsersApi } from "../../services/apiUsers";

/**
 * Custom hook for fetching users.
 *
 * @returns {{ users: Array<object>, isLoading: boolean, error: object }} Returns the users array, loading state, and error object.
 */
export function useUsers() {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"], // Unique query key for users
    queryFn: getUsersApi,
  });

  return { users, isLoading, error };
}
