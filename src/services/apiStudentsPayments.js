import supabase from "./supabase";

/**
 * Obtiene estudiantes activos de una escuela específica
 */
export async function getStudentsBySchool(schoolName) {
  if (!schoolName) return [];

  const { data, error } = await supabase
    .from("ALUMNO")
    .select(
      "NumeroControl, Nombre, ApellidoPaterno, ApellidoMaterno, Activo, NombreEscuela, FechaNacimiento, Telefono, Correo, Tutor, Grado, Grupo, Beca, PorcentajeBeca, Profesor, Rango, FechaInscripcion, FechaBaja, Nick, Password, QuienRecoge1, QuienRecoge2, URLImagen"
    )
    .eq("Activo", true)
    .eq("NombreEscuela", schoolName)
    .order("ApellidoPaterno");

  if (error) {
    console.error("Error fetching students by school:", error);
    throw new Error("No se pudieron cargar los estudiantes de la escuela");
  }

  return data || [];
}

/**
 * Obtiene pagos de estudiantes específicos para un curso
 */
export async function getPaymentsByStudentsAndCourse(numeroControls, courseId) {
  if (!numeroControls?.length || !courseId) return [];

  const { data, error } = await supabase
    .from("PAGO")
    .select(
      "NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca,Abono"
    )
    .in("NumeroControl", numeroControls)
    .eq("IDCurso", courseId);

  if (error) {
    console.error("Error fetching payments:", error);
    throw new Error("No se pudieron cargar los pagos");
  }

  return data || [];
}

/**
 * Obtiene pagos de un curso específico, incluyendo de estudiantes que
 * se dieron de baja DURANTE ese curso (que tienen pagos registrados)
 */
export async function getAllPaymentsByCourse(courseId, schoolName) {
  if (!courseId || !schoolName) return [];

  // Obtener todos los estudiantes que alguna vez pertenecieron a esta escuela
  // (activos e inactivos) que tienen pagos en este curso
  const { data: studentsWithPayments, error: studentsError } = await supabase
    .from("ALUMNO")
    .select("NumeroControl")
    .eq("NombreEscuela", schoolName);

  if (studentsError) {
    console.error("Error fetching students for payments:", studentsError);
    throw new Error("No se pudieron cargar los estudiantes");
  }

  if (!studentsWithPayments?.length) return [];

  const numeroControls = studentsWithPayments.map((s) => s.NumeroControl);

  // Ahora obtener todos los pagos del curso para estos estudiantes
  const { data, error } = await supabase
    .from("PAGO")
    .select(
      "NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca,Abono"
    )
    .eq("IDCurso", courseId)
    .in("NumeroControl", numeroControls);

  if (error) {
    console.error("Error fetching all payments by course:", error);
    throw new Error("No se pudieron cargar todos los pagos del curso");
  }

  return data || [];
}
