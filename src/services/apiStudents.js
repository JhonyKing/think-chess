import toast from "react-hot-toast";
import supabase, { supabaseUrl } from "./supabase";

// Helper function to normalize strings for nick generation
// Removes accents, converts to lowercase, and removes spaces
function normalizeString(str) {
  if (!str) return "";
  return str
    .normalize("NFD") // Separate accents from letters
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .replace(/\s+/g, ""); // Remove spaces
}

// Helper function to generate a unique nick
async function generateUniqueNick(apellidoPaterno, nombre) {
  const baseApellido = normalizeString(apellidoPaterno);
  const baseNombre = normalizeString(nombre);

  // Handle cases where name parts might be missing (though should be required by form)
  if (!baseApellido || !baseNombre) {
    console.warn("Apellido Paterno or Nombre missing for nick generation.");
    // Fallback or throw error? Using timestamp for uniqueness for now.
    return `usuario${Date.now()}`;
  }

  const baseNick = `${baseApellido}${baseNombre}`;
  let finalNick = baseNick;
  let counter = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if the current nick (base or base+counter) exists
    const { data: existingNick, error: checkError } = await supabase
      .from("ALUMNO")
      .select("Nick")
      .eq("Nick", finalNick)
      .maybeSingle(); // Check for exact match

    if (checkError) {
      console.error("Error checking for existing nick:", checkError);
      throw new Error("No se pudo verificar la disponibilidad del nick.");
    }

    if (!existingNick) {
      // Nick is unique, break the loop
      break;
    }

    // Nick exists, increment counter and try again
    counter++;
    finalNick = `${baseNick}${counter}`;
  }

  return finalNick;
}

export async function getStudents() {
  const { data, error } = await supabase.from("ALUMNO").select("*");

  if (error) {
    console.error("Student load error:", error);
    throw new Error("No se pudieron cargar los alumnos");
  }

  return data;
}

export async function deleteStudent(id) {
  const { data, error } = await supabase
    .from("ALUMNO")
    .delete()
    .eq("NumeroControl", id);

  if (error) {
    console.error("Student delete error:", error);
    throw new Error("No se pudo eliminar el alumno");
  }

  return data;
}

/**
 * Gets the latest NumeroControl for the current year from the database.
 * @returns {Promise<string|null>} The latest NumeroControl or null if none found.
 */
export async function getLatestNumeroControlForCurrentYear() {
  const currentYearPrefix =
    new Date().getFullYear().toString().slice(-2) + "100";

  const { data, error } = await supabase
    .from("ALUMNO")
    .select("NumeroControl")
    .like("NumeroControl", `${currentYearPrefix}%%%`)
    .order("NumeroControl", { ascending: false })
    .limit(1)
    .maybeSingle(); // Use maybeSingle to handle no results gracefully

  if (error) {
    console.error("Error fetching latest NumeroControl:", error);
    // Depending on policy, maybe we allow creation even if fetch fails?
    // For now, throw error to prevent potential duplicates if DB is unreachable
    throw new Error("No se pudo obtener el último número de control.");
  }

  return data ? data.NumeroControl : null;
}

/**
 * Creates a new student or edits an existing one, handling image upload and nick generation.
 * @param {object} newStudentData - Data for the student.
 * @param {string} [id] - Optional ID (NumeroControl) for editing.
 */
export async function createEditStudent(newStudentData, id) {
  const hasImagePath = newStudentData.URLImagen instanceof File;

  let imageName = null;
  let imagePath = null;

  // 1. Handle Image Upload (if present)
  if (hasImagePath) {
    imageName = `${Date.now()}-${newStudentData.URLImagen.name}`.replaceAll(
      "/",
      ""
    );
    imagePath = `${supabaseUrl}/storage/v1/object/public/imagenesusuarios/${imageName}`;

    // Upload image
    const { error: storageError } = await supabase.storage
      .from("imagenesusuarios")
      .upload(imageName, newStudentData.URLImagen);

    // Handle storage error
    if (storageError) {
      console.error("Storage upload error:", storageError);
      toast.error("Error al subir la imagen del estudiante.");
      throw new Error(
        "No se pudo subir la imagen. El estudiante no fue creado/actualizado."
      );
    }
  }

  // 2. Prepare data for DB operation
  // Make a shallow copy to avoid modifying the original form data object
  let studentDataForDB = { ...newStudentData };

  // Handle image path logic
  if (hasImagePath) {
    studentDataForDB.URLImagen = imagePath;
  } else if (id && !(newStudentData.URLImagen instanceof File)) {
    // If editing and no NEW file provided, delete the key
    // so Supabase doesn't try to update it to null/undefined.
    delete studentDataForDB.URLImagen;
  } else if (!id && !newStudentData.URLImagen) {
    // If creating and no image provided, explicitly set to null
    studentDataForDB.URLImagen = null;
  }
  // Note: The case where hasImagePath is false AND we are creating is covered
  // by the line above setting it to null if !newStudentData.URLImagen.

  // Ensure boolean fields are handled correctly
  studentDataForDB.Activo = !!studentDataForDB.Activo;
  studentDataForDB.Beca = !!studentDataForDB.Beca;

  // Clean up potential undefined values for non-required text fields
  // Supabase might prefer null over undefined if the column is nullable
  studentDataForDB.ApellidoMaterno = studentDataForDB.ApellidoMaterno || null;
  studentDataForDB.Grado = studentDataForDB.Grado || null;
  studentDataForDB.Grupo = studentDataForDB.Grupo || null;
  studentDataForDB.FechaNacimiento = studentDataForDB.FechaNacimiento || null;
  studentDataForDB.Telefono = studentDataForDB.Telefono || null;
  studentDataForDB.Correo = studentDataForDB.Correo || null;
  studentDataForDB.Profesor = studentDataForDB.Profesor || null;
  // studentDataForDB.Rango is now a select, should have a value
  studentDataForDB.QuienRecoge1 = studentDataForDB.QuienRecoge1 || null;
  studentDataForDB.QuienRecoge2 = studentDataForDB.QuienRecoge2 || null;

  // 3. Perform DB Operation (Insert or Update)
  let query = supabase.from("ALUMNO");
  let operationType = id ? "update" : "insert"; // Track operation type

  // A) CREATE Specific Logic
  if (!id) {
    // Generate Nick and Password only on create
    try {
      const uniqueNick = await generateUniqueNick(
        studentDataForDB.ApellidoPaterno,
        studentDataForDB.Nombre
      );
      studentDataForDB.Nick = uniqueNick;
      studentDataForDB.Password = uniqueNick; // Password is same as nick
    } catch (error) {
      toast.error(error.message);
      throw new Error("Fallo en la generación del Nick/Password.");
    }

    // Add FechaInscripcion automatically on create
    studentDataForDB.FechaInscripcion = new Date().toISOString();
    // Ensure required fields like NumeroControl are present if not editing
    if (!studentDataForDB.NumeroControl) {
      // This should ideally be handled by form validation + generation logic
      console.error("NumeroControl missing during create operation");
      throw new Error("Falta el Número de Control para crear el alumno.");
    }
    // Remove FechaBaja explicitly if creating
    delete studentDataForDB.FechaBaja;

    // Set query for insert
    query = query.insert([studentDataForDB]);
  }
  // B) EDIT Specific Logic
  else {
    // Remove fields that should not be updated
    delete studentDataForDB.NumeroControl; // Identifier, not updatable
    delete studentDataForDB.FechaInscripcion; // Don't update inscription date
    delete studentDataForDB.Nick; // Don't update Nick on edit
    delete studentDataForDB.Password; // Don't update Password on edit

    // Set query for update
    query = query.update(studentDataForDB).eq("NumeroControl", id);
  }

  // Execute the query
  const { data, error: dbError } = await query.select().single();

  // 4. Handle DB Error
  if (dbError) {
    console.error(`DB ${operationType} error:`, dbError);
    // Provide more specific error message if possible
    let userMessage = `Error al ${
      operationType === "insert" ? "crear" : "actualizar"
    } el alumno.`;
    if (
      dbError.message.includes("duplicate key value violates unique constraint")
    ) {
      // Example: Check for specific constraint violation if needed
      if (dbError.message.includes("ALUMNO_pkey")) {
        userMessage = "Error: Ya existe un alumno con ese Número de Control.";
      } else if (dbError.message.includes("ALUMNO_Nick_key")) {
        // Assuming you add a unique constraint on Nick
        userMessage =
          "Error: Ya existe un alumno con un Nick similar. Intente de nuevo.";
        // Consider if nick generation needs retry logic here, though generateUniqueNick should prevent this.
      } else {
        userMessage = `Error de base de datos: ${dbError.message}`;
      }
    } else {
      userMessage = dbError.message || userMessage;
    }

    toast.error(userMessage);

    // TODO: Consider deleting the uploaded image if DB insert/update fails?
    // This is complex as the error might happen after upload.
    // For now, the image might remain orphaned in storage.

    throw new Error(
      `No se pudo ${
        operationType === "insert" ? "crear" : "actualizar"
      } el estudiante.`
    );
  }

  return data;
}

/**
 * Deactivates a student by setting FechaBaja and Activo = false.
 * @param {string} id - NumeroControl of the student to deactivate.
 */
export async function deactivateStudent(id) {
  const { data, error } = await supabase
    .from("ALUMNO")
    .update({ FechaBaja: new Date().toISOString(), Activo: false })
    .eq("NumeroControl", id)
    .select() // Select to confirm the update
    .single();

  if (error) {
    console.error("Student deactivate error:", error);
    toast.error("Error al dar de baja al alumno.");
    throw new Error("No se pudo dar de baja al alumno.");
  }

  return data;
}

/**
 * Deactivates all students associated with a specific school.
 * Sets Activo = false for students matching the school name.
 * @param {string} schoolName - The NombreEscuela of the school whose students to deactivate.
 */
export async function deactivateStudentsBySchool(schoolName) {
  if (!schoolName) {
    console.warn("Attempted to deactivate students without school name.");
    return; // Or throw error?
  }

  console.log(`Deactivating students for school: ${schoolName}`);

  const { count, error } = await supabase
    .from("ALUMNO")
    .update({ Activo: false })
    .eq("NombreEscuela", schoolName)
    .eq("Activo", true); // Only update those who are currently active

  if (error) {
    console.error(
      `Error deactivating students for school ${schoolName}:`,
      error
    );
    // Don't throw here, maybe just toast? The course deactivation might still succeed.
    toast.error(`Error al desactivar alumnos de la escuela ${schoolName}.`);
  } else {
    console.log(`Deactivated ${count || 0} students for school ${schoolName}.`);
    // Optional: Toast success for student deactivation?
  }
}

/**
 * Reactivates a student by setting FechaBaja to null and Activo = true.
 * @param {string} id - NumeroControl of the student to reactivate.
 */
export async function reactivateStudent(id) {
  const { data, error } = await supabase
    .from("ALUMNO")
    .update({ FechaBaja: null, Activo: true })
    .eq("NumeroControl", id)
    .select() // Select to confirm the update
    .single();

  if (error) {
    console.error("Student reactivate error:", error);
    toast.error("Error al reactivar al alumno.");
    throw new Error("No se pudo reactivar al alumno.");
  }

  return data;
}
