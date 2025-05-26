import { useState, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { format, getYear, getMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  getSchools,
  getCoursesForSchool,
  getStudentsForCourse,
  getAttendanceRecords,
  saveAttendanceRecords,
  getClassDaysForMonth,
} from "../services/apiAttendance";
// import { es } from 'date-fns/locale'; // Para formatos en español si es necesario

// UI Components
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Button from "../ui/Button";
// import Spinner from "../ui/Spinner"; // Not used yet, but good to have if needed for fine-grained loading

// Helper function to fetch an image and convert it to Data URL
async function imageToDataUrl(url) {
  console.log(`[imageToDataUrl] Attempting to load image from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `[imageToDataUrl] Direct fetch failed for ${url}. Trying public folder path.`
      );
      const publicUrl =
        window.location.origin + (url.startsWith("/") ? url : "/" + url);
      console.log(`[imageToDataUrl] Fallback public URL: ${publicUrl}`);
      const fallbackResponse = await fetch(publicUrl);
      if (!fallbackResponse.ok) {
        console.error(
          `[imageToDataUrl] Failed to fetch image from ${url} (status: ${response.status}) and ${publicUrl} (status: ${fallbackResponse.status}).`
        );
        // throw new Error(`Network response was not ok for image: ${url}`); // Soft fail
        return null;
      }
      const blob = await fallbackResponse.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log(
            `[imageToDataUrl] Successfully converted blob from ${publicUrl} to Data URL.`
          );
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          console.error(
            `[imageToDataUrl] FileReader error for ${publicUrl}:`,
            error
          );
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(
          `[imageToDataUrl] Successfully converted blob from ${url} to Data URL.`
        );
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.error(`[imageToDataUrl] FileReader error for ${url}:`, error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(
      "[imageToDataUrl] General error converting image to Data URL:",
      error,
      "URL:",
      url
    );
    return null;
  }
}

// --- Mock Data & Helpers ---
// Helper functions for month and year selectors, kept global as they don't depend on component state.
const getMonths = () => [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
];

const getYears = () => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
};

// --- Styled Components specific to Attendance page ---
// PageContainer will be replaced by Rows and direct styling or a main app layout if available

// Panel styles can be kept if they are distinct and provide necessary framing
const StyledPanel = styled.div`
  background-color: var(
    --color-grey-0,
    #ffffff
  ); // Using CSS var for background
  padding: 2.4rem; // Adjusted padding to be more consistent with ui/Row gap
  border-radius: var(
    --border-radius-md,
    7px
  ); // Using CSS var for border-radius
  box-shadow: var(
    --shadow-md,
    0 0.6rem 2.4rem rgba(0, 0, 0, 0.06)
  ); // Using CSS var for shadow
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const LeftPanelContent = styled(StyledPanel)`
  width: 380px; // Slightly increased width for better spacing
  gap: 2.4rem;
`;

const RightPanelContent = styled(StyledPanel)`
  flex-grow: 1;
`;

// SelectWrapper can be kept, ensure label and select styles are harmonious
const SelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem; // Consistent gap

  label {
    font-weight: 500; // Consistent with other labels if any
    font-size: 1.4rem;
    color: var(--color-grey-700, #374151);
  }

  select {
    padding: 0.8rem 1.2rem;
    border-radius: var(--border-radius-sm, 5px);
    border: 1px solid var(--color-grey-300, #d1d5db);
    background-color: var(--color-grey-0, #fff);
    font-size: 1.4rem;
    box-shadow: var(--shadow-sm);
    &:focus {
      border-color: var(--color-brand-500, #6a0dad); // Use brand color
      outline: none;
      box-shadow: 0 0 0 2px var(--color-brand-100, #e9d5ff); // Lighter brand color for focus ring
    }
    &:disabled {
      background-color: var(--color-grey-100, #f3f4f6);
      cursor: not-allowed;
    }
  }
`;

// Table specific styles - likely to remain custom
const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
  border: 1px solid var(--color-grey-200, #e5e7eb);
  border-radius: var(--border-radius-md);
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse; // Important for table styling
  font-size: 1.4rem; // Standardized font size

  th,
  td {
    border: 1px solid var(--color-grey-200, #e5e7eb);
    padding: 1.2rem 1.6rem; // Standardized padding
    text-align: center;
    white-space: nowrap;
  }

  th {
    background-color: var(--color-brand-600, #6a0dad); // Using brand color
    color: var(--color-brand-50, #f8fafc);
    font-weight: 600;
    position: relative; // For HeaderButtonContainer positioning
  }

  th .date-header-content {
    display: block;
    margin-bottom: 0.8rem;
  }

  td:nth-child(-n + 5) {
    // First 5 data columns (No., Control, Apellidos, Nombre)
    text-align: left;
  }

  tbody tr:nth-child(even) {
    background-color: var(--color-grey-50, #f9fafb);
  }

  tbody tr:hover {
    background-color: var(--color-grey-100, #f3f4f6);
  }

  input[type="checkbox"] {
    cursor: pointer;
    width: 1.6rem; // Slightly larger checkboxes
    height: 1.6rem;
    accent-color: var(--color-brand-600, #6a0dad);
    &:disabled {
      accent-color: var(--color-grey-300);
    }
  }
`;

// Messages - will try to use theme colors if available through CSS vars
const InfoMessage = styled.p`
  font-style: italic;
  font-size: 1.4rem;
  color: var(--color-grey-500, #6b7280);
  margin-top: 0.8rem;
`;

const ErrorMessage = styled(InfoMessage)`
  color: var(--color-red-700, #b91c1c); // Using error color var
  font-weight: 500;
`;

const SaveStatusMessage = styled.div`
  margin-top: 1.6rem;
  padding: 1.2rem;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  text-align: center;
  color: var(--color-grey-0);
  background-color: ${({ status }) => {
    if (status === "saving") return "var(--color-blue-500, #3b82f6)"; // Example color
    if (status === "success") return "var(--color-green-600, #16a34a)";
    if (status === "error") return "var(--color-red-700, #b91c1c)";
    return "transparent";
  }};
  visibility: ${({ status }) => (status ? "visible" : "hidden")};
  opacity: ${({ status }) => (status ? 1 : 0)};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

// HeaderButton for table date columns - kept specific for now
const HeaderButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
`;

const HeaderButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius-sm);
  padding: 0.2rem 0.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
  }

  &:disabled {
    background-color: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Container for global mark all buttons - can be replaced by Row if simple enough
const GlobalActionsRow = styled(Row)`
  // Using Row as base
  gap: 1rem;
  margin-bottom: 1.6rem;
  align-items: center;
`;

const ButtonsContainer = styled(Row)`
  gap: 1rem;
  margin-top: 1.6rem;
`;

// Styled label para filtros de checkboxes
const FilterCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  font-weight: 400;
  margin-bottom: 0.2rem;
  cursor: pointer;
  input[type="checkbox"] {
    margin-right: 0.6em;
  }
`;

const getLogoDimensions = (img, maxWidth, maxHeight) => {
  // Calcula dimensiones manteniendo aspecto
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
  return { width: img.width * ratio, height: img.height * ratio };
};

const Attendance = () => {
  // --- State Variables ---
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getMonth(new Date()));
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

  const [schoolsList, setSchoolsList] = useState([]);
  const [currentCourseDetails, setCurrentCourseDetails] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [classDays, setClassDays] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});

  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [isLoadingCourseData, setIsLoadingCourseData] = useState(false);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // --- NUEVO: Filtros de alumnos ---
  const [selectedProfesores, setSelectedProfesores] = useState([]);
  const [selectedRangos, setSelectedRangos] = useState([]);
  const [selectedGrados, setSelectedGrados] = useState([]);

  const firstLoadProfesores = useRef(true);
  const firstLoadRangos = useRef(true);
  const firstLoadGrados = useRef(true);

  // Extraer valores únicos de los alumnos activos y ordenarlos alfabéticamente
  const uniqueProfesores = useMemo(() => {
    const set = new Set();
    studentList.forEach((s) => {
      if (typeof s.profesor === "string" && s.profesor.trim() !== "")
        set.add(s.profesor);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [studentList]);
  const uniqueRangos = useMemo(() => {
    const set = new Set();
    studentList.forEach((s) => {
      if (typeof s.rango === "string" && s.rango.trim() !== "")
        set.add(s.rango);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [studentList]);
  const uniqueGrados = useMemo(() => {
    const set = new Set();
    studentList.forEach((s) => {
      if (
        (typeof s.grado === "string" && s.grado.trim() !== "") ||
        (typeof s.grado === "number" && !isNaN(s.grado))
      ) {
        set.add(String(s.grado));
      }
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base", numeric: true })
    );
  }, [studentList]);

  // Cuando cambian escuela, mes o año, resetea los refs para inicializar filtros
  useEffect(() => {
    firstLoadProfesores.current = true;
    firstLoadRangos.current = true;
    firstLoadGrados.current = true;
  }, [selectedSchool, selectedMonth, selectedYear]);

  useEffect(() => {
    if (firstLoadProfesores.current) {
      setSelectedProfesores(uniqueProfesores);
      firstLoadProfesores.current = false;
    }
  }, [uniqueProfesores]);
  useEffect(() => {
    if (firstLoadRangos.current) {
      setSelectedRangos(uniqueRangos);
      firstLoadRangos.current = false;
    }
  }, [uniqueRangos]);
  useEffect(() => {
    if (firstLoadGrados.current) {
      setSelectedGrados(uniqueGrados);
      firstLoadGrados.current = false;
    }
  }, [uniqueGrados]);

  // Filtrar alumnos según los filtros seleccionados
  const filteredStudentList = useMemo(() => {
    return studentList.filter((s) => {
      const profOk =
        selectedProfesores.length === 0 ||
        (s.profesor && selectedProfesores.includes(s.profesor));
      const rangoOk =
        selectedRangos.length === 0 ||
        (s.rango && selectedRangos.includes(s.rango));
      const gradoOk =
        selectedGrados.length === 0 ||
        (s.grado !== undefined && selectedGrados.includes(String(s.grado)));
      return profOk && rangoOk && gradoOk;
    });
  }, [studentList, selectedProfesores, selectedRangos, selectedGrados]);

  // Handlers para checkboxes de filtros
  const handleFilterChange = (type, value) => {
    if (type === "profesor") {
      setSelectedProfesores((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else if (type === "rango") {
      setSelectedRangos((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    } else if (type === "grado") {
      setSelectedGrados((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value]
      );
    }
  };

  // --- Effects ---

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoadingSchools(true);
      setErrorMessage(null);
      try {
        const fetchedSchools = await getSchools();
        setSchoolsList(fetchedSchools);
        if (fetchedSchools.length > 0) {
          // setSelectedSchool(fetchedSchools[0].id); // Auto-select first school if desired
        } else {
          setErrorMessage("No se encontraron escuelas.");
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        setErrorMessage("Error al cargar las escuelas. Intente de nuevo.");
      } finally {
        setIsLoadingSchools(false);
      }
    };
    fetchSchools();
  }, []);

  // Fetch course data, students, and attendance records when school, month, or year changes
  useEffect(() => {
    if (!selectedSchool) {
      setCurrentCourseDetails(null);
      setStudentList([]);
      setClassDays([]);
      setAttendanceRecords({});
      setHasUnsavedChanges(false);
      return;
    }

    const fetchDataForSchoolAndDate = async () => {
      setIsLoadingCourseData(true);
      setIsLoadingAttendance(true);
      setErrorMessage(null);
      setHasUnsavedChanges(false);
      setCurrentCourseDetails(null); // Reset previous course details
      setStudentList([]);
      setClassDays([]);
      setAttendanceRecords({});

      try {
        const fetchedCourses = await getCoursesForSchool(selectedSchool);
        if (fetchedCourses && fetchedCourses.length > 0) {
          const activeCourse = fetchedCourses[0];
          setCurrentCourseDetails(activeCourse);

          // Logs de depuración más detallados
          console.log("[Attendance.jsx] fetchedCourses[0]:", fetchedCourses[0]);
          console.log(
            "[Attendance.jsx] activeCourse (completo después de asignación):",
            activeCourse
          );
          console.log(
            "[Attendance.jsx] Valor directo de activeCourse.classDays:",
            activeCourse.class_days
          ); // Accediendo con el nombre correcto esperado
          console.log(
            "[Attendance.jsx] Valor de activeCourse.DiaClase (por si acaso):",
            activeCourse.DiaClase
          );

          const calculatedClassDays = getClassDaysForMonth(
            selectedYear,
            selectedMonth,
            activeCourse.class_days // Usar activeCourse.class_days consistentemente
          );
          console.log(
            "[Attendance.jsx] activeCourse.class_days pasado a getClassDaysForMonth:",
            activeCourse.class_days
          );
          console.log(
            "[Attendance.jsx] calculatedClassDays:",
            calculatedClassDays
          );
          setClassDays(calculatedClassDays);

          const fetchedStudents = await getStudentsForCourse(
            activeCourse.school_id
          );
          setStudentList(fetchedStudents);

          if (fetchedStudents.length > 0 && calculatedClassDays.length > 0) {
            const fetchedAttendance = await getAttendanceRecords(
              activeCourse.id,
              selectedMonth,
              selectedYear
            );

            const initialRecords = {};
            fetchedStudents.forEach((student) => {
              initialRecords[student.id] = {};
              calculatedClassDays.forEach((day) => {
                const dateString = format(day, "yyyy-MM-dd");
                initialRecords[student.id][dateString] =
                  fetchedAttendance[student.id]?.[dateString] || false;
              });
            });
            setAttendanceRecords(initialRecords);
          } else {
            setAttendanceRecords({});
          }
        } else {
          setErrorMessage(
            `No se encontraron cursos para la escuela seleccionada.`
          );
        }
      } catch (error) {
        console.error("Error fetching data for school/date:", error);
        setErrorMessage(
          error.message ||
            "Error al cargar los datos de asistencia. Verifique la consola."
        );
      } finally {
        setIsLoadingCourseData(false);
        setIsLoadingAttendance(false);
      }
    };

    fetchDataForSchoolAndDate();
  }, [selectedSchool, selectedMonth, selectedYear]);

  // --- Event Handlers ---
  const handleSchoolChange = (event) => {
    setSelectedSchool(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(parseInt(event.target.value, 10));
  };

  const handleYearChange = (event) => {
    setSelectedYear(parseInt(event.target.value, 10));
  };

  const handleAttendanceChange = (studentId, dateString, newStatus) => {
    setAttendanceRecords((prevRecords) => ({
      ...prevRecords,
      [studentId]: {
        ...prevRecords[studentId],
        [dateString]: newStatus,
      },
    }));
    setHasUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleMarkAllForDay = (dateObject, markAsPresent) => {
    const dateString = format(dateObject, "yyyy-MM-dd");
    setAttendanceRecords((prevRecords) => {
      const updatedRecords = { ...prevRecords };
      filteredStudentList.forEach((student) => {
        if (!updatedRecords[student.id]) updatedRecords[student.id] = {};
        updatedRecords[student.id][dateString] = markAsPresent;
      });
      return updatedRecords;
    });
    setHasUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleMarkEntireTable = (markAsPresent) => {
    setAttendanceRecords((prevRecords) => {
      const updatedRecords = { ...prevRecords };
      filteredStudentList.forEach((student) => {
        updatedRecords[student.id] = { ...prevRecords[student.id] };
        classDays.forEach((day) => {
          const dateString = format(day, "yyyy-MM-dd");
          updatedRecords[student.id][dateString] = markAsPresent;
        });
      });
      return updatedRecords;
    });
    setHasUnsavedChanges(true);
    setSaveStatus(null);
  };

  const handleSaveChanges = async () => {
    if (!currentCourseDetails) {
      setErrorMessage("No hay un curso activo para guardar los cambios.");
      setSaveStatus("error");
      return;
    }
    setIsSaving(true);
    setSaveStatus("saving");
    setErrorMessage(null);
    try {
      await saveAttendanceRecords(
        currentCourseDetails.id,
        selectedMonth,
        selectedYear,
        attendanceRecords,
        selectedSchool
      );
      setSaveStatus("success");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      if (error.message && error.message.includes("constraint")) {
        setErrorMessage(
          "Error: No se pudo guardar la asistencia. La base de datos no tiene la restricción UNIQUE sobre (NumeroControl, IDCurso, Fecha). Contacte a soporte."
        );
      } else {
        setErrorMessage(
          error.message || "Error al guardar la asistencia. Intente de nuevo."
        );
      }
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!currentCourseDetails || filteredStudentList.length === 0) {
      alert(
        "Por favor, seleccione una escuela y asegúrese de que haya datos de curso y alumnos cargados."
      );
      return;
    }
    // El PDF siempre se genera con los campos de asistencia en blanco
    const doc = new jsPDF();
    const selectedSchoolObject = schoolsList.find(
      (s) => s.id === selectedSchool
    );
    const PIENSA_AJEDREZ_ID = "school-1"; // O el ID/nombre correcto
    const piensaAjedrezSchoolData = schoolsList.find(
      (s) => s.id === PIENSA_AJEDREZ_ID
    );
    const urlLogoPiensaAjedrez =
      piensaAjedrezSchoolData?.URLLogo ||
      "/logos/default_piensa_ajedrez_logo.png"; // Fallback

    const urlLogoEscuelaActual = selectedSchoolObject?.URLLogo;

    console.log(
      "[handleGeneratePdf] URLLogo Escuela Actual:",
      urlLogoEscuelaActual
    );
    console.log(
      "[handleGeneratePdf] URLLogo Piensa Ajedrez (desde school data o fallback):",
      urlLogoPiensaAjedrez
    );

    const selectedSchoolName =
      selectedSchoolObject?.name || "Escuela Desconocida";
    const courseName = currentCourseDetails.name || "Curso Desconocido";
    const monthName =
      getMonths().find((m) => m.value === selectedMonth)?.label || "";
    const title = `REGISTRO DE ASISTENCIA ${String(
      monthName
    ).toUpperCase()} ${selectedYear}`;

    // --- Logo Handling ---
    let logoEscuelaActualDataUrl = null;
    if (urlLogoEscuelaActual) {
      logoEscuelaActualDataUrl = await imageToDataUrl(urlLogoEscuelaActual);
    } else {
      console.warn(
        "[handleGeneratePdf] URLLogo para escuela actual no encontrado."
      );
    }

    let logoPiensaAjedrezDataUrl = await imageToDataUrl(urlLogoPiensaAjedrez);

    console.log(
      "[handleGeneratePdf] DataURL Logo Escuela Actual:",
      logoEscuelaActualDataUrl
        ? logoEscuelaActualDataUrl.substring(0, 100) + "..."
        : null
    );
    console.log(
      "[handleGeneratePdf] DataURL Logo Piensa Ajedrez:",
      logoPiensaAjedrezDataUrl
        ? logoPiensaAjedrezDataUrl.substring(0, 100) + "..."
        : null
    );

    const logoWidth = 30;
    const logoHeight = 15;
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // Logo Escuela Actual (Izquierda)
    if (logoEscuelaActualDataUrl) {
      try {
        doc.addImage(
          logoEscuelaActualDataUrl,
          "PNG",
          pageMargin,
          currentY,
          logoWidth,
          logoHeight
        );
      } catch (e) {
        console.error(
          "[handleGeneratePdf] Error adding current school logo to PDF:",
          e
        );
        doc.text("Logo Esc. Error", pageMargin, currentY + logoHeight / 2);
      }
    } else {
      doc.text("[Logo Escuela]", pageMargin, currentY + logoHeight / 2);
    }

    // Logo Piensa Ajedrez (Derecha)
    if (logoPiensaAjedrezDataUrl) {
      try {
        doc.addImage(
          logoPiensaAjedrezDataUrl,
          "PNG",
          pageWidth - logoWidth - pageMargin,
          currentY,
          logoWidth,
          logoHeight
        );
      } catch (e) {
        console.error(
          "[handleGeneratePdf] Error adding Piensa Ajedrez logo to PDF:",
          e
        );
        doc.text(
          "Logo Acad. Error",
          pageWidth - logoWidth - pageMargin,
          currentY + logoHeight / 2
        );
      }
    } else {
      doc.text(
        "[Logo Academia]",
        pageWidth - logoWidth - pageMargin,
        currentY + logoHeight / 2
      );
    }

    currentY += logoHeight + 5;

    // --- PDF Header Text ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`ESCUELA: ${selectedSchoolName}`, pageMargin, currentY);
    doc.text(`CURSO: ${courseName}`, pageWidth / 2 + 10, currentY);
    currentY += 7;

    doc.text(`PROFESOR(A): _________________________`, pageMargin, currentY);
    currentY += 10;

    // --- Table Data ---
    const tableColumn = [
      "No.",
      "No. Control",
      "Apellido Paterno",
      "Apellido Materno",
      "Nombre(s)",
      ...classDays.map((day) => format(day, "dd")),
    ];
    const tableRows = [];

    filteredStudentList.forEach((student, index) => {
      const studentRow = [
        index + 1,
        student.controlNumber,
        student.lastNameP,
        student.lastNameM,
        student.firstName,
        ...classDays.map(() => ""), // SIEMPRE EN BLANCO
      ];
      tableRows.push(studentRow);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: "center",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", cellWidth: 18 },
        2: { halign: "left", cellWidth: 22 },
        3: { halign: "left", cellWidth: 22 },
        4: { halign: "left", cellWidth: "auto" },
      },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.text(
          "Página " + doc.internal.getNumberOfPages(),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(
      `Asistencia_${selectedSchoolName.replace(
        /\s+/g,
        "_"
      )}_${courseName.replace(/\s+/g, "_")}_${monthName}_${selectedYear}.pdf`
    );
  };

  // --- NUEVO: Handler para PDF lista completa ---
  const handleGenerateFullListPdf = async () => {
    if (!currentCourseDetails || studentList.length === 0) {
      alert(
        "Por favor, seleccione una escuela y asegúrese de que haya datos de curso y alumnos cargados."
      );
      return;
    }
    const doc = new jsPDF();
    const selectedSchoolObject = schoolsList.find(
      (s) => s.id === selectedSchool
    );
    const PIENSA_AJEDREZ_ID = "school-1";
    const piensaAjedrezSchoolData = schoolsList.find(
      (s) => s.id === PIENSA_AJEDREZ_ID
    );
    const urlLogoPiensaAjedrez =
      piensaAjedrezSchoolData?.URLLogo ||
      "/logos/default_piensa_ajedrez_logo.png";
    const urlLogoEscuelaActual = selectedSchoolObject?.URLLogo;

    // Cargar logos y mantener aspecto
    const loadImage = (url) =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    const logoEscuelaImg = urlLogoEscuelaActual
      ? await loadImage(urlLogoEscuelaActual)
      : null;
    const logoPiensaImg = await loadImage(urlLogoPiensaAjedrez);
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;
    // --- Logos ---
    const maxLogoWidth = 35,
      maxLogoHeight = 25;
    if (logoEscuelaImg) {
      const { width, height } = getLogoDimensions(
        logoEscuelaImg,
        maxLogoWidth,
        maxLogoHeight
      );
      doc.addImage(logoEscuelaImg, "PNG", pageMargin, currentY, width, height);
    }
    if (logoPiensaImg) {
      const { width, height } = getLogoDimensions(
        logoPiensaImg,
        maxLogoWidth,
        maxLogoHeight
      );
      doc.addImage(
        logoPiensaImg,
        "PNG",
        pageWidth - width - pageMargin,
        currentY,
        width,
        height
      );
    }
    currentY += maxLogoHeight + 2;
    // --- Títulos ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ALUMNOS INSCRITOS", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Cursos de Ajedrez ${selectedYear}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 7;
    const monthName =
      getMonths().find((m) => m.value === selectedMonth)?.label || "";
    doc.text(`Mes - ${monthName}`, pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 10;
    // --- Tabla ---
    const tableColumn = [
      "No.",
      "No. Control",
      "Apellido Paterno",
      "Apellido Materno",
      "Nombre(s)",
    ];
    const tableRows = [];
    studentList.forEach((student, index) => {
      tableRows.push([
        index + 1,
        student.controlNumber,
        student.lastNameP,
        student.lastNameM,
        student.firstName,
      ]);
    });
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
        halign: "center",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 9,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 28 },
        2: { halign: "left", cellWidth: 32 },
        3: { halign: "left", cellWidth: 32 },
        4: { halign: "left", cellWidth: "auto" },
      },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.text(
          "Página " + doc.internal.getNumberOfPages(),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });
    // --- Total de alumnos ---
    const totalAlumnos = studentList.length;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total de alumnos: ${totalAlumnos}`,
      pageWidth - pageMargin,
      doc.internal.pageSize.height - 20,
      { align: "right" }
    );
    doc.save(
      `ListaCompleta_${
        selectedSchoolObject?.name?.replace(/\s+/g, "_") || ""
      }_${monthName}_${selectedYear}.pdf`
    );
  };

  // --- Render Logic ---
  const availableYears = getYears();
  const availableMonths = getMonths();

  const isLoading =
    isLoadingSchools || isLoadingCourseData || isLoadingAttendance;
  const generalLoadingMessage = isLoadingSchools
    ? "Cargando escuelas..."
    : isLoadingCourseData || isLoadingAttendance
    ? "Cargando datos..."
    : null;

  console.log(
    "uniqueGrados:",
    uniqueGrados,
    studentList.map((s) => s.grado)
  );

  return (
    // Using React.Fragment as the outermost container, assuming global styles or AppLayout handles page padding
    <>
      <Row
        type="horizontal"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "3.2rem",
        }}
      >
        <Heading as="h1">Asistencias</Heading>
        {/* Placeholder for any actions on the right of the title, if needed */}
      </Row>

      <Row
        type="horizontal"
        style={{ gap: "2.4rem", alignItems: "flex-start" }}
      >
        {" "}
        {/* Main two-column layout */}
        <LeftPanelContent>
          <Heading as="h2">Panel de Control</Heading>
          <SelectWrapper>
            <label htmlFor="school-select">Escuela:</label>
            <select
              id="school-select"
              value={selectedSchool}
              onChange={handleSchoolChange}
              disabled={isLoadingSchools || schoolsList.length === 0}
            >
              <option value="">
                {isLoadingSchools
                  ? "Cargando escuelas..."
                  : "Seleccione una escuela"}
              </option>
              {schoolsList.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </SelectWrapper>

          <SelectWrapper>
            <label htmlFor="month-select">Mes:</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={handleMonthChange}
              disabled={isLoading || !selectedSchool || !currentCourseDetails}
            >
              {availableMonths.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </SelectWrapper>

          <SelectWrapper>
            <label htmlFor="year-select">Año:</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={handleYearChange}
              disabled={isLoading || !selectedSchool || !currentCourseDetails}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </SelectWrapper>

          {/* Filtros dinámicos */}
          {uniqueProfesores.length > 0 && (
            <SelectWrapper>
              <label>Profesor:</label>
              {uniqueProfesores.map((prof) => (
                <FilterCheckboxLabel key={prof}>
                  <input
                    type="checkbox"
                    checked={selectedProfesores.includes(prof)}
                    onChange={() => handleFilterChange("profesor", prof)}
                    tabIndex={0}
                    aria-label={`Filtrar por profesor ${prof}`}
                  />
                  {prof}
                </FilterCheckboxLabel>
              ))}
            </SelectWrapper>
          )}
          {uniqueRangos.length > 0 && (
            <SelectWrapper>
              <label>Rango:</label>
              {uniqueRangos.map((rango) => (
                <FilterCheckboxLabel key={rango}>
                  <input
                    type="checkbox"
                    checked={selectedRangos.includes(rango)}
                    onChange={() => handleFilterChange("rango", rango)}
                    tabIndex={0}
                    aria-label={`Filtrar por rango ${rango}`}
                  />
                  {rango}
                </FilterCheckboxLabel>
              ))}
            </SelectWrapper>
          )}
          {uniqueGrados.length > 0 && (
            <SelectWrapper>
              <label>Grado:</label>
              {uniqueGrados.map((grado) => (
                <FilterCheckboxLabel key={grado}>
                  <input
                    type="checkbox"
                    checked={selectedGrados.includes(grado)}
                    onChange={() => handleFilterChange("grado", grado)}
                    tabIndex={0}
                    aria-label={`Filtrar por grado ${grado}`}
                  />
                  {grado}
                </FilterCheckboxLabel>
              ))}
            </SelectWrapper>
          )}
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          {generalLoadingMessage && !errorMessage && (
            <InfoMessage>{generalLoadingMessage}</InfoMessage>
          )}
        </LeftPanelContent>
        <RightPanelContent>
          <Heading as="h2">
            Registro de Asistencia -{" "}
            {currentCourseDetails
              ? currentCourseDetails.name
              : selectedSchool
              ? isLoadingCourseData
                ? "Cargando curso..."
                : ""
              : ""}
          </Heading>

          {selectedSchool && currentCourseDetails && !isLoading && (
            <>
              <GlobalActionsRow
                type="horizontal"
                style={{ justifyContent: "flex-start" }}
              >
                {" "}
                {/*Ensure this is horizontal and buttons are gapped*/}
                <Button
                  variation="primary"
                  size="medium"
                  onClick={() => handleMarkEntireTable(true)}
                  disabled={
                    filteredStudentList.length === 0 ||
                    classDays.length === 0 ||
                    isSaving
                  }
                >
                  Marcar Todos Presentes
                </Button>
                <Button
                  variation="secondary"
                  size="medium"
                  onClick={() => handleMarkEntireTable(false)}
                  disabled={
                    filteredStudentList.length === 0 ||
                    classDays.length === 0 ||
                    isSaving
                  }
                >
                  Marcar Todos Ausentes
                </Button>
              </GlobalActionsRow>

              <TableContainer>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>No. Control</th>
                      <th>Apellido Paterno</th>
                      <th>Apellido Materno</th>
                      <th>Nombre(s)</th>
                      {classDays.map((day) => (
                        <th key={format(day, "yyyy-MM-dd")}>
                          <span className="date-header-content">
                            {format(day, "EEE dd")}
                          </span>
                          <HeaderButtonContainer>
                            <HeaderButton
                              onClick={() => handleMarkAllForDay(day, true)}
                              title={`Marcar todos presentes para ${format(
                                day,
                                "dd/MM"
                              )}`}
                              disabled={
                                filteredStudentList.length === 0 || isSaving
                              }
                            >
                              ✓
                            </HeaderButton>
                            <HeaderButton
                              onClick={() => handleMarkAllForDay(day, false)}
                              title={`Marcar todos ausentes para ${format(
                                day,
                                "dd/MM"
                              )}`}
                              disabled={
                                filteredStudentList.length === 0 || isSaving
                              }
                            >
                              ✕
                            </HeaderButton>
                          </HeaderButtonContainer>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentList.length > 0 && classDays.length > 0 ? (
                      filteredStudentList.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.controlNumber}</td>
                          <td>{student.lastNameP}</td>
                          <td>{student.lastNameM}</td>
                          <td>{student.firstName}</td>
                          {classDays.map((day) => {
                            const dateString = format(day, "yyyy-MM-dd");
                            const isChecked =
                              attendanceRecords[student.id]?.[dateString] ||
                              false;
                            return (
                              <td key={dateString}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      student.id,
                                      dateString,
                                      e.target.checked
                                    )
                                  }
                                  aria-label={`Asistencia de ${
                                    student.firstName
                                  } ${student.lastNameP} el ${format(
                                    day,
                                    "dd/MM/yyyy"
                                  )}`}
                                  disabled={isSaving}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5 + (classDays?.length || 0)}>
                          {isLoadingCourseData || isLoadingAttendance
                            ? "Cargando alumnos y asistencia..."
                            : filteredStudentList.length === 0 &&
                              currentCourseDetails
                            ? "No hay alumnos inscritos en este curso."
                            : !currentCourseDetails &&
                              selectedSchool &&
                              !errorMessage
                            ? "Procesando datos del curso..."
                            : errorMessage
                            ? "Error al cargar datos. Verifique el panel de control."
                            : "Seleccione una escuela para ver la asistencia."}{" "}
                          {/* Simpler message if no school selected */}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </StyledTable>
              </TableContainer>

              <ButtonsContainer
                type="horizontal"
                style={{ justifyContent: "flex-start" }}
              >
                <Button
                  variation="primary"
                  size="medium"
                  onClick={handleSaveChanges}
                  disabled={
                    !hasUnsavedChanges ||
                    isSaving ||
                    filteredStudentList.length === 0
                  }
                >
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  variation="secondary"
                  size="medium"
                  onClick={handleGeneratePdf}
                  disabled={
                    isSaving ||
                    filteredStudentList.length === 0 ||
                    !currentCourseDetails
                  }
                >
                  Generar PDF lista asistencia
                </Button>
                <Button
                  variation="secondary"
                  size="medium"
                  onClick={handleGenerateFullListPdf}
                  disabled={
                    isSaving ||
                    studentList.length === 0 ||
                    !currentCourseDetails
                  }
                >
                  Generar PDF lista completa
                </Button>
              </ButtonsContainer>
              {saveStatus && (
                <SaveStatusMessage status={saveStatus}>
                  {saveStatus === "saving" && "Guardando cambios..."}
                  {saveStatus === "success" &&
                    "¡Asistencia guardada exitosamente!"}
                  {saveStatus === "error" &&
                    (errorMessage || "Error al guardar. Intente de nuevo.")}
                </SaveStatusMessage>
              )}
              {errorMessage && saveStatus !== "error" && (
                <ErrorMessage>{errorMessage}</ErrorMessage>
              )}
            </>
          )}

          {!selectedSchool && !isLoadingSchools && (
            <InfoMessage>
              Por favor, seleccione una escuela para comenzar.
            </InfoMessage>
          )}
          {selectedSchool &&
            !currentCourseDetails &&
            !isLoadingCourseData &&
            !errorMessage && (
              <InfoMessage>
                {/* Clearer message if school is selected but no course data yet */}
                Seleccione mes y año para cargar los datos del curso, o no hay
                cursos para esta escuela.
              </InfoMessage>
            )}
        </RightPanelContent>
      </Row>
    </>
  );
};

export default Attendance;

// TODO: Consider adding a theme provider if not already present at app root for styled-components theme usage.
// TODO: Implement proper internationalization for dates and messages if needed.
// TODO: Enhance error handling and user feedback for API calls (e.g., more specific messages).
// TODO: Add a Course selector if a school can have multiple active courses for attendance.
// TODO: PDF generation could be further customized with school logos, etc.
// TODO: Consider pagination or virtualization for very large student lists.
// TODO: Styling for loading states within the table itself (e.g., skeleton loaders).
// TODO: Test persistence of mockAttendanceRecordsDB across saves (it should persist in the mock service).
