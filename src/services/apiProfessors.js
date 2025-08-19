import supabase from "./supabase";

/**
 * Fetches all users with TipoDeUsuario = 'PROFESOR' from the database.
 * Used to populate professor dropdown lists.
 *
 * @async
 * @function getProfessors
 * @returns {Promise<Array<object>>} A promise that resolves to an array of professor objects.
 * @throws {Error} Throws an error if the data couldn't be loaded.
 */
export async function getProfessors() {
  const { data, error } = await supabase
    .from("USUARIO")
    .select("Nombre")
    .eq("TipoDeUsuario", "PROFESOR")
    .order("Nombre", { ascending: true });

  if (error) {
    console.error("Error fetching professors:", error);
    throw new Error("No se pudieron cargar los profesores.");
  }

  return data;
}
