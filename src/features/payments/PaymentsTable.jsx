import { useEffect, useState, useMemo, useCallback, useContext } from "react";
import styled from "styled-components";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import supabase from "../../services/supabase";
import { toast } from "react-hot-toast";
import PaymentStatusButton from "./PaymentStatusButton";
import Menus from "../../ui/Menus";
import {
  HiPencil,
  HiTrash,
  HiEye,
  HiArrowDownCircle,
  HiArrowUpCircle,
} from "react-icons/hi2";
import Modal, { ModalContext } from "../../ui/Modal";
import CreateStudentForm from "../students/CreateStudentForm";
import StudentKardexView from "../students/StudentKardexView";
import ConfirmDelete from "../../ui/ConfirmDelete";
import {
  useStudentsBySchool,
  usePaymentsByStudentsAndCourse,
  useAllPaymentsByCourse,
} from "./useStudentsPayments";
import PaymentReceiptModal from "./PaymentReceiptModal";
import NewPaymentModal from "./NewPaymentModal";
import {
  deactivateStudent,
  reactivateStudent,
} from "../../services/apiStudents";
import { useMutation } from "@tanstack/react-query";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSendMassReminders } from "../emails/useSendEmail";

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
`;

const TableContainer = styled.div`
  max-height: 70vh; /* Altura máxima del contenedor de la tabla */
  overflow-y: auto; /* Scroll vertical interno */
  border-radius: var(--border-radius-md);
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0;
`;

const StickyThead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-grey-100);
`;

const Th = styled.th`
  background: var(--color-grey-100);
  font-weight: 700;
  padding: 0.8rem 0.6rem;
  text-align: center;
  border-bottom: 2px solid var(--color-grey-200);
  cursor: pointer;
  user-select: none;
`;

const Td = styled.td`
  padding: 0.6rem;
  text-align: center;
  border-bottom: 1px solid var(--color-grey-100);
  vertical-align: middle;
  & > div,
  & > button {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
  }
`;

const TopActions = styled.div`
  display: flex;
  gap: 1.2rem;
`;

const DashboardRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  flex-wrap: nowrap;
`;

const DashboardCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1rem 1.2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const CardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  color: #22223b;
  margin-bottom: 0.2rem;
  line-height: 1;
`;

const CardLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 600;
  line-height: 1.2;
`;

const CardSubValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #6c757d;
  margin-top: 0.1rem;
  line-height: 1;
`;

const CardIcon = styled.div`
  font-size: 1.6rem;
  margin-bottom: 0.2rem;
`;

// Lista de meses válidos según la base de datos
const MESES_DB = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Devuelve los nombres completos de los meses entre dos fechas
function getMonthsBetween(start, end) {
  const months = [];
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const nombreMes = MESES_DB[current.getMonth()];
    if (nombreMes) months.push(nombreMes);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

function PaymentsTable({ course, schoolId }) {
  // Query para obtener detalles completos del curso (incluyendo campos de bajas/altas)
  const { data: fullCourseData } = useQuery({
    queryKey: ["course-full-details", course?.IDCurso],
    queryFn: async () => {
      if (!course?.IDCurso) return null;
      const { data, error } = await supabase
        .from("CURSO")
        .select(
          "*, BajasEnero, BajasFebrero, BajasMarzo, BajasAbril, BajasMayo, BajasJunio, BajasJulio, BajasAgosto, BajasSeptiembre, BajasOctubre, BajasNoviembre, BajasDiciembre, AltasEnero, AltasFebrero, AltasMarzo, AltasAbril, AltasMayo, AltasJunio, AltasJulio, AltasAgosto, AltasSeptiembre, AltasOctubre, AltasNoviembre, AltasDiciembre"
        )
        .eq("IDCurso", course.IDCurso)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!course?.IDCurso,
  });

  // Usar React Query para estudiantes y pagos
  const {
    data: students = [],
    isLoading: loading,
    error: studentsError,
  } = useStudentsBySchool(schoolId);

  const numeroControls = useMemo(
    () => students.map((s) => s.NumeroControl),
    [students]
  );

  const {
    data: payments = [],
    isLoading: loadingPayments,
    error: paymentsError,
  } = usePaymentsByStudentsAndCourse(numeroControls, course?.IDCurso);

  // Hook adicional para obtener TODOS los pagos del curso (incluyendo de estudiantes dados de baja DURANTE el curso)
  const { data: allCoursePayments = [] } = useAllPaymentsByCourse(
    course?.IDCurso,
    schoolId
  );

  const [sortBy, setSortBy] = useState("deuda");
  const [sortDirection, setSortDirection] = useState("desc");

  // Estado para ordenamiento por meses
  const [monthSort, setMonthSort] = useState({});
  // monthSort estructura: { "Sep": "PA", "Oct": "NP", "Nov": "AB", etc. }

  // Estado para modales de acciones
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToKardex, setStudentToKardex] = useState(null);
  const { open: openModal } = useContext(ModalContext);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedAbono, setSelectedAbono] = useState(null);

  // QueryClient para invalidar queries
  const queryClient = useQueryClient();

  const [selectedNoAplica, setSelectedNoAplica] = useState(null);
  const [nuevoPagoInfo, setNuevoPagoInfo] = useState(null);
  const [editPayment, setEditPayment] = useState(null);

  // Mutaciones para desactivar/reactivar estudiantes
  const { isLoading: isDeactivating, mutate: mutateDeactivate } = useMutation({
    mutationFn: deactivateStudent,
    onSuccess: () => {
      toast.success(`Estudiante desactivado`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({
        queryKey: ["studentsBySchool", schoolId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses", schoolId] });
      queryClient.invalidateQueries({
        queryKey: ["course-full-details", course?.IDCurso],
      });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentAndMonth"],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentsAndCourse"],
      });
      queryClient.invalidateQueries({ queryKey: ["allPaymentsByCourse"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { isLoading: isReactivating, mutate: mutateReactivate } = useMutation({
    mutationFn: reactivateStudent,
    onSuccess: () => {
      toast.success(`Estudiante reactivado`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({
        queryKey: ["studentsBySchool", schoolId],
      });
      queryClient.invalidateQueries({ queryKey: ["courses", schoolId] });
      queryClient.invalidateQueries({
        queryKey: ["course-full-details", course?.IDCurso],
      });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentAndMonth"],
      });
      queryClient.invalidateQueries({
        queryKey: ["paymentsByStudentsAndCourse"],
      });
      queryClient.invalidateQueries({ queryKey: ["allPaymentsByCourse"] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Panel de datos relevantes
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [showMesSelect, setShowMesSelect] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  // Estados del modal eliminados - ahora usamos window.confirm directamente

  // Hook para envío masivo de recordatorios
  const { sendReminders, isSendingReminders } = useSendMassReminders();

  // Lista de escuelas para obtener logos
  const [schoolsList, setSchoolsList] = useState([]);
  useEffect(() => {
    async function fetchSchools() {
      console.log("🔄 EJECUTANDO CONSULTA A SUPABASE...");

      // Probar diferentes variaciones del nombre de columna
      let data, error;

      // SOLUCIÓN: Seleccionar SOLO las columnas que SÍ existen
      console.log(
        "🧪 Seleccionando columnas que SÍ existen: NombreEscuela, URLLogo"
      );
      const result = await supabase
        .from("ESCUELA")
        .select("NombreEscuela, URLLogo");

      console.log("📊 Resultado con columnas específicas:", result);
      data = result.data;
      error = result.error;

      // Diagnosticar las propiedades de cada escuela
      if (data && data.length > 0) {
        console.log("🔍 DIAGNÓSTICO COMPLETO DE PROPIEDADES:");
        data.forEach((school, index) => {
          console.log(`🏫 Escuela ${index + 1}:`, school);
          console.log(`📋 NombreEscuela: "${school.NombreEscuela}"`);
          console.log(`📋 URLLogo: "${school.URLLogo}"`);
        });
      }

      console.log("📊 RESULTADO DE CONSULTA SUPABASE:");
      console.log("📊 Error:", error);
      console.log("📊 Data cruda:", data);

      if (error) {
        console.error("❌ Error en consulta Supabase:", error);
      }

      if (data) {
        console.log("✅ Datos recibidos de Supabase:", data.length, "escuelas");
        data.forEach((school, index) => {
          console.log(`📋 Escuela ${index + 1} RAW:`, {
            Nombre: school.Nombre,
            URLLogo: school.URLLogo,
            URLLogo_type: typeof school.URLLogo,
            IDEscuela: school.IDEscuela,
            "Todas las propiedades": Object.keys(school),
          });
        });
        setSchoolsList(data);
      }
    }
    fetchSchools();
  }, []);

  const handleGenerarPdf = useCallback(async () => {
    const doc = new jsPDF("p", "mm", "a4"); // Formato vertical A4

    // --- DEBUGGING COMPLETO DE LOGOS ---
    console.log("🔍 DEBUGGING LOGOS:");
    console.log("📋 Escuelas disponibles:", schoolsList);
    console.log("📋 Total escuelas:", schoolsList.length);

    // Mostrar TODAS las escuelas y sus URLs
    console.log("📚 LISTA COMPLETA DE ESCUELAS EN BD:");
    schoolsList.forEach((school, index) => {
      console.log(`🏫 Escuela ${index + 1}:`, {
        Nombre: school.Nombre,
        URLLogo: school.URLLogo,
        IDEscuela: school.IDEscuela,
        "Nombre length": school.Nombre?.length,
        "Tiene URLLogo": !!school.URLLogo,
      });
    });

    // Mostrar información del curso actual
    console.log("📋 INFORMACIÓN DEL CURSO ACTUAL:");
    console.log("🎯 course?.NombreEscuela:", course?.NombreEscuela);
    console.log("🎯 students[0]?.NombreEscuela:", students[0]?.NombreEscuela);
    console.log("🎯 schoolId:", schoolId);

    // Logo academia: buscar por nombre "Academia" o "Piensa Ajedrez"
    console.log("🔍 BUSCANDO ACADEMIA:");
    console.log(
      "🔍 Lista de escuelas para buscar:",
      schoolsList.map((s) => s.NombreEscuela)
    );

    const escuelaAcademia = schoolsList.find(
      (s) =>
        s.NombreEscuela?.toLowerCase().includes("academia") ||
        s.NombreEscuela?.toLowerCase().includes("piensa ajedrez")
    );
    console.log(
      "🎯 Academia encontrada:",
      escuelaAcademia?.NombreEscuela || "NO ENCONTRADA"
    );
    if (escuelaAcademia) {
      console.log("✅ URL Logo Academia encontrada:", escuelaAcademia.URLLogo);
    }

    // Logo escuela: buscar por el nombre EXACTO de la escuela del curso
    const nombreEscuelaBuscada =
      course?.NombreEscuela || students[0]?.NombreEscuela;
    console.log("🔍 BUSCANDO ESCUELA DEL CURSO:");
    console.log("🎯 Nombre a buscar:", `"${nombreEscuelaBuscada}"`);

    let escuelaCurso = null;
    if (nombreEscuelaBuscada) {
      // Buscar coincidencia EXACTA primero
      escuelaCurso = schoolsList.find(
        (s) => s.NombreEscuela === nombreEscuelaBuscada
      );
      console.log(
        "🧪 Búsqueda exacta:",
        escuelaCurso?.NombreEscuela || "NO ENCONTRADA"
      );

      if (!escuelaCurso) {
        console.log(
          "❌ No se encontró coincidencia exacta, probando sin distinción de mayúsculas..."
        );
        // Si no hay coincidencia exacta, buscar sin case sensitivity
        escuelaCurso = schoolsList.find(
          (s) =>
            s.NombreEscuela?.toLowerCase() ===
            nombreEscuelaBuscada?.toLowerCase()
        );
        console.log(
          "🧪 Búsqueda sin case:",
          escuelaCurso?.NombreEscuela || "NO ENCONTRADA"
        );
      }

      if (!escuelaCurso) {
        console.log(
          "❌ No se encontró coincidencia exacta ni por case, probando coincidencia parcial..."
        );
        // Si aún no hay match, buscar coincidencia parcial
        escuelaCurso = schoolsList.find((s) =>
          s.NombreEscuela?.toLowerCase().includes(
            nombreEscuelaBuscada?.toLowerCase()
          )
        );
        console.log(
          "🧪 Búsqueda parcial:",
          escuelaCurso?.NombreEscuela || "NO ENCONTRADA"
        );
      }

      // ÚLTIMO INTENTO: mostrar todas las opciones para debug
      if (!escuelaCurso) {
        console.log("❌ ÚLTIMO INTENTO - Comparando manualmente:");
        schoolsList.forEach((school, index) => {
          console.log(
            `🔍 Escuela ${index + 1}: "${
              school.NombreEscuela
            }" vs "${nombreEscuelaBuscada}"`
          );
          console.log(
            `🔍 ¿Coincide exacto?`,
            school.NombreEscuela === nombreEscuelaBuscada
          );
          console.log(
            `🔍 ¿Coincide lowercase?`,
            school.NombreEscuela?.toLowerCase() ===
              nombreEscuelaBuscada?.toLowerCase()
          );
          console.log(
            `🔍 ¿Contiene?`,
            school.NombreEscuela?.toLowerCase().includes(
              nombreEscuelaBuscada?.toLowerCase()
            )
          );
        });
      }
    }

    console.log(
      "🎯 Escuela del curso encontrada:",
      escuelaCurso?.NombreEscuela || "NO ENCONTRADA"
    );
    if (escuelaCurso) {
      console.log("✅ URL Logo Escuela encontrada:", escuelaCurso.URLLogo);
    }

    console.log("🎓 Academia encontrada:", escuelaAcademia);
    console.log("🏫 Escuela del curso encontrada:", escuelaCurso);

    // URLs de los logos desde la base de datos
    const urlLogoAcademia = escuelaAcademia?.URLLogo;
    const urlLogoEscuela = escuelaCurso?.URLLogo;

    console.log("🔗 URL Logo Academia:", urlLogoAcademia);
    console.log("🔗 URL Logo Escuela:", urlLogoEscuela);

    // PROBAR CARGA DIRECTA DE URLS
    if (urlLogoAcademia) {
      console.log("🧪 PROBANDO carga directa de logo academia...");
      try {
        const testResponse = await fetch(urlLogoAcademia);
        console.log(
          "✅ Respuesta fetch academia:",
          testResponse.status,
          testResponse.ok
        );
      } catch (error) {
        console.log("❌ Error fetch academia:", error);
      }
    }

    if (urlLogoEscuela) {
      console.log("🧪 PROBANDO carga directa de logo escuela...");
      try {
        const testResponse = await fetch(urlLogoEscuela);
        console.log(
          "✅ Respuesta fetch escuela:",
          testResponse.status,
          testResponse.ok
        );
      } catch (error) {
        console.log("❌ Error fetch escuela:", error);
      }
    }

    // --- Utilidad que SÍ FUNCIONA (copiada de Attendance.jsx) ---
    async function imageToDataUrl(url) {
      if (!url) {
        console.log("❌ No hay URL para la imagen");
        return null;
      }

      console.log(`🔄 Intentando cargar imagen: ${url}`);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.log(
            `❌ Fetch directo falló para ${url}. Probando ruta pública...`
          );
          const publicUrl =
            window.location.origin + (url.startsWith("/") ? url : "/" + url);
          console.log(`🔄 URL pública de fallback: ${publicUrl}`);

          const fallbackResponse = await fetch(publicUrl);
          if (!fallbackResponse.ok) {
            console.error(
              `❌ Falló fetch desde ${url} (status: ${response.status}) y ${publicUrl} (status: ${fallbackResponse.status}).`
            );
            return null;
          }

          const blob = await fallbackResponse.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              console.log(
                `✅ Imagen convertida exitosamente desde ${publicUrl}`
              );
              resolve(reader.result);
            };
            reader.onerror = (error) => {
              console.error(`❌ Error FileReader para ${publicUrl}:`, error);
              reject(error);
            };
            reader.readAsDataURL(blob);
          });
        }

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            console.log(`✅ Imagen convertida exitosamente desde ${url}`);
            resolve(reader.result);
          };
          reader.onerror = (error) => {
            console.error(`❌ Error FileReader para ${url}:`, error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("❌ Error general cargando imagen:", error, "URL:", url);
        return null;
      }
    }

    // Función para calcular dimensiones manteniendo proporción
    function calculateProportionalSize(
      originalWidth,
      originalHeight,
      maxWidth,
      maxHeight
    ) {
      const aspectRatio = originalWidth / originalHeight;

      let width = maxWidth;
      let height = maxWidth / aspectRatio;

      // Si la altura calculada excede el máximo, ajustar por altura
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }

      return { width, height };
    }

    // Función mejorada para obtener dimensiones de imagen
    async function getImageDimensions(dataUrl) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          resolve({ width: 100, height: 100 }); // Fallback por defecto
        };
        img.src = dataUrl;
      });
    }

    // Cargar logos CON DEBUGGING EXTREMO
    console.log("🎯 INTENTANDO CARGAR LOGOS:");
    console.log("🎯 URL Academia:", urlLogoAcademia);
    console.log("🎯 URL Escuela:", urlLogoEscuela);

    let logoAcademiaDataUrl = null;
    let logoEscuelaDataUrl = null;

    if (urlLogoAcademia) {
      console.log("🔥 CARGANDO LOGO ACADEMIA...");
      logoAcademiaDataUrl = await imageToDataUrl(urlLogoAcademia);
      console.log(
        "🔥 Resultado logo academia:",
        logoAcademiaDataUrl ? "✅ CARGADO" : "❌ FALLÓ"
      );
    } else {
      console.log("❌ No hay URL de logo academia");
    }

    if (urlLogoEscuela) {
      console.log("🔥 CARGANDO LOGO ESCUELA...");
      logoEscuelaDataUrl = await imageToDataUrl(urlLogoEscuela);
      console.log(
        "🔥 Resultado logo escuela:",
        logoEscuelaDataUrl ? "✅ CARGADO" : "❌ FALLÓ"
      );
    } else {
      console.log("❌ No hay URL de logo escuela");
    }

    // --- Configuración de página optimizada ---
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageMargin = 10; // Reducido para más espacio
    const maxLogoWidth = 25; // Ancho máximo para logos
    const maxLogoHeight = 15; // Alto máximo para logos
    let currentY = 10;

    // --- Encabezado con logos más compacto ---
    console.log("🖼️ AGREGANDO LOGOS AL PDF:");

    // Logo escuela (izquierda)
    console.log("🖼️ Procesando logo escuela...");
    console.log("🖼️ logoEscuelaDataUrl existe:", !!logoEscuelaDataUrl);
    console.log(
      "🖼️ logoEscuelaDataUrl length:",
      logoEscuelaDataUrl?.length || 0
    );

    if (logoEscuelaDataUrl) {
      try {
        console.log("✅ AGREGANDO logo de escuela al PDF con proporciones");

        // Obtener dimensiones originales de la imagen
        const imageDimensions = await getImageDimensions(logoEscuelaDataUrl);
        console.log("📐 Dimensiones originales logo escuela:", imageDimensions);

        // Calcular dimensiones proporcionales
        const { width: logoWidth, height: logoHeight } =
          calculateProportionalSize(
            imageDimensions.width,
            imageDimensions.height,
            maxLogoWidth,
            maxLogoHeight
          );

        console.log(
          `📏 Dimensiones finales logo escuela: ${logoWidth}x${logoHeight}`
        );

        doc.addImage(
          logoEscuelaDataUrl,
          "PNG",
          pageMargin,
          currentY,
          logoWidth,
          logoHeight
        );
        console.log("✅ Logo escuela agregado exitosamente con proporciones!");
      } catch (error) {
        console.error("❌ Error agregando logo escuela:", error);
        doc.setFontSize(6);
        doc.text(
          `[Logo ${escuelaCurso?.NombreEscuela || "Escuela"}]`,
          pageMargin,
          currentY + maxLogoHeight / 2
        );
      }
    } else {
      console.log("❌ No hay logoEscuelaDataUrl, usando texto placeholder");
      doc.setFontSize(6);
      doc.text(
        `[Logo ${escuelaCurso?.NombreEscuela || "Escuela"}]`,
        pageMargin,
        currentY + maxLogoHeight / 2
      );
    }

    // Logo academia (derecha)
    console.log("🖼️ Procesando logo academia...");
    console.log("🖼️ logoAcademiaDataUrl existe:", !!logoAcademiaDataUrl);
    console.log(
      "🖼️ logoAcademiaDataUrl length:",
      logoAcademiaDataUrl?.length || 0
    );

    if (logoAcademiaDataUrl) {
      try {
        console.log("✅ AGREGANDO logo de academia al PDF con proporciones");

        // Obtener dimensiones originales de la imagen
        const imageDimensions = await getImageDimensions(logoAcademiaDataUrl);
        console.log(
          "📐 Dimensiones originales logo academia:",
          imageDimensions
        );

        // Calcular dimensiones proporcionales
        const { width: logoAcademiaWidth, height: logoAcademiaHeight } =
          calculateProportionalSize(
            imageDimensions.width,
            imageDimensions.height,
            maxLogoWidth,
            maxLogoHeight
          );

        console.log(
          `📏 Dimensiones finales logo academia: ${logoAcademiaWidth}x${logoAcademiaHeight}`
        );

        doc.addImage(
          logoAcademiaDataUrl,
          "PNG",
          pageWidth - logoAcademiaWidth - pageMargin,
          currentY,
          logoAcademiaWidth,
          logoAcademiaHeight
        );
        console.log("✅ Logo academia agregado exitosamente con proporciones!");
      } catch (error) {
        console.error("❌ Error agregando logo academia:", error);
        doc.setFontSize(6);
        doc.text(
          `[Logo ${escuelaAcademia?.NombreEscuela || "Academia"}]`,
          pageWidth - maxLogoWidth - pageMargin,
          currentY + maxLogoHeight / 2
        );
      }
    } else {
      console.log("❌ No hay logoAcademiaDataUrl, usando texto placeholder");
      doc.setFontSize(6);
      doc.text(
        `[Logo ${escuelaAcademia?.NombreEscuela || "Academia"}]`,
        pageWidth - maxLogoWidth - pageMargin,
        currentY + maxLogoHeight / 2
      );
    }

    currentY += maxLogoHeight + 5;

    // --- Título principal más compacto ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE PAGOS", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;

    // --- Información del curso más compacta ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `ESCUELA: ${
        escuelaCurso?.Nombre || students[0]?.NombreEscuela || schoolId || "-"
      }`,
      pageMargin,
      currentY
    );
    currentY += 4;
    doc.text(`CURSO: ${course?.IDCurso || "-"}`, pageMargin, currentY);
    currentY += 4;
    doc.text(
      `CICLO: ${course?.InicioCurso?.slice(0, 4) || ""} - ${
        course?.FinCurso?.slice(0, 4) || ""
      }`,
      pageMargin,
      currentY
    );
    currentY += 4;
    doc.text(
      `FECHA: ${new Date().toLocaleDateString("es-ES")}`,
      pageMargin,
      currentY
    );
    currentY += 8;

    // --- Obtener lista de meses del curso ---
    const months = course
      ? getMonthsBetween(course.InicioCurso, course.FinCurso)
      : [];

    // --- Calcular ancho disponible y columnas ---
    const availableWidth = pageWidth - pageMargin * 2;
    const totalColumns = 6 + months.length; // 6 columnas fijas + meses

    // Calcular ancho dinámico para que todo quepa
    const maxCellWidth = availableWidth / totalColumns;

    // Anchos ajustados según importancia (nombres más grandes)
    const columnWidths = {
      0: Math.min(8, maxCellWidth), // No.
      1: Math.min(18, maxCellWidth), // No. Control
      2: Math.min(28, maxCellWidth), // Apellido Paterno (más grande)
      3: Math.min(28, maxCellWidth), // Apellido Materno (más grande)
      4: Math.min(35, maxCellWidth), // Nombre(s) (más grande)
      5: Math.min(12, maxCellWidth), // Inscripción (más pequeño)
    };

    // Ancho para meses (más pequeño para dar espacio a nombres)
    const usedWidth = Object.values(columnWidths).reduce((a, b) => a + b, 0);
    const remainingWidth = availableWidth - usedWidth;
    const monthWidth = Math.max(6, remainingWidth / months.length); // Reducido de 8 a 6

    // --- Crear tabla con inscripción y meses ---
    const tableHeaders = [
      "No.",
      "Control",
      "Ap. Paterno",
      "Ap. Materno",
      "Nombre(s)",
      "Inscr.",
      ...months.map((month) => month.slice(0, 3)), // Abreviar nombres de meses
    ];

    const tableBody = students.map((student, index) => {
      const row = [
        index + 1,
        student.NumeroControl || "",
        student.ApellidoPaterno || "",
        student.ApellidoMaterno || "",
        student.Nombre || "",
        "", // Campo vacío para inscripción
      ];

      // Agregar campos vacíos para cada mes
      months.forEach(() => {
        row.push(""); // Campo vacío para llenar manualmente
      });

      return row;
    });

    // --- Configurar tabla optimizada ---
    autoTable(doc, {
      head: [tableHeaders],
      body: tableBody,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 5, // Fuente muy pequeña para que quepa todo
        cellPadding: 1,
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [66, 165, 245],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 6,
        cellPadding: 1,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: columnWidths[0] },
        1: { halign: "center", cellWidth: columnWidths[1], fontSize: 5 },
        2: { halign: "left", cellWidth: columnWidths[2], fontSize: 6 }, // Nombres más grandes
        3: { halign: "left", cellWidth: columnWidths[3], fontSize: 6 }, // Nombres más grandes
        4: { halign: "left", cellWidth: columnWidths[4], fontSize: 6 }, // Nombres más grandes
        5: { halign: "center", cellWidth: columnWidths[5] },
      },
      // Configurar columnas de meses dinámicamente
      didParseCell: function (data) {
        if (data.column.index >= 6) {
          // Columnas de meses (más pequeñas)
          data.cell.styles.cellWidth = monthWidth;
          data.cell.styles.halign = "center";
          data.cell.styles.fontSize = 4; // Reducido de 5 a 4
        }
      },
      margin: { left: pageMargin, right: pageMargin },
      tableWidth: "wrap",
      showHead: "everyPage",
      // Asegurar que todo quepe en una página
      pageBreak: "avoid",
    });

    // --- Pie de página con instrucciones más compacto ---
    // --- Sin instrucciones (eliminadas por solicitud del usuario) ---

    // --- Guardar el PDF ---
    const fileName = `ListaPagos_${
      escuelaCurso?.Nombre?.replace(/\s+/g, "_") || "Escuela"
    }_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }, [students, course, schoolId, schoolsList]);

  // Manejo de errores
  useEffect(() => {
    if (studentsError) {
      toast.error("Error al cargar estudiantes: " + studentsError.message);
    }
  }, [studentsError]);

  useEffect(() => {
    if (paymentsError) {
      toast.error("Error al cargar pagos: " + paymentsError.message);
    }
  }, [paymentsError]);

  const months = useMemo(
    () => getMonthsBetween(course?.InicioCurso, course?.FinCurso),
    [course]
  );

  // Helper para encontrar el pago correspondiente
  // CRÍTICO: Si existe CUALQUIER pago liquidado, el mes está pagado (verde PA)
  const findPayment = useCallback(
    (numeroControl, mesPagado) => {
      const pagosCandidatos = payments.filter(
        (p) =>
          p.NumeroControl === numeroControl &&
          p.IDCurso === course.IDCurso &&
          p.MesPagado === mesPagado
      );

      if (pagosCandidatos.length === 0) return undefined;
      if (pagosCandidatos.length === 1) return pagosCandidatos[0];

      // Si hay múltiples pagos:
      // SIEMPRE priorizar cualquier pago que esté liquidado
      const liquidado = pagosCandidatos.find((p) => p.Liquidado);
      if (liquidado) return liquidado;

      // Si ninguno está liquidado, devolver cualquiera (el más reciente)
      return pagosCandidatos.sort(
        (a, b) => new Date(b.FechaHora) - new Date(a.FechaHora)
      )[0];
    },
    [payments, course]
  );

  // Calcular deudas por alumno
  const studentsWithDeuda = useMemo(() => {
    return students.map((student) => {
      let deuda = 0;
      // Inscripcion
      const pagoIns = findPayment(student.NumeroControl, "Inscripcion");
      if (!pagoIns || (pagoIns && (!pagoIns.Liquidado || pagoIns.Monto === 0)))
        deuda += !pagoIns || (!pagoIns.Liquidado && pagoIns.Monto > 0) ? 1 : 0;
      // Meses
      months.forEach((m) => {
        const pago = findPayment(student.NumeroControl, m);
        if (!pago || (pago && (!pago.Liquidado || pago.Monto === 0)))
          deuda += !pago || (!pago.Liquidado && pago.Monto > 0) ? 1 : 0;
      });
      return { ...student, deuda };
    });
  }, [students, months, findPayment]);

  // Ordenamiento
  const sortedStudents = useMemo(() => {
    let arr = [...studentsWithDeuda];

    // Verificar si hay ordenamiento por mes activo
    const activeMonthSort = Object.entries(monthSort).find(
      ([, sortType]) => sortType
    );

    if (activeMonthSort) {
      const [sortMonth, sortType] = activeMonthSort;
      arr.sort((a, b) => {
        // Determinar estado de cada pago considerando abonos múltiples
        const getPaymentStatus = (student, month) => {
          const payment = findPayment(student.NumeroControl, month);
          if (!payment) return "NP";
          if (payment.Monto === 0) return "NA";

          // Buscar TODOS los pagos del mes para este estudiante (con y sin abono)
          const allPaymentsForMonth = payments.filter(
            (p) =>
              p.NumeroControl === student.NumeroControl &&
              p.MesPagado === month &&
              p.IDCurso === course?.IDCurso
          );

          // Si hay múltiples pagos, es definitivamente un abono múltiple
          if (allPaymentsForMonth.length > 1) {
            // Verificar si alguno está liquidado
            const hasLiquidated = allPaymentsForMonth.some((p) => p.Liquidado);
            return hasLiquidated ? "AB_LIQUIDADO" : "AB_PENDIENTE";
          }

          // Si hay un solo pago
          if (payment.Liquidado) {
            // Si está liquidado PERO tiene el campo Abono = true, es un abono liquidado
            if (payment.Abono) {
              return "AB_LIQUIDADO";
            }
            return "PA"; // Pago normal liquidado
          }

          // Si no está liquidado, verificar si es abono
          if (payment.Abono) {
            return "AB_PENDIENTE";
          }

          return "NP"; // No pagado normal
        };

        const statusA = getPaymentStatus(a, sortMonth);
        const statusB = getPaymentStatus(b, sortMonth);

        // Lógica especial para abonos (AB)
        if (sortType === "AB") {
          // Determinar si cada estado es un abono
          const isAbonoA =
            statusA === "AB_PENDIENTE" || statusA === "AB_LIQUIDADO";
          const isAbonoB =
            statusB === "AB_PENDIENTE" || statusB === "AB_LIQUIDADO";

          // Primero: cualquier abono vs no-abono
          if (isAbonoA && !isAbonoB) return -1;
          if (isAbonoB && !isAbonoA) return 1;

          // Si ambos son abonos, priorizar pendientes sobre liquidados
          if (isAbonoA && isAbonoB) {
            if (statusA === "AB_PENDIENTE" && statusB === "AB_LIQUIDADO")
              return -1;
            if (statusB === "AB_PENDIENTE" && statusA === "AB_LIQUIDADO")
              return 1;
          }
        } else {
          // Para otros estados (PA, NP, NA), comportamiento normal
          if (statusA === sortType && statusB !== sortType) return -1;
          if (statusB === sortType && statusA !== sortType) return 1;
        }

        // Si ambos tienen el mismo estado, sub-ordenar por apellido paterno ascendente
        return a.ApellidoPaterno.localeCompare(b.ApellidoPaterno);
      });
    } else if (sortBy === "deuda") {
      arr.sort((a, b) =>
        sortDirection === "desc" ? b.deuda - a.deuda : a.deuda - b.deuda
      );
    } else if (sortBy) {
      arr.sort((a, b) => {
        let valA = a[sortBy] || "";
        let valB = b[sortBy] || "";
        valA = typeof valA === "string" ? valA.toLowerCase() : valA;
        valB = typeof valB === "string" ? valB.toLowerCase() : valB;
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [
    studentsWithDeuda,
    sortBy,
    sortDirection,
    monthSort,
    findPayment,
    payments,
    course?.IDCurso,
  ]);

  // Función para manejar el ordenamiento por meses
  function handleMonthSort(month) {
    const currentSort = monthSort[month];
    const sortOrder = ["PA", "NP", "AB", "NA"];
    const currentIndex = sortOrder.indexOf(currentSort);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % sortOrder.length;
    const nextSort = sortOrder[nextIndex];

    // CRÍTICO: Solo un mes puede estar activo a la vez
    setMonthSort({
      [month]: nextSort, // Solo este mes, limpiar todos los demás
    });

    // Limpiar otros ordenamientos
    setSortBy("");
    setSortDirection("");
  }

  // Refrescar datos usando React Query
  function fetchPaymentsRefrescar() {
    // Invalidar queries para refrescar automáticamente
    queryClient.invalidateQueries({ queryKey: ["studentsBySchool", schoolId] });
    queryClient.invalidateQueries({
      queryKey: [
        "paymentsByStudentsAndCourse",
        numeroControls,
        course?.IDCurso,
      ],
    });
    queryClient.invalidateQueries({
      queryKey: ["allPaymentsByCourse", course?.IDCurso, schoolId],
    }); // NUEVO: Invalidar todos los pagos del curso
    queryClient.invalidateQueries({ queryKey: ["students"] }); // También invalidar la lista general de estudiantes
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["paymentsByStudentAndMonth"] });
    queryClient.invalidateQueries({ queryKey: ["lastPayment"] });
  }

  // SOLUCIÓN SIMPLE: Contar estudiantes inactivos que tienen pagos en este curso
  const totalBajas = useMemo(() => {
    if (!allCoursePayments.length || !students.length) return 0;

    // Obtener NumeroControls únicos de todos los pagos del curso
    const numeroControlsConPagos = [
      ...new Set(allCoursePayments.map((p) => p.NumeroControl)),
    ];

    // Obtener NumeroControls de estudiantes activos
    const numeroControlsActivos = students.map((s) => s.NumeroControl);

    // Contar cuántos estudiantes con pagos NO están en la lista de activos
    const estudiantesInactivosConPagos = numeroControlsConPagos.filter(
      (nc) => !numeroControlsActivos.includes(nc)
    );

    return estudiantesInactivosConPagos.length;
  }, [allCoursePayments, students]);

  // Calcular total de altas desde los campos de la tabla CURSO
  const totalAltas = useMemo(() => {
    if (!fullCourseData) return 0;

    const altasFields = [
      "AltasEnero",
      "AltasFebrero",
      "AltasMarzo",
      "AltasAbril",
      "AltasMayo",
      "AltasJunio",
      "AltasJulio",
      "AltasAgosto",
      "AltasSeptiembre",
      "AltasOctubre",
      "AltasNoviembre",
      "AltasDiciembre",
    ];

    return altasFields.reduce((total, field) => {
      return total + (fullCourseData[field] || 0);
    }, 0);
  }, [fullCourseData]);

  // Obtener información de la escuela (mensualidades)
  useEffect(() => {
    async function fetchSchoolInfo() {
      if (!schoolId) return;

      const { data, error } = await supabase
        .from("ESCUELA")
        .select("MensualidadPorAlumno, MensualidadConRecargo, Inscripcion")
        .eq("NombreEscuela", schoolId)
        .single();

      if (error) {
        console.error("Error fetching school info:", error);
        return;
      }

      setSchoolInfo(data);
    }
    fetchSchoolInfo();
  }, [schoolId]);

  // Datos calculados en render
  // Alumnos activos: students.length
  // Total alumnos: totalAlumnosEscuela
  // Total mensualidades: suma de TODOS los pagos del curso (incluyendo de estudiantes dados de baja)
  const { totalMensualidadesNormales, totalRecargos } = useMemo(() => {
    if (!schoolInfo) return { totalMensualidadesNormales: 0, totalRecargos: 0 };

    const mensualidadNormal = schoolInfo.MensualidadPorAlumno || 0;

    let totalMensualidadesNormales = 0;
    let totalRecargos = 0;

    // Filtrar pagos mensuales (no inscripciones) con monto > 0
    const pagosMensuales = allCoursePayments.filter(
      (p) => p.MesPagado !== "Inscripcion" && p.Monto > 0
    );

    // Agrupar pagos por NumeroControl y MesPagado para manejar abonos correctamente
    const pagosPorEstudianteYMes = {};

    pagosMensuales.forEach((pago) => {
      const key = `${pago.NumeroControl}-${pago.MesPagado}`;
      if (!pagosPorEstudianteYMes[key]) {
        pagosPorEstudianteYMes[key] = [];
      }
      pagosPorEstudianteYMes[key].push(pago);
    });

    // Procesar cada grupo de pagos (por estudiante y mes)
    Object.values(pagosPorEstudianteYMes).forEach((pagosDelMes) => {
      // Verificar si hay abonos en este grupo
      const tieneAbonos = pagosDelMes.some((p) => p.Abono === true);

      if (tieneAbonos) {
        // Para abonos: sumar TODOS los abonos del mes y calcular excedente
        const totalAbonosDelMes = pagosDelMes
          .filter((p) => p.Abono === true)
          .reduce((sum, p) => sum + (p.Monto || 0), 0);

        if (totalAbonosDelMes > mensualidadNormal) {
          // El excedente de abonos va a recargos
          totalMensualidadesNormales += mensualidadNormal;
          totalRecargos += totalAbonosDelMes - mensualidadNormal;
        } else {
          // Todo va a mensualidades normales
          totalMensualidadesNormales += totalAbonosDelMes;
        }

        // También sumar los pagos no-abono de este mes
        const pagosNoAbono = pagosDelMes.filter((p) => p.Abono !== true);
        pagosNoAbono.forEach((pago) => {
          const monto = pago.Monto || 0;
          if (monto > mensualidadNormal) {
            totalMensualidadesNormales += mensualidadNormal;
            totalRecargos += monto - mensualidadNormal;
          } else {
            totalMensualidadesNormales += monto;
          }
        });
      } else {
        // Para pagos normales (PA): verificar si exceden mensualidad normal
        pagosDelMes.forEach((pago) => {
          const monto = pago.Monto || 0;
          if (monto > mensualidadNormal) {
            // El excedente va a recargos
            totalMensualidadesNormales += mensualidadNormal;
            totalRecargos += monto - mensualidadNormal;
          } else {
            // Todo va a mensualidades normales
            totalMensualidadesNormales += monto;
          }
        });
      }
    });

    return { totalMensualidadesNormales, totalRecargos };
  }, [allCoursePayments, schoolInfo]);
  // Total inscripciones: suma de TODAS las inscripciones pagadas del curso (EXCLUYENDO pagos nulos)
  const inscripcionesPagadas = allCoursePayments.filter(
    (p) => p.Liquidado && p.MesPagado === "Inscripcion" && p.Monto > 0
  );
  const totalInscripciones = inscripcionesPagadas.reduce(
    (acc, p) => acc + (p.Monto || 0),
    0
  );

  // Inscripciones pendientes: alumnos del curso sin inscripción pagada
  const { inscripcionesPendientes, montoInscripcionesPendientes } =
    useMemo(() => {
      if (!schoolInfo)
        return { inscripcionesPendientes: 0, montoInscripcionesPendientes: 0 };

      const estudiantesSinInscripcion = students.filter((s) => {
        const pago = allCoursePayments.find(
          (p) =>
            p.NumeroControl === s.NumeroControl &&
            p.MesPagado === "Inscripcion" &&
            (p.Liquidado || p.Monto === 0) // Incluir pagos nulos (Monto = 0) como "pagados" para restar de pendientes
        );
        return !pago;
      });

      const cantidad = estudiantesSinInscripcion.length;
      const monto = cantidad * (schoolInfo.Inscripcion || 0); // Usar el monto real de inscripción de la escuela

      return {
        inscripcionesPendientes: cantidad,
        montoInscripcionesPendientes: monto,
      };
    }, [students, allCoursePayments, schoolInfo]);
  // Cálculo de mensualidades pendientes

  // CÁLCULO CORRECTO Y DINÁMICO DE MENSUALIDADES PENDIENTES
  const { mensualidadesPendientes, montoMensualidadesPendientes } =
    useMemo(() => {
      if (!schoolInfo || !students.length || !allCoursePayments) {
        return { mensualidadesPendientes: 0, montoMensualidadesPendientes: 0 };
      }

      const mensualidadNormal = schoolInfo.MensualidadPorAlumno || 0;
      let cantidadPendientes = 0;
      let montoPendienteTotal = 0;

      // Solo calcular deuda desde el inicio del curso hasta el mes actual
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-11 (Enero=0, Febrero=1, etc.)
      const currentYear = now.getFullYear();

      if (!course?.InicioCurso) {
        return { mensualidadesPendientes: 0, montoMensualidadesPendientes: 0 };
      }

      const courseStartDate = new Date(course.InicioCurso);
      const courseStartMonth = courseStartDate.getMonth();
      const courseStartYear = courseStartDate.getFullYear();

      // LÓGICA CORREGIDA: Solo incluir meses desde el inicio del curso hasta hoy
      const monthsToCheck = months.filter((month) => {
        const monthIndex = MESES_DB.indexOf(month);
        if (monthIndex === -1) return false;

        if (currentYear === courseStartYear) {
          // Mismo año: desde mes de inicio del curso hasta mes actual
          return monthIndex >= courseStartMonth && monthIndex <= currentMonth;
        } else if (currentYear > courseStartYear) {
          // Año posterior al inicio del curso: incluir todos los meses del curso del año anterior
          // + meses del año actual hasta el mes actual
          return true; // Simplificado - se puede refinar si hay cursos multi-año
        } else {
          // Año anterior al inicio del curso: no incluir nada
          return false;
        }
      });

      console.log(
        "📅 MESES A VERIFICAR (desde inicio curso hasta hoy):",
        monthsToCheck
      );
      console.log("📅 TOTAL MESES A VERIFICAR:", monthsToCheck.length);

      students.forEach((student) => {
        monthsToCheck.forEach((month) => {
          // Buscar todos los pagos de este estudiante para este mes
          const pagosDelMes = allCoursePayments.filter(
            (p) =>
              p.NumeroControl === student.NumeroControl && p.MesPagado === month
          );

          if (pagosDelMes.length === 0) {
            // No hay pagos → pendiente
            cantidadPendientes += 1;
            montoPendienteTotal += mensualidadNormal;
          } else {
            // Verificar si está liquidado o es pago nulo
            const pagoLiquidado = pagosDelMes.find((p) => p.Liquidado === true);
            const pagoNulo = pagosDelMes.find((p) => p.Monto === 0);

            if (pagoLiquidado || pagoNulo) {
              return; // No pendiente
            }

            // Verificar abonos
            const abonos = pagosDelMes.filter((p) => p.Abono === true);
            if (abonos.length > 0) {
              const totalAbonado = abonos.reduce(
                (sum, p) => sum + (p.Monto || 0),
                0
              );
              const faltaPagar = mensualidadNormal - totalAbonado;

              if (faltaPagar > 0) {
                cantidadPendientes += 1;
                montoPendienteTotal += faltaPagar;
              } else {
                // Abonos completos, no pendiente
              }
            } else {
              // Hay pagos pero no liquidados → pendiente
              cantidadPendientes += 1;
              montoPendienteTotal += mensualidadNormal;
            }
          }
        });
      });

      return {
        mensualidadesPendientes: cantidadPendientes,
        montoMensualidadesPendientes: montoPendienteTotal,
      };
    }, [students, allCoursePayments, months, schoolInfo, course?.InicioCurso]);

  if (!course) return null;
  if (loading || loadingPayments) return <div>Cargando alumnos...</div>;
  if (!students.length)
    return <div>No hay alumnos activos para este curso.</div>;

  // Encabezados de columnas y claves de ordenamiento
  const baseColumns = [
    { label: "Ac.", key: "acciones", sortable: false },
    { label: "No. Lista", key: "lista" },
    { label: "No. Control", key: "NumeroControl" },
    { label: "Apellido Paterno", key: "ApellidoPaterno" },
    { label: "Apellido Materno", key: "ApellidoMaterno" },
    { label: "Nombre", key: "Nombre" },
    { label: "Deuda", key: "deuda" },
    {
      label: "Inscripción",
      key: "Inscripcion",
      sortable: true,
      isInscription: true,
    },
  ];

  // Agregar columnas de meses
  const monthColumns = months.map((month) => ({
    label: month.slice(0, 3), // Solo las primeras 3 letras
    key: month,
    sortable: true,
    isMonth: true,
  }));

  const columns = [...baseColumns, ...monthColumns];

  function handleSort(key, isMonth = false, isInscription = false) {
    if (isMonth) {
      handleMonthSort(key);
    } else if (isInscription) {
      handleMonthSort("Inscripcion"); // Usar la misma lógica que meses
    } else {
      // Limpiar ordenamiento por meses cuando se ordena por otra columna
      setMonthSort({});

      if (sortBy === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(key);
        setSortDirection("asc");
      }
    }
  }

  // Handlers para acciones
  function handleEdit(student) {
    // Elimina la propiedad 'deuda' antes de editar
    const studentClean = { ...student };
    delete studentClean.deuda;
    setStudentToEdit(studentClean);
    setStudentToDelete(null);
    setStudentToKardex(null);
    openModal("student-form");
  }
  function handleKardex(student) {
    setStudentToKardex(student);
    setStudentToEdit(null);
    setStudentToDelete(null);
    openModal("student-kardex");
  }
  function handleDelete(student) {
    setStudentToDelete(student);
    setStudentToEdit(null);
    setStudentToKardex(null);
    openModal("delete-student");
  }

  function handleDeactivate(student) {
    mutateDeactivate(student.NumeroControl);
  }

  function handleReactivate(student) {
    mutateReactivate(student.NumeroControl);
  }

  // Handler para mostrar el recibo de pago
  function handleShowReceipt(payment) {
    setSelectedPayment(payment);
    openModal("payment-receipt");
  }

  // Handler para mostrar el recibo de abono
  function handleShowAbono(payment) {
    setSelectedAbono(payment);
    openModal("payment-abono");
  }

  // Handler para mostrar el recibo de no aplica
  function handleShowNoAplica(payment) {
    setSelectedNoAplica(payment);
    openModal("payment-noaplica");
  }

  // Handler para nuevo pago
  function handleShowNuevoPago(student, mesPagado) {
    setNuevoPagoInfo({ student, mesPagado });
    openModal("nuevo-pago");
  }

  // Handler para editar recibo
  function handleEditPayment(payment) {
    // Buscar alumno para datos completos
    const alumno = students.find(
      (s) => s.NumeroControl === payment.NumeroControl
    );
    setEditPayment({ ...payment, ...alumno });
    setSelectedPayment(null); // Cerrar modal de recibo
    openModal("editar-pago");
  }

  // Handler para refrescar pagos tras eliminar
  function handleDeletedPayment() {
    setSelectedPayment(null);
    fetchPaymentsRefrescar();
  }

  // Helper para obtener correo del alumno
  function getCorreoAlumno(payment) {
    return (
      payment.Correo ||
      students.find((s) => s.NumeroControl === payment.NumeroControl)?.Correo ||
      ""
    );
  }

  // Envío masivo de recordatorios
  function handleAbrirSelectMes() {
    setShowMesSelect(true);
  }
  function handleCerrarSelectMes() {
    setShowMesSelect(false);
  }
  function handleSeleccionarMes(e) {
    setMesSeleccionado(e.target.value);
  }

  function handleEnviarRecordatorios() {
    console.log(
      "🟢 BOTÓN VERDE PRESIONADO - handleEnviarRecordatorios iniciado"
    );
    console.log("📅 Mes seleccionado:", mesSeleccionado);
    console.log("👥 Total estudiantes:", students.length);
    console.log("💰 Total pagos:", payments.length);

    if (!mesSeleccionado) {
      console.error("❌ No hay mes seleccionado");
      toast.error("Por favor selecciona un mes");
      return;
    }

    // Filtrar alumnos con adeudo en el mes seleccionado
    const alumnosAdeudo = students.filter((s) => {
      const pago = payments.find(
        (p) =>
          p.NumeroControl === s.NumeroControl &&
          p.MesPagado === mesSeleccionado &&
          (p.Liquidado || p.Monto > 0) // Considerar pagados los que están liquidados o tienen monto > 0 (no son NA)
      );
      const tieneAdeudo = !pago;
      console.log(
        `👤 ${s.NumeroControl} (${s.Nombre}): ${
          tieneAdeudo ? "ADEUDO" : "PAGADO"
        }`
      );
      return tieneAdeudo; // Retornar true si NO tiene pago (tiene adeudo)
    });

    console.log("🔍 Alumnos con adeudo encontrados:", alumnosAdeudo.length);

    if (alumnosAdeudo.length === 0) {
      console.log("✅ No hay alumnos con adeudo");
      toast.success(`No hay alumnos con adeudo en ${mesSeleccionado}`);
      setShowMesSelect(false);
      return;
    }

    // Filtrar solo alumnos que tengan correo electrónico
    const alumnosConCorreo = alumnosAdeudo.filter((alumno) => alumno.Correo);
    console.log("📧 Alumnos con correo:", alumnosConCorreo.length);
    console.log(
      "📧 Lista de alumnos con correo:",
      alumnosConCorreo.map((a) => `${a.NumeroControl}: ${a.Correo}`)
    );

    if (alumnosConCorreo.length === 0) {
      console.error("❌ Ningún alumno con adeudo tiene correo");
      toast.error(
        "Ningún alumno con adeudo tiene correo electrónico registrado"
      );
      return;
    }

    if (alumnosConCorreo.length < alumnosAdeudo.length) {
      console.warn(
        `⚠️ ${
          alumnosAdeudo.length - alumnosConCorreo.length
        } alumnos sin correo serán omitidos`
      );
      toast.warn(
        `${
          alumnosAdeudo.length - alumnosConCorreo.length
        } alumnos sin correo serán omitidos`
      );
    }

    // Confirmar envío masivo con window.confirm (más simple y directo)
    console.log("📬 Configurando confirmación masiva");
    console.log("📬 Alumni para email:", alumnosConCorreo);

    // Cerrar selector de mes
    setShowMesSelect(false);

    // Preguntar qué tipo de correo enviar
    const tipoRecordatorio = window.prompt(
      `¿Qué tipo de correo deseas enviar a ${alumnosConCorreo.length} alumnos con adeudo en ${mesSeleccionado}?\n\nEscribe:\n1 = CORREO RECORDATORIO\n2 = CORREO RECORDATORIO VENCIDO\n3 = CORREO DISCULPAS\n\nOpción (1, 2 o 3):`
    );

    if (
      !tipoRecordatorio ||
      (tipoRecordatorio !== "1" &&
        tipoRecordatorio !== "2" &&
        tipoRecordatorio !== "3")
    ) {
      console.log("❌ Envío masivo cancelado por el usuario");
      return;
    }

    let tipoPlantilla;
    if (tipoRecordatorio === "1") {
      tipoPlantilla = "CORREO RECORDATORIO";
    } else if (tipoRecordatorio === "2") {
      tipoPlantilla = "CORREO RECORDATORIO VENCIDO";
    } else if (tipoRecordatorio === "3") {
      tipoPlantilla = "CORREO DISCULPAS";
    }

    console.log("📧 Tipo de recordatorio masivo seleccionado:", tipoPlantilla);

    // Enviar recordatorios directamente
    console.log("📬 Enviando recordatorios masivos...");
    sendReminders({
      alumnosConAdeudo: alumnosConCorreo,
      mesPagado: mesSeleccionado,
      tipoPlantilla, // Usar el tipo seleccionado
    });

    console.log("✅ handleEnviarRecordatorios completado - Correos enviándose");
  }

  // Funciones del modal eliminadas - ahora usamos window.confirm directamente

  return (
    <>
      <DashboardRow>
        <DashboardCard>
          <CardIcon>👨‍🎓</CardIcon>
          <CardValue>{students.length}</CardValue>
          <CardLabel>Alumnos activos</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📉</CardIcon>
          <CardValue>{totalBajas}</CardValue>
          <CardLabel>Bajas</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📈</CardIcon>
          <CardValue>{totalAltas}</CardValue>
          <CardLabel>Altas</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>💵</CardIcon>
          <CardValue>${totalMensualidadesNormales.toFixed(2)}</CardValue>
          <CardLabel>Total mensualidades</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📝</CardIcon>
          <CardValue>${totalInscripciones.toFixed(2)}</CardValue>
          <CardLabel>Total inscripciones</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>💰</CardIcon>
          <CardValue>${totalRecargos.toFixed(2)}</CardValue>
          <CardLabel>Recargos pagados</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>❗</CardIcon>
          <CardValue>{inscripcionesPendientes}</CardValue>
          <CardSubValue>
            ${montoInscripcionesPendientes.toFixed(2)}
          </CardSubValue>
          <CardLabel>Inscripciones pendientes</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📅</CardIcon>
          <CardValue>{mensualidadesPendientes}</CardValue>
          <CardSubValue>
            ${montoMensualidadesPendientes.toFixed(2)}
          </CardSubValue>
          <CardLabel>Mensualidades pendientes</CardLabel>
        </DashboardCard>
      </DashboardRow>
      <TopActions>
        <button
          onClick={handleAbrirSelectMes}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Enviar recordatorios del mes
        </button>
        <button
          onClick={handleGenerarPdf}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Lista de pago actualizada
        </button>
      </TopActions>
      {showMesSelect && (
        <div style={{ margin: "1.2rem 0" }}>
          <select
            value={mesSeleccionado}
            onChange={handleSeleccionarMes}
            style={{ fontSize: 16, padding: "0.4rem 1rem" }}
          >
            <option value="">Selecciona mes o inscripción</option>
            <option value="Inscripcion">Inscripción</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={handleEnviarRecordatorios}
            disabled={isSendingReminders}
            style={{
              marginLeft: 8,
              padding: "0.4rem 1.2rem",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#43a047",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isSendingReminders ? "Enviando..." : "Enviar"}
          </button>
          <button
            onClick={handleCerrarSelectMes}
            style={{
              marginLeft: 8,
              padding: "0.4rem 1.2rem",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#e53935",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      )}
      <TableWrapper>
        <TableContainer>
          <StyledTable>
            <StickyThead>
              <tr>
                {columns.map((col) => (
                  <Th
                    key={col.key}
                    onClick={
                      col.sortable !== false
                        ? () =>
                            handleSort(col.key, col.isMonth, col.isInscription)
                        : undefined
                    }
                    style={{
                      cursor: col.sortable !== false ? "pointer" : "default",
                      backgroundColor:
                        (col.isMonth && monthSort[col.key]) ||
                        (col.isInscription && monthSort["Inscripcion"])
                          ? "#e3f2fd"
                          : undefined,
                    }}
                    aria-label={
                      col.sortable !== false
                        ? `Ordenar por ${col.label}`
                        : col.label
                    }
                  >
                    {col.label}
                    {col.isMonth && monthSort[col.key]
                      ? ` (${monthSort[col.key]})`
                      : col.isInscription && monthSort["Inscripcion"]
                      ? ` (${monthSort["Inscripcion"]})`
                      : sortBy === col.key
                      ? sortDirection === "asc"
                        ? " ▲"
                        : " ▼"
                      : null}
                  </Th>
                ))}
              </tr>
            </StickyThead>
            <tbody>
              {sortedStudents.map((student, idx) => (
                <tr key={student.NumeroControl}>
                  {/* Columna de Acciones - PRIMERA */}
                  <Td>
                    <Menus>
                      <Menus.Menu>
                        <Menus.Toggle id={`actions-${student.NumeroControl}`} />
                        <Menus.List id={`actions-${student.NumeroControl}`}>
                          <Menus.Button
                            icon={<HiEye />}
                            onClick={() => handleKardex(student)}
                            disabled={isDeactivating || isReactivating}
                          >
                            Ver Kardex
                          </Menus.Button>
                          <Menus.Button
                            icon={<HiPencil />}
                            onClick={() => handleEdit(student)}
                            disabled={isDeactivating || isReactivating}
                          >
                            Editar
                          </Menus.Button>

                          {/* Show Deactivate button if student is currently Active */}
                          {student.Activo && (
                            <Menus.Button
                              icon={<HiArrowDownCircle />}
                              onClick={() => handleDeactivate(student)}
                              disabled={isDeactivating || isReactivating}
                            >
                              Dar de baja
                            </Menus.Button>
                          )}
                          {/* Show Reactivate button if student is currently Inactive */}
                          {!student.Activo && (
                            <Menus.Button
                              icon={<HiArrowUpCircle />}
                              onClick={() => handleReactivate(student)}
                              disabled={isDeactivating || isReactivating}
                            >
                              Reactivar
                            </Menus.Button>
                          )}

                          <Menus.Button
                            icon={<HiTrash />}
                            onClick={() => handleDelete(student)}
                            disabled={isDeactivating || isReactivating}
                          >
                            Eliminar
                          </Menus.Button>
                        </Menus.List>
                      </Menus.Menu>
                    </Menus>
                  </Td>
                  {/* Columnas base */}
                  <Td>{idx + 1}</Td>
                  <Td>{student.NumeroControl}</Td>
                  <Td>{student.ApellidoPaterno}</Td>
                  <Td>{student.ApellidoMaterno}</Td>
                  <Td>{student.Nombre}</Td>
                  <Td>{student.deuda}</Td>
                  {/* Columna de Inscripción */}
                  <Td>
                    <PaymentStatusButton
                      payment={findPayment(
                        student.NumeroControl,
                        "Inscripcion"
                      )}
                      numeroControl={student.NumeroControl}
                      mesPagado="Inscripcion"
                      idCurso={course.IDCurso}
                      onShowReceipt={handleShowReceipt}
                      onShowAbono={handleShowAbono}
                      onShowNoAplica={handleShowNoAplica}
                      onShowNuevoPago={() =>
                        handleShowNuevoPago(student, "Inscripcion")
                      }
                    />
                  </Td>
                  {/* Columnas de meses */}
                  {months.map((m) => (
                    <Td key={m}>
                      <PaymentStatusButton
                        payment={findPayment(student.NumeroControl, m)}
                        numeroControl={student.NumeroControl}
                        mesPagado={m}
                        idCurso={course.IDCurso}
                        onShowReceipt={handleShowReceipt}
                        onShowAbono={handleShowAbono}
                        onShowNoAplica={handleShowNoAplica}
                        onShowNuevoPago={() => handleShowNuevoPago(student, m)}
                      />
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </StyledTable>
        </TableContainer>
      </TableWrapper>
      <Modal.Window name="student-form">
        {studentToEdit && (
          <CreateStudentForm
            studentToEdit={studentToEdit}
            onCloseModal={() => {
              setStudentToEdit(null);
              fetchPaymentsRefrescar(); // Refrescar datos cuando se cierre el modal de edición
            }}
          />
        )}
      </Modal.Window>
      <Modal.Window name="student-kardex">
        {studentToKardex && <StudentKardexView student={studentToKardex} />}
      </Modal.Window>
      <Modal.Window name="delete-student">
        {studentToDelete && (
          <ConfirmDelete
            resourceName={`estudiante ${studentToDelete.Nombre || ""} ${
              studentToDelete.ApellidoPaterno || ""
            }`}
            onConfirm={() => setStudentToDelete(null)}
            onCloseModal={() => setStudentToDelete(null)}
            numeroControl={studentToDelete.NumeroControl}
          />
        )}
      </Modal.Window>
      <Modal.Window name="payment-receipt">
        {selectedPayment && (
          <PaymentReceiptModal
            payment={{
              ...selectedPayment,
              Correo: getCorreoAlumno(selectedPayment),
            }}
            onEdit={handleEditPayment}
            onDeleted={handleDeletedPayment}
            onCloseModal={() => setSelectedPayment(null)}
          />
        )}
      </Modal.Window>
      <Modal.Window name="payment-abono">
        {selectedAbono ? (
          <PaymentReceiptModal
            payment={selectedAbono}
            showNuevoAbonoButton
            tipoCorreo="abono"
            onEdit={handleEditPayment}
            onDeleted={handleDeletedPayment}
            onNuevoAbono={() =>
              handleShowNuevoPago(
                students.find(
                  (s) => s.NumeroControl === selectedAbono.NumeroControl
                ),
                selectedAbono.MesPagado
              )
            }
            onCloseModal={() => setSelectedAbono(null)}
          />
        ) : null}
      </Modal.Window>
      <Modal.Window name="payment-noaplica">
        {selectedNoAplica && (
          <PaymentReceiptModal
            payment={selectedNoAplica}
            onCloseModal={() => setSelectedNoAplica(null)}
          />
        )}
      </Modal.Window>
      <Modal.Window name="nuevo-pago">
        {nuevoPagoInfo && (
          <NewPaymentModal
            student={nuevoPagoInfo.student}
            mesPagado={nuevoPagoInfo.mesPagado}
            idCurso={course.IDCurso}
            onCloseModal={() => setNuevoPagoInfo(null)}
            onPagoGuardado={fetchPaymentsRefrescar}
          />
        )}
      </Modal.Window>
      <Modal.Window name="payment-email-confirmation">
        {/* Este modal se abrirá cuando se necesite confirmación de email */}
      </Modal.Window>
      <Modal.Window name="editar-pago">
        {editPayment ? (
          <NewPaymentModal
            student={editPayment}
            mesPagado={editPayment.MesPagado}
            idCurso={course.IDCurso}
            pagoEdit={editPayment}
            onCloseModal={() => setEditPayment(null)}
            onPagoGuardado={() => {
              setEditPayment(null);
              fetchPaymentsRefrescar();
            }}
          />
        ) : null}
      </Modal.Window>

      {/* Modal de confirmación masiva eliminado - ahora usamos window.confirm */}
    </>
  );
}

export default PaymentsTable;
