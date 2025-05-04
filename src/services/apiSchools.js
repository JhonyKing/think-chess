import supabase from "./supabase";
import toast from "react-hot-toast";

/**
 * Fetches all schools from the database.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of school objects.
 */
export async function getSchools() {
  // Fetch schools and their associated courses
  const { data, error } = await supabase
    .from("ESCUELA")
    // Select all school columns and all columns from related courses
    .select("*, CURSO(*)")
    .order("NombreEscuela", { ascending: true });

  if (error) {
    console.error("Error loading schools and courses:", error);
    throw new Error("No se pudieron cargar las escuelas y sus cursos.");
  }

  // No need to log here anymore, was for ID check
  // console.log("[apiSchools] Fetched schools data structure:", data);

  return data;
}

/**
 * Creates a new school.
 * @param {object} schoolData - Object containing school data (e.g., { NombreEscuela: '...' }).
 * @returns {Promise<object>} A promise that resolves to the newly created school object.
 */
export async function createSchool(schoolData) {
  if (!schoolData.NombreEscuela || schoolData.NombreEscuela.trim() === "") {
    throw new Error("El nombre de la escuela es obligatorio.");
  }

  const { data, error } = await supabase
    .from("ESCUELA")
    .insert([
      {
        NombreEscuela: schoolData.NombreEscuela.trim(),
        Activo: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating school:", error);
    if (
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      toast.error(`La escuela "${schoolData.NombreEscuela.trim()}" ya existe.`);
      throw new Error(
        `La escuela "${schoolData.NombreEscuela.trim()}" ya existe.`
      );
    }
    throw new Error("No se pudo crear la escuela.");
  }

  return data;
}

/**
 * Fetches a list of all schools (Name only) for dropdowns.
 * @returns {Promise<Array<{NombreEscuela: string}>>} A promise that resolves to an array of school objects containing only the name.
 */
export async function getSchoolsList() {
  const { data, error } = await supabase
    .from("ESCUELA")
    .select("NombreEscuela") // Select only the Name (which is the PK/FK)
    .order("NombreEscuela", { ascending: true });

  if (error) {
    console.error("Error loading schools list:", error);
    throw new Error("No se pudo cargar la lista de escuelas.");
  }

  return data;
}

// Add updateSchool and deleteSchool later if needed
