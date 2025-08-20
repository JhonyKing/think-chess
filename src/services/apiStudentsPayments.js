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
      "NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca"
    )
    .in("NumeroControl", numeroControls)
    .eq("IDCurso", courseId);

  if (error) {
    console.error("Error fetching payments:", error);
    throw new Error("No se pudieron cargar los pagos");
  }

  return data || [];
}
