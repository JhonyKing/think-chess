import supabase from "./supabase";

/**
 * Fetches activities for a specific course.
 * @param {number} courseId - The ID of the course (IDCurso).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of activity objects.
 */
export async function getActivitiesByCourse(courseId) {
  if (!courseId) return [];

  const { data, error } = await supabase
    .from("ACTIVIDAD")
    .select("*")
    .eq("IDCurso", courseId)
    .order("IDActividad", { ascending: true }); // Order by ID or Name?

  if (error) {
    console.error(`Error loading activities for course ${courseId}:`, error);
    throw new Error("No se pudieron cargar las actividades del curso.");
  }

  return data;
}

/**
 * Generates the next sequential activity ID (e.g., CT01, CT02... CT10).
 * @returns {Promise<string>} The next available activity ID.
 */
async function getNextActivityId() {
  const prefix = "CT";
  const { data, error } = await supabase
    .from("ACTIVIDAD")
    .select("IDActividad")
    .like("IDActividad", `${prefix}__`)
    .order("IDActividad", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching last activity ID:", error);
    throw new Error("No se pudo generar el ID de la actividad.");
  }

  let nextNum = 1; // Start from 1 if no previous ID found
  if (data) {
    const lastNumStr = data.IDActividad.substring(prefix.length);
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  // Format number with leading zero if needed (e.g., CT01, CT02... CT10)
  const nextId = `${prefix}${nextNum.toString().padStart(2, "0")}`;

  // Basic check for duplicates, though unlikely with sequential generation unless manually inserted
  const { data: existing, error: checkError } = await supabase
    .from("ACTIVIDAD")
    .select("IDActividad")
    .eq("IDActividad", nextId)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking generated activity ID:", checkError);
    throw new Error("Error al verificar ID de actividad.");
  }
  if (existing) {
    console.error(`Generated Activity ID ${nextId} already exists!`);
    // Handle collision - maybe retry with next number? For now, throw error.
    throw new Error(
      `El ID de actividad generado (${nextId}) ya existe. Intente de nuevo.`
    );
  }

  return nextId;
}

/**
 * Creates a new activity for a course.
 * @param {object} activityData - Object containing activity data.
 * @param {number} activityData.IDCurso - The ID of the course.
 * @param {string} activityData.Nombre - The name/description of the activity.
 * @returns {Promise<object>} A promise that resolves to the newly created activity object.
 */
export async function createActivity(activityData) {
  const { IDCurso, Nombre } = activityData;

  if (!IDCurso || !Nombre || Nombre.trim() === "") {
    throw new Error("Faltan datos para crear la actividad (Curso, Nombre).");
  }

  try {
    const nextId = await getNextActivityId();

    const newActivity = {
      IDActividad: nextId,
      IDCurso,
      Nombre: Nombre.trim(),
    };

    const { data, error } = await supabase
      .from("ACTIVIDAD")
      .insert([newActivity])
      .select()
      .single();

    if (error) {
      console.error("Error creating activity:", error);
      throw new Error("No se pudo crear la actividad.");
    }

    return data;
  } catch (error) {
    // Catch errors from getNextActivityId or insert
    console.error("Failed to create activity:", error);
    throw error; // Re-throw the error to be caught by the mutation
  }
}

// Add update/delete functions later if needed
