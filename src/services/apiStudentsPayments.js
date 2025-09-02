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
 * Obtiene TODOS los pagos de un curso específico.
 * IMPORTANTE: Los pagos NUNCA se excluyen de las estadísticas, incluso
 * si el estudiante se da de baja después, porque el dinero ya fue cobrado.
 */
export async function getAllPaymentsByCourse(courseId, schoolName) {
  if (!courseId || !schoolName) return [];

  // Estrategia simplificada: obtener TODOS los pagos del curso
  // y filtrar por escuela via JOIN con ALUMNO
  const { data, error } = await supabase
    .from("PAGO")
    .select(
      `NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca,Abono,
       ALUMNO!inner(NombreEscuela)`
    )
    .eq("IDCurso", courseId)
    .eq("ALUMNO.NombreEscuela", schoolName);

  if (error) {
    console.error("Error fetching all payments by course:", error);
    throw new Error("No se pudieron cargar todos los pagos del curso");
  }

  return data || [];
}
