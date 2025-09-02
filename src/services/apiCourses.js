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
  const {
    NombreEscuela,
    InicioCurso,
    FinCurso,
    DiaClase,
    Activo = true,
  } = courseData;

  // Basic validation
  // Corrected: Check NombreEscuela
  if (!NombreEscuela || !InicioCurso || !FinCurso || !DiaClase) {
    throw new Error(
      "Faltan datos obligatorios para crear el curso (Escuela, Fechas, Día)."
    );
  }

  // Validar que la fecha de fin sea posterior a la de inicio
  const startDate = new Date(InicioCurso);
  const endDate = new Date(FinCurso);
  if (endDate <= startDate) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }

  // IMPORTANTE: Solo puede haber un curso activo por escuela
  if (Activo) {
    console.log(
      `[apiCourses] Desactivando cursos activos de la escuela: ${NombreEscuela}`
    );

    // Primero, obtener los cursos activos que serán desactivados
    const { data: activeCourses, error: getError } = await supabase
      .from("CURSO")
      .select("IDCurso")
      .eq("NombreEscuela", NombreEscuela)
      .eq("Activo", true);

    if (getError) {
      console.error("Error al obtener cursos activos:", getError);
      throw new Error("Error al verificar cursos activos existentes.");
    }

    // Desactivar todos los cursos activos de la misma escuela
    if (activeCourses && activeCourses.length > 0) {
      const { error: deactivateError } = await supabase
        .from("CURSO")
        .update({ Activo: false })
        .eq("NombreEscuela", NombreEscuela)
        .eq("Activo", true);

      if (deactivateError) {
        console.error("Error al desactivar cursos:", deactivateError);
        throw new Error(
          "Error al desactivar cursos anteriores: " + deactivateError.message
        );
      }

      console.log(
        `[apiCourses] ${activeCourses.length} curso(s) desactivado(s) de ${NombreEscuela}`
      );

      // Desactivar estudiantes de la escuela y establecer FechaBaja
      const currentMonthName = getCurrentMonthName();

      const { error: deactivateStudentsError } = await supabase
        .from("ALUMNO")
        .update({
          Activo: false,
          FechaBaja: new Date().toISOString(),
          // Actualizar el campo de bajas del mes actual
          [`Bajas${currentMonthName}`]: true,
        })
        .eq("NombreEscuela", NombreEscuela)
        .eq("Activo", true);

      if (deactivateStudentsError) {
        console.warn(
          "Warning al desactivar estudiantes:",
          deactivateStudentsError
        );
        // No lanzar error aquí, solo advertir
      } else {
        console.log(
          `[apiCourses] Estudiantes de ${NombreEscuela} desactivados`
        );
      }
    }
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
    Activo: !!Activo,
  };

  console.log("[apiCourses] Insertando nuevo curso:", newCourse);

  const { data, error } = await supabase
    .from("CURSO")
    .insert([newCourse])
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    throw new Error("No se pudo crear el curso: " + error.message);
  }

  // Si el nuevo curso es activo, manejar la inscripción automática de estudiantes y actualizar el estado de la escuela
  if (Activo) {
    console.log(
      `[apiCourses] Verificando estudiantes para inscripción automática en ${NombreEscuela}`
    );

    // Buscar estudiantes activos de esa escuela
    const { data: activeStudents, error: studentsError } = await supabase
      .from("ALUMNO")
      .select("NumeroControl, Nombre, ApellidoPaterno, Activo, Grado")
      .eq("NombreEscuela", NombreEscuela)
      .eq("Activo", true);

    if (studentsError) {
      console.warn("Error al buscar estudiantes activos:", studentsError);
    } else if (activeStudents && activeStudents.length > 0) {
      console.log(
        `[apiCourses] Encontrados ${activeStudents.length} estudiantes activos que serán automáticamente inscritos en el nuevo curso`
      );

      // Preguntar si quiere promocionar grados
      const shouldPromoteGrades = window.confirm(
        "Vas a iniciar un curso nuevo. ¿Quieres actualizar los grados de tus alumnos inscritos?\n\nEsto incrementará el grado de todos los estudiantes en 1 (por ejemplo, de 4° a 5°)."
      );

      if (shouldPromoteGrades) {
        // Actualizar grados de los estudiantes
        for (const student of activeStudents) {
          if (student.Grado && !isNaN(parseInt(student.Grado))) {
            const currentGrade = parseInt(student.Grado);
            const newGrade = currentGrade + 1;

            const { error: gradeUpdateError } = await supabase
              .from("ALUMNO")
              .update({ Grado: newGrade.toString() })
              .eq("NumeroControl", student.NumeroControl);

            if (gradeUpdateError) {
              console.warn(
                `Error actualizando grado del estudiante ${student.NumeroControl}:`,
                gradeUpdateError
              );
            }
          }
        }
        console.log(
          `[apiCourses] Grados actualizados para los estudiantes de ${NombreEscuela}`
        );
      }

      console.log(
        `[apiCourses] Estudiantes inscritos automáticamente:`,
        activeStudents.map(
          (s) => `${s.NumeroControl} - ${s.Nombre} ${s.ApellidoPaterno}`
        )
      );
    } else {
      console.log(
        `[apiCourses] No se encontraron estudiantes activos en ${NombreEscuela} para inscribir`
      );
    }

    // Actualizar el estado de la escuela a activa
    await updateSchoolActiveStatus(NombreEscuela);
  }

  return data;
}

// Función auxiliar para obtener el nombre del mes actual
function getCurrentMonthName() {
  const months = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
  };
  const currentMonth = new Date().toISOString().slice(5, 7);
  return months[currentMonth] || "Enero";
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
 * Marks a course as inactive (Activo = false) and deactivates associated students.
 * When a course is deactivated, all students from that school are also deactivated.
 * @param {number} courseId - The IDCurso of the course to deactivate.
 * @returns {Promise<object>} The updated course object.
 */
export async function deactivateCourse(courseId) {
  // Primero obtener información del curso
  const { data: courseData, error: getCourseError } = await supabase
    .from("CURSO")
    .select("NombreEscuela")
    .eq("IDCurso", courseId)
    .single();

  if (getCourseError) {
    console.error(`Error getting course ${courseId}:`, getCourseError);
    throw new Error("No se pudo obtener información del curso.");
  }

  if (!courseData?.NombreEscuela) {
    throw new Error("No se pudo identificar la escuela del curso.");
  }

  const schoolName = courseData.NombreEscuela;

  // Desactivar el curso
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

  console.log(
    `[apiCourses] Curso ${courseId} desactivado. Desactivando estudiantes de ${schoolName}`
  );

  // Desactivar estudiantes de esa escuela y actualizar bajas del mes actual
  const currentMonthName = getCurrentMonthName();
  const { error: deactivateStudentsError } = await supabase
    .from("ALUMNO")
    .update({
      Activo: false,
      FechaBaja: new Date().toISOString(),
      [`Bajas${currentMonthName}`]: true,
    })
    .eq("NombreEscuela", schoolName)
    .eq("Activo", true);

  if (deactivateStudentsError) {
    console.warn(
      `Warning al desactivar estudiantes de ${schoolName}:`,
      deactivateStudentsError
    );
    // No lanzar error, solo advertir
  } else {
    console.log(
      `[apiCourses] Estudiantes de ${schoolName} desactivados por finalización del curso`
    );
  }

  // Update school active status
  await updateSchoolActiveStatus(schoolName);

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

  // 2. Reactivate students associated with the school and handle auto-enrollment
  console.log(
    `Reactivating students for school: ${schoolName} due to course ${courseId} reactivation.`
  );

  // Buscar estudiantes inactivos de esa escuela para reactivar
  const {
    data: inactiveStudents,
    count,
    error: studentError,
  } = await supabase
    .from("ALUMNO")
    .update({ Activo: true, FechaBaja: null })
    .eq("NombreEscuela", schoolName)
    .eq("Activo", false)
    .select("NumeroControl, Nombre, ApellidoPaterno");

  if (studentError) {
    console.error(
      `Error reactivating students for school ${schoolName}:`,
      studentError
    );
  } else {
    console.log(`Reactivated ${count || 0} students for school ${schoolName}.`);
    if (inactiveStudents && inactiveStudents.length > 0) {
      console.log(
        `[apiCourses] Estudiantes reactivados e inscritos automáticamente:`,
        inactiveStudents.map(
          (s) => `${s.NumeroControl} - ${s.Nombre} ${s.ApellidoPaterno}`
        )
      );
    }
  }

  // 3. Verificar si hay estudiantes activos sin curso que puedan inscribirse automáticamente
  const { data: activeStudentsWithoutCourse } = await supabase
    .from("ALUMNO")
    .select("NumeroControl, Nombre, ApellidoPaterno")
    .eq("NombreEscuela", schoolName)
    .eq("Activo", true);

  if (activeStudentsWithoutCourse && activeStudentsWithoutCourse.length > 0) {
    console.log(
      `[apiCourses] ${activeStudentsWithoutCourse.length} estudiantes activos encontrados para el curso reactivado`
    );
  }

  // Update school active status
  await updateSchoolActiveStatus(schoolName);

  // Return the reactivated course data (even if student update had issues)
  // The calling component uses this data, so we need NombreEscuela anyway.
  return courseData;
}

/**
 * Updates the active status of a school based on whether it has active courses.
 * @param {string} schoolName - The name of the school to update.
 */
export async function updateSchoolActiveStatus(schoolName) {
  try {
    console.log(`[apiCourses] Verificando estado de escuela: ${schoolName}`);

    // Check if the school has any active courses
    const { data: activeCourses, error: checkError } = await supabase
      .from("CURSO")
      .select("IDCurso, Activo")
      .eq("NombreEscuela", schoolName)
      .eq("Activo", true);

    if (checkError) {
      console.error("Error checking active courses:", checkError);
      return;
    }

    const hasActiveCourses = activeCourses && activeCourses.length > 0;
    console.log(
      `[apiCourses] Escuela ${schoolName} tiene ${
        activeCourses?.length || 0
      } cursos activos`
    );

    // Get current school status
    const { data: currentSchool, error: getSchoolError } = await supabase
      .from("ESCUELA")
      .select("Activo")
      .eq("NombreEscuela", schoolName)
      .single();

    if (getSchoolError) {
      console.error("Error getting current school status:", getSchoolError);
      return;
    }

    // Only update if status has changed
    if (currentSchool.Activo !== hasActiveCourses) {
      const { error: updateError } = await supabase
        .from("ESCUELA")
        .update({ Activo: hasActiveCourses })
        .eq("NombreEscuela", schoolName);

      if (updateError) {
        console.error("Error updating school active status:", updateError);
      } else {
        console.log(
          `[apiCourses] Escuela ${schoolName} actualizada de ${
            currentSchool.Activo ? "activa" : "inactiva"
          } a ${hasActiveCourses ? "activa" : "inactiva"}`
        );
      }
    } else {
      console.log(
        `[apiCourses] Escuela ${schoolName} ya está correctamente marcada como ${
          hasActiveCourses ? "activa" : "inactiva"
        }`
      );
    }
  } catch (error) {
    console.error("Error in updateSchoolActiveStatus:", error);
  }
}

/**
 * Finalizes a course (marks as inactive) and updates school status accordingly.
 * @param {number} courseId - The IDCurso of the course to finalize.
 * @returns {Promise<object>} The updated course object.
 */
export async function finalizeCourse(courseId) {
  // Get course information first
  const { data: courseData, error: getCourseError } = await supabase
    .from("CURSO")
    .select("NombreEscuela, Activo")
    .eq("IDCurso", courseId)
    .single();

  if (getCourseError) {
    console.error(`Error getting course ${courseId}:`, getCourseError);
    throw new Error("No se pudo obtener información del curso.");
  }

  if (!courseData?.NombreEscuela) {
    throw new Error("No se pudo identificar la escuela del curso.");
  }

  const schoolName = courseData.NombreEscuela;

  // Only proceed if course is currently active
  if (!courseData.Activo) {
    throw new Error("El curso ya está finalizado.");
  }

  // Mark course as finalized
  const { data, error } = await supabase
    .from("CURSO")
    .update({ Activo: false })
    .eq("IDCurso", courseId)
    .select()
    .single();

  if (error) {
    console.error(`Error finalizing course ${courseId}:`, error);
    throw new Error("No se pudo finalizar el curso.");
  }

  console.log(`[apiCourses] Curso ${courseId} finalizado`);

  // Deactivate students from this school and update monthly withdrawals
  const currentMonthName = getCurrentMonthName();
  const { error: deactivateStudentsError } = await supabase
    .from("ALUMNO")
    .update({
      Activo: false,
      FechaBaja: new Date().toISOString(),
      [`Bajas${currentMonthName}`]: true,
    })
    .eq("NombreEscuela", schoolName)
    .eq("Activo", true);

  if (deactivateStudentsError) {
    console.warn(
      `Warning al desactivar estudiantes de ${schoolName}:`,
      deactivateStudentsError
    );
  } else {
    console.log(
      `[apiCourses] Estudiantes de ${schoolName} desactivados por finalización del curso`
    );
  }

  // Update school active status
  await updateSchoolActiveStatus(schoolName);

  return data;
}

/**
 * Synchronizes all school active statuses based on their active courses.
 * This function should be called to fix any inconsistencies.
 */
export async function syncAllSchoolStatuses() {
  try {
    console.log(
      "[apiCourses] Iniciando sincronización de estados de escuelas..."
    );

    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from("ESCUELA")
      .select("NombreEscuela, Activo");

    if (schoolsError) {
      console.error("Error fetching schools:", schoolsError);
      return;
    }

    // For each school, check if it has active courses and update accordingly
    for (const school of schools) {
      await updateSchoolActiveStatus(school.NombreEscuela);
    }

    console.log("[apiCourses] Sincronización de estados completada");
  } catch (error) {
    console.error("Error in syncAllSchoolStatuses:", error);
  }
}

// Add delete course function later if needed
