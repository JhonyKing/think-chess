import supabase from "./supabase";
import toast from "react-hot-toast";

/**
 * Fetches all schools from the database along with their active status.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of school objects.
 */
export async function getSchools() {
  const { data, error } = await supabase
    .from("ESCUELA")
    .select("*, CURSO(*)") // Select all school columns and related courses
    .order("NombreEscuela", { ascending: true });

  if (error) {
    console.error("Error loading schools and courses:", error);
    throw new Error("No se pudieron cargar las escuelas y sus cursos.");
  }
  return data;
}

/**
 * Creates a new school with detailed information.
 * @param {object} schoolData - Object containing school data.
 * @returns {Promise<object>} A promise that resolves to the newly created school object.
 */
export async function createSchool(schoolData) {
  const {
    NombreEscuela,
    Direccion = "", // Provide defaults for optional fields
    Telefono = "",
    ZonaEscolar = "",
    Activo = false, // Default to inactive unless specified
    MontoPorAlumno = 0,
    GradoActualizado = "",
  } = schoolData;

  if (!NombreEscuela || NombreEscuela.trim() === "") {
    toast.error("El nombre de la escuela es obligatorio.");
    throw new Error("El nombre de la escuela es obligatorio.");
  }

  // Basic validation for MontoPorAlumno
  const monto = parseFloat(MontoPorAlumno);
  if (isNaN(monto) || monto < 0) {
    toast.error("El Monto por Alumno debe ser un número positivo.");
    throw new Error("El Monto por Alumno debe ser un número positivo.");
  }

  const { data, error } = await supabase
    .from("ESCUELA")
    .insert([
      {
        NombreEscuela: NombreEscuela.trim(),
        Direccion: Direccion?.trim(), // Use optional chaining and trim
        Telefono: Telefono?.trim(),
        ZonaEscolar: ZonaEscolar?.trim(),
        Activo: !!Activo, // Ensure boolean
        MontoPorAlumno: monto,
        GradoActualizado: GradoActualizado?.trim(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating school:", error);
    if (
      error.message.includes("duplicate key value violates unique constraint")
    ) {
      toast.error(`La escuela "${NombreEscuela.trim()}" ya existe.`);
      throw new Error(`La escuela "${NombreEscuela.trim()}" ya existe.`);
    }
    throw new Error("No se pudo crear la escuela.");
  }

  return data;
}

/**
 * Updates an existing school.
 * @param {object} schoolData - Object containing the fields to update.
 * @param {string} schoolName - The primary key (NombreEscuela) of the school to update.
 * @returns {Promise<object>} A promise that resolves to the updated school object.
 */
export async function updateSchool(schoolData, schoolName) {
  if (!schoolName) {
    throw new Error("Se requiere el nombre de la escuela para actualizar.");
  }

  const updateData = { ...schoolData };

  // Ensure MontoPorAlumno is a valid number if provided
  if (updateData.MontoPorAlumno !== undefined) {
    const monto = parseFloat(updateData.MontoPorAlumno);
    if (isNaN(monto) || monto < 0) {
      toast.error("El Monto por Alumno debe ser un número positivo.");
      throw new Error("El Monto por Alumno debe ser un número positivo.");
    }
    updateData.MontoPorAlumno = monto;
  }

  // Ensure Activo is boolean if provided
  if (updateData.Activo !== undefined) {
    updateData.Activo = !!updateData.Activo;
  }

  // Remove primary key from update payload if present
  delete updateData.NombreEscuela;
  // Trim string fields before update
  Object.keys(updateData).forEach((key) => {
    if (typeof updateData[key] === "string") {
      updateData[key] = updateData[key].trim();
    }
  });

  const { data, error } = await supabase
    .from("ESCUELA")
    .update(updateData)
    .eq("NombreEscuela", schoolName)
    .select()
    .single();

  if (error) {
    console.error("Error updating school:", error);
    throw new Error("No se pudo actualizar la escuela.");
  }

  if (!data) {
    throw new Error(
      `No se encontró la escuela "${schoolName}" para actualizar.`
    );
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
