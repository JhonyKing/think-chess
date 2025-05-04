import supabase from "./supabase";

/**
 * Creates a new course associated with a school.
 * @param {object} courseData - Object containing course data.
 * @param {string} courseData.NombreEscuela - The Name of the school (Foreign Key).
 * @param {string} courseData.InicioCurso - Start date in ISO format (YYYY-MM-DD).
 * @param {string} courseData.FinCurso - End date in ISO format (YYYY-MM-DD).
 * @param {string} courseData.DiaClase - Day of the week (e.g., 'LUNES').
 * @returns {Promise<object>} A promise that resolves to the newly created course object.
 */
export async function createCourse(courseData) {
  // Destructure correct column names including the foreign key
  const { NombreEscuela, InicioCurso, FinCurso, DiaClase } = courseData;

  // Basic validation
  // Corrected: Check NombreEscuela
  if (!NombreEscuela || !InicioCurso || !FinCurso || !DiaClase) {
    throw new Error(
      "Faltan datos obligatorios para crear el curso (Escuela, Fechas, Día)."
    );
  }

  // TEMPORARY: Generate a random-ish IDCurso
  // Replace with proper sequence or UUID generation later!
  const tempIDCurso = Math.floor(Date.now() / 1000 + Math.random() * 10000);

  const newCourse = {
    IDCurso: tempIDCurso, // Include the generated ID
    NombreEscuela,
    InicioCurso,
    FinCurso,
    DiaClase,
    Activo: true,
  };

  console.log("[apiCourses] Inserting new course:", newCourse); // Log the object being inserted

  const { data, error } = await supabase
    .from("CURSO")
    // Corrected: Insert object with correct column names
    .insert([newCourse])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    throw new Error("No se pudo crear el curso.");
  }

  return data;
}

/**
 * Fetches courses for a specific school.
 * @param {string} schoolName - The Name (NombreEscuela) of the school.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of course objects.
 */
export async function getCoursesBySchool(schoolName) {
  // Parameter is NombreEscuela string
  if (!schoolName) return [];

  const { data, error } = await supabase
    .from("CURSO")
    .select("*")
    // Corrected: Filter by NombreEscuela column
    .eq("NombreEscuela", schoolName)
    .order("InicioCurso", { ascending: false });

  if (error) {
    console.error(`Error loading courses for school ${schoolName}:`, error);
    throw new Error("No se pudieron cargar los cursos para esta escuela.");
  }

  return data;
}

/**
 * Marks a course as inactive (Activo = false).
 * IMPORTANT: This currently DOES NOT trigger student deactivation.
 * Student deactivation should happen based on school status,
 * which depends on whether *any* active courses remain.
 * @param {number} courseId - The IDCurso of the course to deactivate.
 * @returns {Promise<object>} The updated course object.
 */
export async function deactivateCourse(courseId) {
  const { data, error } = await supabase
    .from("CURSO")
    .update({ Activo: false })
    .eq("IDCurso", courseId)
    .select()
    .single();

  if (error) {
    console.error(`Error deactivating course ${courseId}:`, error);
    throw new Error("No se pudo desactivar el curso.");
  }

  // NOTE: We don't deactivate students here directly.
  // SchoolList component should re-evaluate school status after course query invalidation.
  // If a school becomes inactive, THEN students should be deactivated.
  // This logic needs careful implementation in the UI layer.

  return data;
}

/**
 * Marks a course as active (Activo = true) and reactivates associated students.
 * It also sets the FechaBaja of reactivated students to null.
 * @param {number} courseId - The IDCurso of the course to reactivate.
 * @returns {Promise<object>} The updated course object.
 */
export async function reactivateCourse(courseId) {
  // 1. Reactivate the course
  const { data: courseData, error: courseError } = await supabase
    .from("CURSO")
    .update({ Activo: true })
    .eq("IDCurso", courseId)
    .select("NombreEscuela") // Select the school name needed for student update
    .single();

  if (courseError) {
    console.error(`Error reactivating course ${courseId}:`, courseError);
    throw new Error("No se pudo reactivar el curso.");
  }

  // Check if we got the school name
  if (!courseData || !courseData.NombreEscuela) {
    console.error(
      `Could not retrieve NombreEscuela for course ${courseId} after reactivation.`
    );
    // Decide how to handle this: maybe throw an error or just log and continue?
    // Throwing error prevents partial success state (course active, students not)
    throw new Error(
      "No se pudo obtener la escuela asociada al curso después de reactivarlo."
    );
  }

  const schoolName = courseData.NombreEscuela;

  // 2. Reactivate students associated with the school
  console.log(
    `Reactivating students for school: ${schoolName} due to course ${courseId} reactivation.`
  );
  const { count, error: studentError } = await supabase
    .from("ALUMNO")
    // Set Activo to true and FechaBaja to null
    .update({ Activo: true, FechaBaja: null })
    // Match students from the same school
    .eq("NombreEscuela", schoolName)
    // Only reactivate those who were inactive
    .eq("Activo", false);

  if (studentError) {
    // Log the error, but don't necessarily throw, as the course *was* reactivated.
    // The user might need to manually check students. Consider adding a toast notification here.
    console.error(
      `Error reactivating students for school ${schoolName}:`,
      studentError
    );
    // Optionally: toast.error(`Error al reactivar alumnos de la escuela ${schoolName}.`);
  } else {
    console.log(`Reactivated ${count || 0} students for school ${schoolName}.`);
    // Optionally: toast.success(`${count || 0} alumnos de ${schoolName} reactivados.`);
  }

  // Return the reactivated course data (even if student update had issues)
  // The calling component uses this data, so we need NombreEscuela anyway.
  return courseData;
}

// Add delete course function later if needed
