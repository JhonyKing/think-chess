import { useQuery } from "@tanstack/react-query";
import { getUserTypes as getUserTypesApi } from "../../services/apiUsers";

/**
 * Custom hook for fetching user types.
 *
 * @returns {{ userTypes: Array<object>, isLoading: boolean, error: object }} Returns the user types array, loading state, and error object.
 */
export function useUserTypes() {
  const {
    data: userTypes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userTypes"], // Unique query key for user types
    queryFn: getUserTypesApi,
  });

  return { userTypes, isLoading, error };
}
