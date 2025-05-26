import { useEffect, useState, useMemo, useCallback, useContext } from "react";
import styled from "styled-components";
import supabase from "../../services/supabase";
import PaymentStatusButton from "./PaymentStatusButton";
import Menus from "../../ui/Menus";
import { HiPencil, HiTrash, HiEye } from "react-icons/hi2";
import Modal, { ModalContext } from "../../ui/Modal";
import CreateStudentForm from "../students/CreateStudentForm";
import StudentKardexView from "../students/StudentKardexView";
import ConfirmDelete from "../../ui/ConfirmDelete";
import PaymentReceiptModal from "./PaymentReceiptModal";
import NewPaymentModal from "./NewPaymentModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2.4rem;
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
  gap: 2.4rem;
  margin-bottom: 2.4rem;
  width: 100%;
  flex-wrap: wrap;
`;

const DashboardCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  padding: 1.6rem 2.2rem;
  min-width: 180px;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const CardValue = styled.div`
  font-size: 2.2rem;
  font-weight: 800;
  color: #22223b;
  margin-bottom: 0.4rem;
`;

const CardLabel = styled.div`
  font-size: 1.15rem;
  color: #6c757d;
  font-weight: 600;
`;

const CardIcon = styled.div`
  font-size: 2.2rem;
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
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [sortBy, setSortBy] = useState("deuda");
  const [sortDirection, setSortDirection] = useState("desc");

  // Estado para modales de acciones
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [studentToKardex, setStudentToKardex] = useState(null);
  const { open: openModal } = useContext(ModalContext);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedAbono, setSelectedAbono] = useState(null);
  const [selectedNoAplica, setSelectedNoAplica] = useState(null);
  const [nuevoPagoInfo, setNuevoPagoInfo] = useState(null);
  const [editPayment, setEditPayment] = useState(null);

  // Panel de datos relevantes
  const [totalAlumnosEscuela, setTotalAlumnosEscuela] = useState(0);
  const [showMesSelect, setShowMesSelect] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState("");

  // Lista de escuelas para obtener logos
  const [schoolsList, setSchoolsList] = useState([]);
  useEffect(() => {
    async function fetchSchools() {
      const { data, error } = await supabase
        .from("ESCUELA")
        .select("Nombre, URLLogo, IDEscuela");
      if (!error && data) setSchoolsList(data);
    }
    fetchSchools();
  }, []);

  const handleGenerarPdf = useCallback(async () => {
    const doc = new jsPDF();
    // --- Obtener logos desde la lista de escuelas ---
    // Logo academia: buscar por nombre "Piensa Ajedrez" o IDEscuela fijo
    const escuelaAcademia = schoolsList.find(
      (s) =>
        s.Nombre?.toLowerCase().includes("piensa ajedrez") || s.IDEscuela === 1
    );
    const urlLogoAcademia =
      escuelaAcademia?.URLLogo || "/logos/piensa-ajedrez-logo.png";
    // Logo escuela: buscar por nombre o IDEscuela del curso
    let escuelaCurso = null;
    if (course?.NombreEscuela) {
      escuelaCurso = schoolsList.find((s) => s.Nombre === course.NombreEscuela);
    } else if (course?.IDEscuela) {
      escuelaCurso = schoolsList.find((s) => s.IDEscuela === course.IDEscuela);
    }
    const urlLogoEscuela = escuelaCurso?.URLLogo || "";
    // --- Utilidad para convertir imagen a dataURL (copiada de asistencia) ---
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
            console.error(
              `[imageToDataUrl] FileReader error for ${url}:`,
              error
            );
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
    const logoAcademiaDataUrl = await imageToDataUrl(urlLogoAcademia);
    const logoEscuelaDataUrl = urlLogoEscuela
      ? await imageToDataUrl(urlLogoEscuela)
      : null;
    // --- Encabezado con logos ---
    const logoWidth = 30,
      logoHeight = 15,
      pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;
    // Logo escuela (izquierda)
    if (logoEscuelaDataUrl) {
      try {
        doc.addImage(
          logoEscuelaDataUrl,
          "PNG",
          pageMargin,
          currentY,
          logoWidth,
          logoHeight
        );
      } catch {
        doc.text("[Logo Escuela]", pageMargin, currentY + logoHeight / 2);
      }
    } else {
      doc.text("[Logo Escuela]", pageMargin, currentY + logoHeight / 2);
    }
    // Logo academia (derecha)
    if (logoAcademiaDataUrl) {
      try {
        doc.addImage(
          logoAcademiaDataUrl,
          "PNG",
          pageWidth - logoWidth - pageMargin,
          currentY,
          logoWidth,
          logoHeight
        );
      } catch {
        doc.text(
          "[Logo Academia]",
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
    // --- Encabezado profesional ---
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("LISTA DE PAGOS", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `ESCUELA: ${
        escuelaCurso?.Nombre || students[0]?.NombreEscuela || schoolId || "-"
      }`,
      pageMargin,
      currentY
    );
    doc.text(`CURSO: ${course?.IDCurso || "-"}`, pageWidth / 2 + 10, currentY);
    currentY += 7;
    doc.text(
      `CICLO: ${course?.InicioCurso?.slice(0, 4) || ""} - ${
        course?.FinCurso?.slice(0, 4) || ""
      }`,
      pageMargin,
      currentY
    );
    doc.text(
      `FECHA: ${new Date().toLocaleDateString()}`,
      pageWidth / 2 + 10,
      currentY
    );
    currentY += 10;
    // --- Tabla de alumnos ---
    autoTable(doc, {
      head: [["No.", "No. Control", "Apellido P.", "Apellido M.", "Nombre(s)"]],
      body: students.map((s, i) => [
        i + 1,
        s.NumeroControl,
        s.ApellidoPaterno,
        s.ApellidoMaterno,
        s.Nombre,
      ]),
      startY: currentY,
      theme: "grid",
      styles: { fontSize: 10 },
    });
    doc.save(`ListaPagos_${escuelaCurso?.Nombre || schoolId || ""}.pdf`);
  }, [students, payments, course, schoolId, schoolsList]);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ALUMNO")
        .select(
          "NumeroControl, Nombre, ApellidoPaterno, ApellidoMaterno, Activo, NombreEscuela, FechaNacimiento, Telefono, Correo, Tutor, Grado, Grupo, Beca, PorcentajeBeca, Profesor, Rango, FechaInscripcion, FechaBaja, Nick, Password, QuienRecoge1, QuienRecoge2, URLImagen"
        )
        .eq("Activo", true)
        .eq("NombreEscuela", schoolId)
        .order("ApellidoPaterno");
      if (!error) setStudents(data);
      setLoading(false);
    }
    if (course && schoolId) fetchStudents();
  }, [course, schoolId]);

  useEffect(() => {
    async function fetchPayments() {
      if (!students.length || !course) return;
      setLoadingPayments(true);
      const numeroControls = students.map((s) => s.NumeroControl);
      const { data, error } = await supabase
        .from("PAGO")
        .select(
          "NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca"
        )
        .in("NumeroControl", numeroControls)
        .eq("IDCurso", course.IDCurso);
      if (!error) setPayments(data);
      setLoadingPayments(false);
    }
    fetchPayments();
  }, [students, course]);

  const months = useMemo(
    () => getMonthsBetween(course?.InicioCurso, course?.FinCurso),
    [course]
  );

  // Helper para encontrar el pago correspondiente
  const findPayment = useCallback(
    (numeroControl, mesPagado) => {
      return payments.find(
        (p) =>
          p.NumeroControl === numeroControl &&
          p.IDCurso === course.IDCurso &&
          p.MesPagado === mesPagado
      );
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
  }, [students, payments, months, findPayment]);

  // Ordenamiento
  const sortedStudents = useMemo(() => {
    let arr = [...studentsWithDeuda];
    if (sortBy === "deuda") {
      arr.sort((a, b) =>
        sortDirection === "desc" ? b.deuda - a.deuda : a.deuda - b.deuda
      );
    } else {
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
  }, [studentsWithDeuda, sortBy, sortDirection]);

  // Refrescar pagos después de guardar
  async function fetchPaymentsRefrescar() {
    if (!students.length || !course) return;
    setLoadingPayments(true);
    const numeroControls = students.map((s) => s.NumeroControl);
    const { data, error } = await supabase
      .from("PAGO")
      .select(
        "NumeroRecibo,NumeroControl,IDCurso,MesPagado,Monto,Liquidado,FechaHora,MetodoPago,Nota,CantidadBeca,PorcentajeBeca"
      )
      .in("NumeroControl", numeroControls)
      .eq("IDCurso", course.IDCurso);
    if (!error) setPayments(data);
    setLoadingPayments(false);
  }

  // Total alumnos registrados en la escuela
  useEffect(() => {
    async function fetchTotalAlumnosEscuela() {
      if (!schoolId) return;
      const { count } = await supabase
        .from("ALUMNO")
        .select("NumeroControl", { count: "exact", head: true })
        .eq("NombreEscuela", schoolId);
      setTotalAlumnosEscuela(count || 0);
    }
    fetchTotalAlumnosEscuela();
  }, [schoolId]);

  // Datos calculados en render
  // Alumnos activos: students.length
  // Total alumnos: totalAlumnosEscuela
  // Total mensualidades: suma de pagos de mensualidades pagadas
  const totalMensualidades = payments
    .filter((p) => p.Liquidado && p.MesPagado !== "Inscripcion")
    .reduce((acc, p) => acc + (p.Monto || 0), 0);
  // Total inscripciones: suma de pagos de inscripciones pagadas
  const totalInscripciones = payments
    .filter((p) => p.Liquidado && p.MesPagado === "Inscripcion")
    .reduce((acc, p) => acc + (p.Monto || 0), 0);
  // Inscripciones pendientes: alumnos del curso sin inscripción pagada
  const inscripcionesPendientes = students.filter((s) => {
    const pago = payments.find(
      (p) =>
        p.NumeroControl === s.NumeroControl &&
        p.MesPagado === "Inscripcion" &&
        p.Liquidado
    );
    return !pago;
  }).length;
  // Mensualidades pendientes: suma de mensualidades no pagadas
  const mensualidadesPendientes = students.reduce((acc, s) => {
    const pendientes = months.filter((m) => {
      const pago = payments.find(
        (p) =>
          p.NumeroControl === s.NumeroControl &&
          p.MesPagado === m &&
          p.Liquidado
      );
      return !pago;
    });
    return acc + pendientes.length;
  }, 0);

  if (!course) return null;
  if (loading || loadingPayments) return <div>Cargando alumnos...</div>;
  if (!students.length)
    return <div>No hay alumnos activos para este curso.</div>;

  // Encabezados de columnas y claves de ordenamiento
  const columns = [
    { label: "No. Lista", key: "lista" },
    { label: "No. Control", key: "NumeroControl" },
    { label: "Apellido Paterno", key: "ApellidoPaterno" },
    { label: "Apellido Materno", key: "ApellidoMaterno" },
    { label: "Nombre", key: "Nombre" },
    { label: "Deuda", key: "deuda" },
  ];

  function handleSort(key) {
    if (sortBy === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
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
    // Simulado: filtra alumnos con adeudo en el mes seleccionado y muestra toast
    const alumnosAdeudo = students.filter((s) => {
      const pago = payments.find(
        (p) =>
          p.NumeroControl === s.NumeroControl &&
          p.MesPagado === mesSeleccionado &&
          p.Liquidado
      );
      return !pago;
    });
    alert(
      `Se enviarían recordatorios a ${alumnosAdeudo.length} alumnos con adeudo en ${mesSeleccionado}`
    );
    setShowMesSelect(false);
  }

  return (
    <>
      <DashboardRow>
        <DashboardCard>
          <CardIcon>👨‍🎓</CardIcon>
          <CardValue>{students.length}</CardValue>
          <CardLabel>Alumnos activos</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>🏫</CardIcon>
          <CardValue>{totalAlumnosEscuela}</CardValue>
          <CardLabel>Total alumnos</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>💵</CardIcon>
          <CardValue>${totalMensualidades.toFixed(2)}</CardValue>
          <CardLabel>Total mensualidades</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📝</CardIcon>
          <CardValue>${totalInscripciones.toFixed(2)}</CardValue>
          <CardLabel>Total inscripciones</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>❗</CardIcon>
          <CardValue>{inscripcionesPendientes}</CardValue>
          <CardLabel>Inscripciones pendientes</CardLabel>
        </DashboardCard>
        <DashboardCard>
          <CardIcon>📅</CardIcon>
          <CardValue>{mensualidadesPendientes}</CardValue>
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
            Enviar
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
        <StyledTable>
          <thead>
            <tr>
              {columns.map((col) => (
                <Th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  aria-label={`Ordenar por ${col.label}`}
                >
                  {col.label}
                  {sortBy === col.key
                    ? sortDirection === "asc"
                      ? " ▲"
                      : " ▼"
                    : null}
                </Th>
              ))}
              <Th>Inscripción</Th>
              {months.map((m) => (
                <Th key={m}>{m.slice(0, 3)}</Th>
              ))}
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student, idx) => (
              <tr key={student.NumeroControl}>
                <Td>{idx + 1}</Td>
                <Td>{student.NumeroControl}</Td>
                <Td>{student.ApellidoPaterno}</Td>
                <Td>{student.ApellidoMaterno}</Td>
                <Td>{student.Nombre}</Td>
                <Td>{student.deuda}</Td>
                <Td>
                  <PaymentStatusButton
                    payment={findPayment(student.NumeroControl, "Inscripcion")}
                    onShowReceipt={handleShowReceipt}
                    onShowAbono={handleShowAbono}
                    onShowNoAplica={handleShowNoAplica}
                    onShowNuevoPago={() =>
                      handleShowNuevoPago(student, "Inscripcion")
                    }
                  />
                </Td>
                {months.map((m) => (
                  <Td key={m}>
                    <PaymentStatusButton
                      payment={findPayment(student.NumeroControl, m)}
                      onShowReceipt={handleShowReceipt}
                      onShowAbono={handleShowAbono}
                      onShowNoAplica={handleShowNoAplica}
                      onShowNuevoPago={() => handleShowNuevoPago(student, m)}
                    />
                  </Td>
                ))}
                <Td>
                  <Menus>
                    <Menus.Menu>
                      <Menus.Toggle id={`actions-${student.NumeroControl}`} />
                      <Menus.List id={`actions-${student.NumeroControl}`}>
                        <Menus.Button
                          icon={<HiEye />}
                          onClick={() => handleKardex(student)}
                        >
                          Ver Kardex
                        </Menus.Button>
                        <Menus.Button
                          icon={<HiPencil />}
                          onClick={() => handleEdit(student)}
                        >
                          Editar
                        </Menus.Button>
                        <Menus.Button
                          icon={<HiTrash />}
                          onClick={() => handleDelete(student)}
                        >
                          Eliminar
                        </Menus.Button>
                      </Menus.List>
                    </Menus.Menu>
                  </Menus>
                </Td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      </TableWrapper>
      <Modal.Window name="student-form">
        {studentToEdit && (
          <CreateStudentForm
            studentToEdit={studentToEdit}
            onCloseModal={() => setStudentToEdit(null)}
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
    </>
  );
}

export default PaymentsTable;
