import { useEffect, useState } from "react";
import styled from "styled-components";
import Button from "../../ui/Button";
import {
  getBancos,
  getNextNumeroRecibo,
  createPago,
} from "../../services/apiPayments";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import supabase from "../../services/supabase";

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
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    NumeroRecibo: "",
    NumeroControl: student.NumeroControl,
    MesPagado: mesPagado,
    FechaHora: "",
    MetodoPago: "Efectivo",
    IDBanco: "",
    Monto: 0,
    Nota: "",
    Notificado: false,
    Liquidado: true,
    Beca: student.Beca || false,
    PorcentajeBeca: student.PorcentajeBeca || 0,
    CantidadBeca: 0,
    PagoNulo: false,
  });
  const [montoConBeca, setMontoConBeca] = useState(0);
  const [cantidadBeca, setCantidadBeca] = useState(0);
  const [error, setError] = useState("");
  const [showRecordatorioModal, setShowRecordatorioModal] = useState(false);
  const [correoEditado, setCorreoEditado] = useState("");

  // Generar número de recibo y cargar bancos
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const bancosData = await getBancos();
        setBancos(bancosData);
        if (pagoEdit) {
          setForm({
            ...form,
            ...pagoEdit,
            NumeroRecibo: pagoEdit.NumeroRecibo,
            NumeroControl: pagoEdit.NumeroControl,
            MesPagado: pagoEdit.MesPagado,
            FechaHora: pagoEdit.FechaHora,
            MetodoPago: pagoEdit.MetodoPago,
            IDBanco: pagoEdit.IDBanco || "",
            Monto: pagoEdit.Monto,
            Nota: pagoEdit.Nota,
            Notificado: pagoEdit.Notificado,
            Liquidado: pagoEdit.Liquidado,
            Beca: pagoEdit.Beca,
            PorcentajeBeca: pagoEdit.PorcentajeBeca,
            CantidadBeca: pagoEdit.CantidadBeca,
            PagoNulo: pagoEdit.PagoNulo || false,
          });
          setLoading(false);
          return;
        }
        const now = new Date();
        // Usar la hora local del usuario
        const fechaRecibo =
          now.getDate().toString().padStart(2, "0") +
          (now.getMonth() + 1).toString().padStart(2, "0") +
          now.getFullYear().toString().slice(-2);
        const numeroRecibo = await getNextNumeroRecibo(fechaRecibo);
        // Guardar la hora local en formato ISO (o puedes usar now.toLocaleString() si prefieres string local)
        const fechaHora = now.toISOString();
        setForm((f) => ({
          ...f,
          NumeroRecibo: numeroRecibo,
          FechaHora: fechaHora,
          Liquidado: true, // Por defecto marcado
        }));
      } catch (e) {
        setError("Error al inicializar el formulario");
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line
  }, []);

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
      ...(name === "PagoNulo" && checked ? { Monto: 0 } : {}),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      // Concatenar banco en Nota si es depósito
      let notaFinal = form.Nota || "";
      if (form.MetodoPago === "Deposito") {
        const bancoNombre =
          bancos.find((b) => String(b.IDBanco) === String(form.IDBanco))
            ?.NombreBanco || "";
        notaFinal = bancoNombre + (notaFinal ? " " + notaFinal : "");
      }
      // Limpiar objeto pago para enviar solo los campos válidos y tipos correctos
      const pago = {
        NumeroRecibo: form.NumeroRecibo,
        NumeroControl: form.NumeroControl,
        Monto: form.PagoNulo ? 0 : Number(montoConBeca),
        MesPagado: form.MesPagado,
        FechaHora: form.FechaHora,
        MetodoPago: form.MetodoPago,
        Nota: notaFinal,
        Notificado: !!form.Notificado,
        Liquidado: !form.PagoNulo,
        IDCurso: idCurso,
        Beca: !!form.Beca,
        CantidadBeca: Number(cantidadBeca),
        PorcentajeBeca: parseInt(form.PorcentajeBeca, 10),
      };
      if (pagoEdit) {
        // UPDATE
        const { error } = await supabase
          .from("PAGO")
          .update(pago)
          .eq("NumeroRecibo", pagoEdit.NumeroRecibo);
        if (error) throw error;
        toast.success("Pago actualizado correctamente");
      } else {
        // INSERT
        await createPago(pago);
        toast.success("Pago registrado correctamente");
      }
      if (onPagoGuardado) onPagoGuardado();
      onCloseModal();
    } catch (err) {
      toast.error("Error al guardar el pago");
      setError("Error al guardar el pago");
    }
  }

  async function handleOpenRecordatorio() {
    // Simular fetch de plantilla de correo (reemplazar por fetch real a PLANTILLADECORREO)
    // Aquí deberías hacer un fetch a la tabla PLANTILLADECORREO filtrando por tipo 'CORREO RECORDATORIO'
    // y luego reemplazar los campos {{NOMBRE}}, {{MES}}, etc. por los datos reales
    const plantilla =
      "Estimado/a {{NOMBRE}},\n\nLe recordamos que tiene un adeudo correspondiente al mes de {{MES}}.\nPor favor, realice su pago a la brevedad.\n\nSaludos,\nAdministración";
    const correo = plantilla
      .replace(
        "{{NOMBRE}}",
        `${student.Nombre} ${student.ApellidoPaterno} ${student.ApellidoMaterno}`
      )
      .replace("{{MES}}", mesPagado);
    setCorreoEditado(correo);
    setShowRecordatorioModal(true);
  }

  function handleCloseRecordatorio() {
    setShowRecordatorioModal(false);
  }

  async function handleEnviarCorreo() {
    // Aquí deberías conectar con el API de IONOS WEBMAIL
    toast.success("Correo de recordatorio enviado (simulado)");
    setShowRecordatorioModal(false);
  }

  if (loading) return <ModalContent>Cargando...</ModalContent>;

  return (
    <ModalContent>
      <Title>Registrar Pago</Title>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>No. Recibo:</Label>
          <Value>{form.NumeroRecibo}</Value>
        </Field>
        <Field>
          <Label>No. Control:</Label>
          <Value>{form.NumeroControl}</Value>
        </Field>
        <Field>
          <Label>Mes pagado:</Label>
          <Value>{form.MesPagado}</Value>
        </Field>
        <Field>
          <Label>Fecha/Hora:</Label>
          <Value>{fechaHumana}</Value>
        </Field>
        <Field>
          <Label>Método de pago:</Label>
          <Select
            name="MetodoPago"
            value={form.MetodoPago}
            onChange={handleChange}
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
              name="IDBanco"
              value={form.IDBanco}
              onChange={handleChange}
              aria-label="Banco"
            >
              <option value="">Selecciona un banco</option>
              {bancos.map((b) => (
                <option key={b.IDBanco} value={b.IDBanco}>
                  {b.NombreBanco}
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
            name="PagoNulo"
            checked={form.PagoNulo}
            onChange={handleChange}
            aria-label="Pago nulo"
          />
          <Label htmlFor="PagoNulo">Pago nulo</Label>
        </Field>
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
          <Button type="button" variation="secondary" onClick={onCloseModal}>
            Cancelar
          </Button>
          <Button
            type="button"
            variation="danger"
            onClick={handleOpenRecordatorio}
          >
            Enviar recordatorio
          </Button>
          <Button type="submit" variation="primary">
            Guardar
          </Button>
        </Footer>
        {error && <div style={{ color: "red" }}>{error}</div>}
      </form>
      {showRecordatorioModal && (
        <ModalContent
          as="div"
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            marginTop: 16,
          }}
        >
          <Title>Correo de Recordatorio</Title>
          <Field>
            <Label>Para:</Label>
            <Value>{student.Correo || "(sin correo)"}</Value>
          </Field>
          <Field>
            <Label>Mensaje:</Label>
            <textarea
              style={{ width: "100%", minHeight: 120, fontSize: 14 }}
              value={correoEditado}
              onChange={(e) => setCorreoEditado(e.target.value)}
              aria-label="Mensaje de recordatorio"
            />
          </Field>
          <Footer>
            <Button
              type="button"
              variation="secondary"
              onClick={handleCloseRecordatorio}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variation="primary"
              onClick={handleEnviarCorreo}
            >
              Enviar correo
            </Button>
          </Footer>
        </ModalContent>
      )}
    </ModalContent>
  );
}

export default NewPaymentModal;
