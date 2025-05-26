import supabase from "./supabase"; // Import Supabase client
import {
  differenceInDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

// Helper function to simulate network delay (can be removed or kept for testing)
// const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// --- School Data ---
export async function getSchools() {
  // await delay(500); // Simulate API call
  const { data, error } = await supabase
    .from("ESCUELA")
    .select("NombreEscuela, URLLogo"); // Corregido: Seleccionar nombres originales

  if (error) {
    console.error("Error fetching schools:", error);
    throw new Error("Could not fetch schools data.");
  }

  // Corregido: Mapear los datos para crear los alias 'id' y 'name' en JavaScript
  return data.map((school) => ({
    id: school.NombreEscuela, // NombreEscuela es el PK y se usará como id
    name: school.NombreEscuela, // NombreEscuela también se usará como name
    URLLogo: school.URLLogo,
  }));
}

// --- Course Data ---
export async function getCoursesForSchool(schoolId) {
  if (!schoolId) return [];
  const { data, error } = await supabase
    .from("CURSO")
    .select(
      "IDCurso, NombreEscuela, DiaClase, Activo, InicioCurso, FinCurso" // Solo los campos que existen
    )
    .eq("NombreEscuela", schoolId);

  if (error) {
    console.error("Error fetching courses for school:", error);
    throw new Error("Could not fetch courses data for the selected school.");
  }
  console.log("[apiAttendance.js] Raw courses data from Supabase:", data);
  // Mapear los datos para crear los alias necesarios ('id', 'name', 'school_id', 'class_days')
  return data.map((course) => {
    console.log(
      "[apiAttendance.js] Mapping course:",
      course,
      "DiaClase value:",
      course.DiaClase
    );
    return {
      id: course.IDCurso,
      name: course.IDCurso,
      school_id: course.NombreEscuela,
      class_days: course.DiaClase,
      activo: course.Activo,
      inicio: course.InicioCurso,
      fin: course.FinCurso,
    };
  });
}

// --- Student Data ---
export async function getStudentsForCourse(schoolName) {
  if (!schoolName) return [];
  const { data, error } = await supabase
    .from("ALUMNO")
    .select(
      "NumeroControl, Nombre, ApellidoPaterno, ApellidoMaterno, Activo, NombreEscuela, Profesor, Rango, Grado"
    )
    .eq("NombreEscuela", schoolName)
    .eq("Activo", true);

  if (error) {
    console.error("Error fetching students for course:", error);
    throw new Error("Could not fetch students data for the selected course.");
  }
  // Mapear los datos para crear los alias necesarios
  return data.map((student) => ({
    id: student.NumeroControl,
    firstName: student.Nombre,
    lastNameP: student.ApellidoPaterno,
    lastNameM: student.ApellidoMaterno,
    controlNumber: student.NumeroControl,
    profesor: student.Profesor || null,
    rango: student.Rango || null,
    grado: student.Grado || null,
  }));
}

// --- Attendance Records ---
export async function getAttendanceRecords(courseId, month, year) {
  if (!courseId || month === null || year === null) return {};
  // await delay(800); // Simulate API call

  const startDate = format(new Date(year, month, 1), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date(year, month, 1)), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("ASISTENCIA")
    .select("NumeroControl, Fecha, Asistio, IDCurso") // Seleccionar nombres originales
    .eq("IDCurso", courseId)
    .gte("Fecha", startDate)
    .lte("Fecha", endDate);

  if (error) {
    console.error("Error fetching attendance records:", error);
    console.error(
      "Supabase error details:",
      error.message,
      error.details,
      error.hint
    ); // Log detallado
    throw new Error("Could not fetch attendance records.");
  }

  // Transform data into the structure expected by the component: { [studentId]: { [dateString]: boolean } }
  const records = {};
  data.forEach((record) => {
    const studentId = record.NumeroControl; // Usar NumeroControl como student_id para la clave del objeto
    if (!records[studentId]) {
      records[studentId] = {};
    }
    const dateKey = format(parseISO(record.Fecha), "yyyy-MM-dd"); // Usar Fecha
    records[studentId][dateKey] = record.Asistio; // Usar Asistio
  });
  return records;
}

export async function saveAttendanceRecords(
  courseId,
  month,
  year,
  attendanceRecordsToSave,
  schoolId
) {
  if (!courseId || month === null || year === null || !schoolId) {
    throw new Error(
      "Course ID, month, year y schoolId son requeridos para guardar asistencia."
    );
  }
  // await delay(1500); // Simulate API call

  // Transform attendanceRecordsToSave ( { [studentId]: { [dateString]: boolean } } )
  // into an array of records for Supabase upsert
  const recordsToUpsert = [];
  for (const studentId in attendanceRecordsToSave) {
    for (const dateString in attendanceRecordsToSave[studentId]) {
      recordsToUpsert.push({
        NumeroControl: studentId,
        IDCurso: courseId,
        Fecha: dateString,
        Asistio: attendanceRecordsToSave[studentId][dateString],
        NombreEscuela: schoolId,
      });
    }
  }

  if (recordsToUpsert.length === 0) {
    // console.log('No attendance changes to save.');
    return { message: "No changes to save." };
  }

  // IMPORTANTE: Para que upsert funcione como "actualizar si existe, insertar si no",
  // las columnas en 'onConflict' DEBEN tener una restricción UNIQUE en la tabla ASISTENCIA.
  // Si IDAsistencia es la PK y es autoincremental, y no hay otra restricción UNIQUE,
  // esto podría insertar duplicados o fallar dependiendo de la configuración exacta.
  // Asumiendo que (NumeroControl, IDCurso, Fecha) es o será UNIQUE.
  const { data, error } = await supabase
    .from("ASISTENCIA")
    .upsert(recordsToUpsert, {
      onConflict: "NumeroControl,IDCurso,Fecha",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("Error saving attendance records:", error);
    // Attempt to provide a more specific error message if possible
    if (error.message.includes("constraint")) {
      throw new Error(
        `Failed to save attendance: A constraint violation occurred. Details: ${error.message}`
      );
    }
    throw new Error(
      `Could not save attendance records. Details: ${error.message}`
    );
  }

  // console.log('Attendance records saved successfully:', data);
  return { message: "Attendance saved successfully!", data };
}

// --- Helper functions previously in mock data (can be removed if not used elsewhere) ---

// Function to get the number of days in a specific month and year
export function getDaysInMonth(year, month) {
  // month is 0-indexed (0 for January, 11 for December)
  return differenceInDays(
    new Date(year, month + 1, 1),
    new Date(year, month, 1)
  );
}

// Function to get all dates in a specific month and year
export function getDatesInMonth(year, month) {
  const firstDay = startOfMonth(new Date(year, month));
  const lastDay = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start: firstDay, end: lastDay });
}

// Function to get specific class days within a month
export function getClassDaysForMonth(year, month, classDays) {
  // Si es null, undefined o string vacío, no hay días de clase
  if (!classDays || typeof classDays !== "string" || classDays.trim() === "") {
    return [];
  }

  // Mapeo de nombres de días a números (date-fns: 0=Domingo, 1=Lunes, ..., 6=Sábado)
  const diasMap = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };

  // Puede venir en mayúsculas/minúsculas, normalizamos y soportamos múltiples días separados por coma
  const dias = classDays
    .split(",")
    .map((d) =>
      d
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
    )
    .map((d) => diasMap[d])
    .filter((d) => typeof d === "number");

  if (dias.length === 0) return [];

  const datesInMonth = getDatesInMonth(year, month);
  return datesInMonth.filter((date) => dias.includes(getDay(date)));
}
