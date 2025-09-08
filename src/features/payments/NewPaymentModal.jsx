import { useEffect, useState } from "react";
import styled from "styled-components";
import Button from "../../ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  useBancos,
  useCreatePayment,
  useUpdatePayment,
  useNextNumeroRecibo,
  useLastPaymentByStudent,
  usePaymentsByStudentAndMonth,
} from "./usePayments";
import { useSchools } from "../schools/useSchools";
import { toast } from "react-hot-toast";
import { getCurrentDateTime, getCurrentISOString } from "../../utils/dateUtils";
import { useSendEmailWithTemplate } from "../emails/useSendEmail";

const ModalContent = styled.div`
  padding: 2.4rem 2rem;
  min-width: 32rem;
  max-width: 40rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2.4rem;
`;

const Field = styled.div`
  margin-bottom: 1.2rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: var(--color-grey-700);
  margin-right: 0.6rem;
`;

const Value = styled.span`
  color: var(--color-grey-900);
`;

const Select = styled.select`
  width: 100%;
  padding: 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem;
  border-radius: 0.4rem;
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
`;

const Checkbox = styled.input`
  margin-right: 0.6rem;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2.4rem;
  gap: 1.2rem;
`;

function NewPaymentModal({
  student,
  mesPagado,
  idCurso,
  onCloseModal,
  onPagoGuardado,
  pagoEdit,
}) {
  const { bancos = [], isLoading: isLoadingBancos } = useBancos();
  const { createPayment, isCreating } = useCreatePayment();
  const { updatePayment, isUpdating } = useUpdatePayment();
  const { lastPayment } = useLastPaymentByStudent(student.NumeroControl);
  const { schools = [], isLoading: isLoadingSchools } = useSchools();
  const { sendEmail, isSending } = useSendEmailWithTemplate();

  // Generar número de recibo SOLO para nuevos pagos, NO para edición
  const today = getCurrentISOString().split("T")[0]; // YYYY-MM-DD
  const { nextNumero, isLoading: isGeneratingRecibo } = useNextNumeroRecibo(
    pagoEdit ? null : today // Solo generar si NO es edición
  );

  // Obtener pagos existentes del mes para detectar si ya hay abonos DEL MISMO CURSO
  const { payments: existingPayments } = usePaymentsByStudentAndMonth(
    student.NumeroControl,
    mesPagado,
    idCurso // CRÍTICO: Solo buscar pagos del mismo curso
  );
  const [form, setForm] = useState({
    NumeroRecibo: "",
    NumeroControl: student.NumeroControl,
    MesPagado: mesPagado,
    FechaHora: "",
    MetodoPago: "Efectivo",
    Monto: 0,
    Nota: "",
    Notificado: false,
    Liquidado: true,
    Abono: false, // Se calculará dinámicamente
    Beca: student.Beca || false,
    PorcentajeBeca: student.PorcentajeBeca || 0,
    CantidadBeca: 0,
    PagoNulo: false,
  });
  const [selectedBanco, setSelectedBanco] = useState("");
  const [montoConBeca, setMontoConBeca] = useState(0);
  const [cantidadBeca, setCantidadBeca] = useState(0);
  const [error, setError] = useState("");
  const [selectedAmountType, setSelectedAmountType] = useState("");
  const [showBankPreloadMessage, setShowBankPreloadMessage] = useState(false);
  const [lastPaymentBankId, setLastPaymentBankId] = useState(null);

  // Estados para modales de confirmación de email
  // Variables de email eliminadas - ahora se envían automáticamente

  const isWorking =
    isCreating ||
    isUpdating ||
    isLoadingBancos ||
    isLoadingSchools ||
    (!pagoEdit && isGeneratingRecibo) ||
    isSending;

  // Encontrar la escuela del estudiante
  const studentSchool = schools.find(
    (school) => school.NombreEscuela === student.NombreEscuela
  );

  // Opciones para el selector de monto
  const amountOptions = [
    {
      value: "mensualidad",
      label: `Mensualidad: $${studentSchool?.MensualidadPorAlumno || 0}`,
      amount: studentSchool?.MensualidadPorAlumno || 0,
    },
    {
      value: "mensualidad_recargo",
      label: `Mensualidad con recargo: $${
        studentSchool?.MensualidadConRecargo || 0
      }`,
      amount: studentSchool?.MensualidadConRecargo || 0,
    },
    {
      value: "abono",
      label: "Abono",
      amount: 0,
    },
  ];

  // Inicializar formulario con datos de edición si existe
  useEffect(() => {
    if (pagoEdit) {
      setForm((prevForm) => ({
        ...prevForm,
        ...pagoEdit,
        NumeroRecibo: pagoEdit.NumeroRecibo,
        NumeroControl: pagoEdit.NumeroControl,
        MesPagado: pagoEdit.MesPagado,
        FechaHora: pagoEdit.FechaHora,
        MetodoPago: pagoEdit.MetodoPago,
        Monto: pagoEdit.Monto,
        Nota: pagoEdit.Nota,
        Notificado: pagoEdit.Notificado,
        Liquidado: pagoEdit.Liquidado,
        Abono: pagoEdit.Abono || false,
        Beca: pagoEdit.Beca,
        PorcentajeBeca: pagoEdit.PorcentajeBeca,
        CantidadBeca: pagoEdit.CantidadBeca,
        PagoNulo: pagoEdit.PagoNulo || false,
      }));

      // Si está editando y es depósito, extraer banco de la nota
      if (pagoEdit.MetodoPago === "Deposito" && pagoEdit.Nota) {
        const bancoMatch = bancos.find((b) =>
          pagoEdit.Nota.startsWith(b.NombreBanco)
        );
        if (bancoMatch) {
          setSelectedBanco(String(bancoMatch.IDBanco));
        }
      }
    } else {
      // Para nuevo pago, generar número de recibo
      const today = getCurrentDateTime();
      const fechaHora = today.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      setForm((prevForm) => ({
        ...prevForm,
        FechaHora: fechaHora,
        NumeroRecibo: "", // Se genera después
      }));
    }
  }, [pagoEdit, bancos]);

  // Precargar monto de inscripción automáticamente cuando sea Inscripcion
  useEffect(() => {
    if (
      !pagoEdit &&
      mesPagado === "Inscripcion" &&
      studentSchool?.Inscripcion
    ) {
      setForm((prevForm) => ({
        ...prevForm,
        Monto: studentSchool.Inscripcion,
      }));
    }
  }, [pagoEdit, mesPagado, studentSchool]);

  // Precargar banco del último pago si es para un nuevo pago (no edición)
  useEffect(() => {
    if (
      !pagoEdit &&
      lastPayment &&
      lastPayment.MetodoPago === "Deposito" &&
      lastPayment.Nota
    ) {
      console.log("Precargando método de pago del último pago:", lastPayment);
      setForm((prevForm) => ({
        ...prevForm,
        MetodoPago: "Deposito",
      }));

      // Intentar extraer el banco de la nota si está al principio
      const bancoMatch = bancos.find((b) =>
        lastPayment.Nota.startsWith(b.NombreBanco)
      );
      if (bancoMatch) {
        setSelectedBanco(String(bancoMatch.IDBanco));
        setLastPaymentBankId(String(bancoMatch.IDBanco)); // Guardar el ID del banco del último pago
        setShowBankPreloadMessage(true); // Mostrar leyenda cuando se precarga
      }
    }
  }, [lastPayment, pagoEdit, bancos]);

  // Establecer número de recibo cuando esté disponible SOLO para nuevos pagos
  useEffect(() => {
    if (!pagoEdit && nextNumero && !form.NumeroRecibo) {
      console.log(
        "Estableciendo número de recibo para NUEVO pago:",
        nextNumero
      );
      setForm((prevForm) => ({
        ...prevForm,
        NumeroRecibo: nextNumero,
      }));
    }
  }, [nextNumero, pagoEdit, form.NumeroRecibo]);

  // useEffect para detectar abonos existentes y configurar automáticamente
  useEffect(() => {
    if (!pagoEdit && existingPayments && existingPayments.length > 0) {
      console.log(
        "Pagos existentes detectados para este mes y curso:",
        existingPayments
      );

      // CRÍTICO: Solo considerar como abonos si el campo Abono=true en BD
      const hasAbonos = existingPayments.some((p) => p.Abono === true);

      if (hasAbonos) {
        console.log(
          "Se detectaron ABONOS VERDADEROS (Abono=true) del mismo curso, configurando como abono automáticamente"
        );
        setForm((prevForm) => ({
          ...prevForm,
          Liquidado: false, // Si hay abonos del mismo curso, el siguiente será un abono también
          Abono: true,
        }));
      } else {
        console.log(
          "No se detectaron abonos verdaderos (Abono=true) del mismo curso, configuración normal"
        );
      }
    }
  }, [existingPayments, pagoEdit]);

  // Calcular monto con beca en tiempo real
  useEffect(() => {
    if (
      form.Beca &&
      form.PorcentajeBeca > 0 &&
      form.Monto > 0 &&
      !form.PagoNulo
    ) {
      const descuento = (form.Monto * form.PorcentajeBeca) / 100;
      setCantidadBeca(descuento);
      setMontoConBeca(form.Monto - descuento);
    } else {
      setCantidadBeca(0);
      setMontoConBeca(form.Monto);
    }
    if (form.PagoNulo) {
      setMontoConBeca(0);
      setCantidadBeca(0);
    }
  }, [form.Monto, form.Beca, form.PorcentajeBeca, form.PagoNulo]);

  // Resetear selectedAmountType cuando se activa Pago nulo
  useEffect(() => {
    if (form.PagoNulo) {
      setSelectedAmountType("");
      setSelectedBanco("");
      setShowBankPreloadMessage(false); // Ocultar leyenda cuando se activa Pago nulo
      setLastPaymentBankId(null); // Resetear el banco del último pago
    }
  }, [form.PagoNulo]);

  // Formatear fecha humana
  let fechaHumana = "-";
  if (form.FechaHora) {
    try {
      // Mostrar la hora local del usuario
      const fechaLocal = new Date(form.FechaHora);
      fechaHumana = format(fechaLocal, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (e) {
      fechaHumana = form.FechaHora;
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
      // Si marca "Pago nulo", resetear y activar Liquidado
      ...(name === "PagoNulo" && checked
        ? {
            Monto: 0,
            Liquidado: true,
            Abono: false,
            MetodoPago: "Efectivo",
            Nota: "",
          }
        : {}),
      // Si desmarca "Pago nulo" y el monto es 0, limpiarlo para que ingrese un monto válido
      ...(name === "PagoNulo" && !checked && f.Monto === 0
        ? { Monto: "" }
        : {}),
      // LÓGICA DE ABONOS CORREGIDA:
      // Si desmarca "Liquidado", automáticamente marcar "Abono" como true
      ...(name === "Liquidado" && !checked ? { Abono: true } : {}),
      // Si marca "Liquidado", automáticamente desmarcar "Abono" como false (a menos que ya existan abonos previos)
      ...(name === "Liquidado" && checked ? { Abono: false } : {}),
    }));
  }

  // Función para manejar el cambio del selector de monto
  function handleAmountTypeChange(e) {
    const selectedValue = e.target.value;
    setSelectedAmountType(selectedValue);

    if (selectedValue) {
      const selectedOption = amountOptions.find(
        (option) => option.value === selectedValue
      );
      if (selectedOption) {
        setForm((prevForm) => ({
          ...prevForm,
          Monto: selectedOption.amount,
        }));

        // Lógica específica según el tipo seleccionado
        if (selectedValue === "abono") {
          // Si selecciona "abono", activar Abono y desactivar Liquidado
          setForm((prevForm) => ({
            ...prevForm,
            Monto: 0,
            Abono: true,
            Liquidado: false,
          }));
        } else if (
          selectedValue === "mensualidad" ||
          selectedValue === "mensualidad_recargo"
        ) {
          // Si selecciona Mensualidad o Mensualidad con recargo, activar Liquidado y desactivar Abono
          setForm((prevForm) => ({
            ...prevForm,
            Liquidado: true,
            Abono: false,
          }));
        }
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    console.log("handleSubmit - Modo:", pagoEdit ? "EDITANDO" : "CREANDO");
    console.log("handleSubmit - pagoEdit:", pagoEdit);

    // Validaciones
    if (form.MetodoPago === "Deposito" && !selectedBanco) {
      setError(
        "Debe seleccionar un banco cuando el método de pago es Depósito"
      );
      return;
    }

    if (
      !form.PagoNulo &&
      (Number(form.Monto) === 0 || form.Monto === "" || form.Monto === null)
    ) {
      setError(
        "El monto no puede ser 0. Si es un pago nulo, marque la casilla 'Pago nulo'"
      );
      return;
    }

    if (form.PagoNulo && Number(form.Monto) !== 0) {
      setError("Si marca 'Pago nulo', el monto debe ser 0");
      return;
    }

    // Concatenar banco en Nota si es depósito
    let notaFinal = form.Nota || "";
    if (form.MetodoPago === "Deposito" && selectedBanco) {
      const bancoNombre =
        bancos.find((b) => String(b.IDBanco) === String(selectedBanco))
          ?.NombreBanco || "";
      notaFinal = bancoNombre + (notaFinal ? " " + notaFinal : "");
    }

    // Limpiar objeto pago para enviar solo los campos válidos y tipos correctos
    const pago = {
      NumeroRecibo: String(form.NumeroRecibo),
      NumeroControl: String(form.NumeroControl),
      Monto: form.PagoNulo ? 0 : Number(montoConBeca) || 0,
      MesPagado: String(form.MesPagado),
      FechaHora: String(form.FechaHora),
      MetodoPago: String(form.MetodoPago),
      Nota: String(notaFinal || ""),
      Notificado: !!form.Notificado,
      Liquidado: form.PagoNulo ? false : !!form.Liquidado,
      Abono: form.PagoNulo ? false : !!form.Abono,
      IDCurso: String(idCurso) || "",
      Beca: !!form.Beca,
      CantidadBeca: Number(cantidadBeca) || 0,
      PorcentajeBeca: parseInt(form.PorcentajeBeca, 10) || 0,
    };

    // Validar que todos los campos requeridos estén presentes
    console.log("Validando objeto pago antes de enviar:", pago);

    if (
      !pago.NumeroRecibo ||
      !pago.NumeroControl ||
      !pago.MesPagado ||
      !pago.FechaHora
    ) {
      setError("Faltan campos requeridos en el formulario");
      return;
    }

    if (pagoEdit) {
      // UPDATE usando el hook
      updatePayment(
        { paymentData: pago, numeroRecibo: pagoEdit.NumeroRecibo },
        {
          onSuccess: () => {
            console.log("Pago actualizado exitosamente");
            if (onPagoGuardado) onPagoGuardado();
            onCloseModal();
          },
          onError: (error) => {
            console.error("Error en updatePayment:", error);
            setError(error.message || "Error al actualizar el pago");
          },
        }
      );
    } else {
      // INSERT usando el hook
      console.log("Enviando pago para crear:", pago);
      createPayment(pago, {
        onSuccess: () => {
          console.log("Pago creado exitosamente");

          // Enviar email automáticamente si es apropiado
          if (student.Correo && pago.Monto > 0) {
            let tipoPlantilla = "";
            if (pago.Liquidado) {
              tipoPlantilla = "CORREO AGRADECIMIENTO";
            } else {
              tipoPlantilla = "CORREO ABONO";
            }

            if (tipoPlantilla) {
              // Calcular saldo pendiente para abonos
              let saldoPendiente = 0;
              if (!pago.Liquidado && studentSchool) {
                const montoCompleto =
                  pago.MesPagado === "Inscripcion"
                    ? studentSchool.Inscripcion || 0
                    : studentSchool.MensualidadPorAlumno || 0;
                saldoPendiente = Math.max(
                  0,
                  montoCompleto - Number(pago.Monto)
                );
              }

              const alumnoData = {
                Nombre: student.Nombre,
                ApellidoPaterno: student.ApellidoPaterno,
                ApellidoMaterno: student.ApellidoMaterno,
                NumeroControl: student.NumeroControl,
                Correo: student.Correo,
                NombreEscuela: student.NombreEscuela,
              };

              const paymentData = {
                NumeroRecibo: pago.NumeroRecibo,
                MesPagado: pago.MesPagado,
                Monto: pago.Monto,
                FechaHora: pago.FechaHora,
                MetodoPago: pago.MetodoPago,
                SaldoPendiente: saldoPendiente,
              };

              // Enviar email automáticamente
              sendEmail(
                { tipoPlantilla, alumnoData, paymentData },
                {
                  onSuccess: () => {
                    toast.success("Correo enviado exitosamente");
                  },
                  onError: (error) => {
                    console.error("Error enviando correo:", error);
                    toast.error("Error al enviar correo");
                  },
                }
              );
            }
          }

          if (onPagoGuardado) onPagoGuardado();
          onCloseModal();
        },
        onError: (error) => {
          console.error("Error en createPayment:", error);
          setError(error.message || "Error al registrar el pago");
        },
      });
    }
  }

  function handleOpenRecordatorio() {
    console.log(
      "🔴 handleOpenRecordatorio llamado para:",
      student.NumeroControl
    );

    // Enviar recordatorio directamente
    if (!student.Correo) {
      console.error("❌ Alumno sin correo:", student.NumeroControl);
      toast.error("El alumno no tiene correo electrónico registrado");
      return;
    }

    console.log("📧 Enviando recordatorio a:", student.Correo);

    const alumnoData = {
      Nombre: student.Nombre,
      ApellidoPaterno: student.ApellidoPaterno,
      ApellidoMaterno: student.ApellidoMaterno,
      NumeroControl: student.NumeroControl,
      Correo: student.Correo,
      NombreEscuela: student.NombreEscuela,
    };

    const paymentData = {
      MesPagado: mesPagado,
      Monto: 0,
      SaldoPendiente: 0,
      FechaHora: new Date().toISOString(),
      NumeroRecibo: "",
    };

    console.log("📦 Datos preparados para sendEmail:", {
      tipoPlantilla: "CORREO RECORDATORIO",
      alumnoData,
      paymentData,
    });

    // Enviar recordatorio automáticamente
    sendEmail(
      {
        tipoPlantilla: "CORREO RECORDATORIO",
        alumnoData,
        paymentData,
      },
      {
        onSuccess: () => {
          console.log("✅ Recordatorio enviado exitosamente");
          toast.success("Recordatorio enviado exitosamente");
        },
        onError: (error) => {
          console.error("❌ Error enviando recordatorio:", error);
          toast.error(
            "Error al enviar recordatorio: " +
              (error?.message || "Error desconocido")
          );
        },
      }
    );
  }

  // Funciones de email eliminadas - ahora se envían automáticamente

  if (isLoadingBancos) return <ModalContent>Cargando...</ModalContent>;

  return (
    <ModalContent>
      <Title>{pagoEdit ? "Editando Pago" : "Registrar Pago"}</Title>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>No. Recibo:</Label>
          <Value>{form.NumeroRecibo}</Value>
        </Field>
        <Field>
          <Label>Alumno:</Label>
          <Value>
            {`${student.Nombre} ${student.ApellidoPaterno} ${
              student.ApellidoMaterno || ""
            }`.trim()}
          </Value>
        </Field>
        <Field>
          <Label>No. Control:</Label>
          <Value>{form.NumeroControl}</Value>
        </Field>
        <Field>
          <Label>Descripción:</Label>
          <Value>{form.MesPagado}</Value>
        </Field>
        <Field>
          <Label>Fecha/Hora:</Label>
          <Value>{fechaHumana}</Value>
        </Field>
        <Field>
          <Checkbox
            type="checkbox"
            name="PagoNulo"
            checked={form.PagoNulo}
            onChange={handleChange}
            aria-label="Pago nulo"
          />
          <Label htmlFor="PagoNulo">Pago nulo</Label>
        </Field>
        <Field>
          <Label>Método de pago:</Label>
          <Select
            name="MetodoPago"
            value={form.MetodoPago}
            onChange={handleChange}
            disabled={form.PagoNulo}
            aria-label="Método de pago"
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Deposito">Depósito</option>
          </Select>
        </Field>
        {form.MetodoPago === "Deposito" && (
          <Field>
            <Label>Banco:</Label>
            <Select
              name="selectedBanco"
              value={selectedBanco}
              onChange={(e) => {
                setSelectedBanco(e.target.value);
                setShowBankPreloadMessage(false); // Ocultar leyenda cuando el usuario selecciona manualmente
              }}
              disabled={form.PagoNulo}
              aria-label="Banco"
            >
              <option value="">Selecciona un banco</option>
              {bancos
                .sort((a, b) => a.NombreBanco.localeCompare(b.NombreBanco))
                .map((b) => (
                  <option key={b.IDBanco} value={b.IDBanco}>
                    {b.NombreBanco}
                  </option>
                ))}
            </Select>
            {showBankPreloadMessage &&
              selectedBanco &&
              selectedBanco === lastPaymentBankId && (
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: "var(--color-green-700)",
                    marginTop: "0.4rem",
                  }}
                >
                  ✓ Banco precargado del último pago
                </div>
              )}
          </Field>
        )}
        {/* Solo mostrar Tipo de Monto para mensualidades, no para inscripciones */}
        {mesPagado !== "Inscripcion" && (
          <Field>
            <Label>Tipo de Monto:</Label>
            <Select
              value={selectedAmountType}
              onChange={handleAmountTypeChange}
              disabled={form.PagoNulo}
              aria-label="Seleccionar tipo de monto"
            >
              <option value="">Seleccione una opción</option>
              {amountOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field>
          <Label>Monto:</Label>
          <Input
            type="number"
            name="Monto"
            value={form.Monto}
            onChange={handleChange}
            min={0}
            step={0.01}
            disabled={form.PagoNulo}
            aria-label="Monto"
          />
        </Field>
        {form.Beca && (
          <>
            <Field>
              <Label>Porcentaje Beca:</Label>
              <Value>{form.PorcentajeBeca}%</Value>
            </Field>
            <Field>
              <Label>Monto con beca:</Label>
              <Value>${Number(montoConBeca || 0).toFixed(2)}</Value>
            </Field>
            <Field>
              <Label>Cantidad beca:</Label>
              <Value>${Number(cantidadBeca || 0).toFixed(2)}</Value>
            </Field>
          </>
        )}

        <Field>
          <Checkbox
            type="checkbox"
            name="Liquidado"
            checked={form.Liquidado}
            onChange={handleChange}
            aria-label="Liquidado"
          />
          <Label htmlFor="Liquidado">Liquidado</Label>
        </Field>
        <Field>
          <Checkbox
            type="checkbox"
            name="Abono"
            checked={form.Abono}
            onChange={handleChange}
            aria-label="Abono"
          />
          <Label htmlFor="Abono">Abono</Label>
        </Field>
        <Field>
          <Label>Nota:</Label>
          <Input
            type="text"
            name="Nota"
            value={form.Nota}
            onChange={handleChange}
            aria-label="Nota"
          />
        </Field>
        <Footer>
          <Button
            type="button"
            variation="secondary"
            onClick={onCloseModal}
            disabled={isWorking}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variation="danger"
            onClick={handleOpenRecordatorio}
            disabled={isWorking || !student.Correo}
            title={
              !student.Correo ? "El alumno no tiene correo registrado" : ""
            }
          >
            {isSending ? "Enviando..." : "Enviar recordatorio"}
          </Button>
          <Button type="submit" variation="primary" disabled={isWorking}>
            {isWorking ? "Guardando..." : "Guardar"}
          </Button>
        </Footer>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </form>

      {/* Modal de confirmación se renderiza fuera del modal principal */}
    </ModalContent>
  );
}

export default NewPaymentModal;
