import { useQuery } from "@tanstack/react-query";
import { getSchools } from "../../services/apiSchools"; // Adjust path as needed

export function useSchools() {
  const {
    isLoading,
    data: schools,
    error,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  return { isLoading, schools, error };
}
