import { useQuery } from "@tanstack/react-query";
import supabase from "../../services/supabase";

/**
 * Hook para obtener el conteo total de estudiantes activos
 */
export function useActiveStudentsCount() {
  const {
    isLoading,
    data: count,
    error,
  } = useQuery({
    queryKey: ["activeStudentsCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ALUMNO")
        .select("*", { count: "exact", head: true })
        .eq("Activo", true);

      if (error) {
        console.error("Error fetching active students count:", error);
        throw new Error(error.message);
      }

      return count || 0;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 20000, // Considerar datos como "frescos" por 20 segundos
  });

  return { isLoading, count, error };
}
