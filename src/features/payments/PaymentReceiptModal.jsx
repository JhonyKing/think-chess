import styled from "styled-components";
import Button from "../../ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { deletePago } from "../../services/apiPayments";

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

const Label = styled.span`
  font-weight: 600;
  color: var(--color-grey-700);
  margin-right: 0.6rem;
`;

const Value = styled.span`
  color: var(--color-grey-900);
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2.4rem;
`;

function PaymentReceiptModal({
  payment,
  showNuevoAbonoButton,
  onNuevoAbono,
  onEdit,
  onDeleted,
  onCloseModal,
  tipoCorreo = "agradecimiento",
  onSendCorreo,
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showCorreoModal, setShowCorreoModal] = useState(false);
  const [showDisculpasModal, setShowDisculpasModal] = useState(false);
  const [correoEditado, setCorreoEditado] = useState("");
  const [enviandoCorreo, setEnviandoCorreo] = useState(false);

  if (!payment) return null;
  // Formatear la fecha de forma humana en español
  let fechaFormateada = "-";
  if (payment.FechaHora) {
    try {
      fechaFormateada = format(
        new Date(payment.FechaHora),
        "EEEE, d 'de' MMMM 'de' yyyy, HH:mm",
        { locale: es }
      );
      // Capitalizar el primer carácter (por si viene en minúscula)
      fechaFormateada =
        fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    } catch (e) {
      fechaFormateada = payment.FechaHora;
    }
  }

  // Plantillas simuladas (reemplazar por fetch real a PLANTILLADECORREO)
  const plantillas = {
    agradecimiento:
      "Estimado/a {{NOMBRE}},\n\nGracias por su pago correspondiente al mes de {{MES}}.\n\nSaludos,\nAdministración",
    abono:
      "Estimado/a {{NOMBRE}},\n\nSe ha registrado un abono de ${{MONTO}} para el mes de {{MES}}.\nSaldo pendiente: ${{SALDO}}.\n\nSaludos,\nAdministración",
    disculpas:
      "Estimado/a {{NOMBRE}},\n\nLe informamos que el recibo de pago ha sido cancelado.\nSi tiene dudas, contáctenos.\n\nSaludos,\nAdministración",
  };

  function handleEdit() {
    if (onEdit) onEdit(payment);
  }
  function handleDelete() {
    setShowConfirmDelete(true);
  }
  async function handleConfirmDelete() {
    try {
      await deletePago(payment.NumeroRecibo);
      toast.success("Recibo eliminado");
      setShowConfirmDelete(false);
      // Mostrar modal para preguntar si desea enviar correo de disculpas
      setTimeout(() => {
        setShowDisculpasModal(true);
      }, 100);
    } catch (e) {
      toast.error("Error al eliminar el recibo");
      setShowConfirmDelete(false);
    }
  }

  function handleEnviarDisculpas() {
    setShowDisculpasModal(false);
    handleOpenCorreo("disculpas");
  }

  function handleNoEnviarDisculpas() {
    setShowDisculpasModal(false);
    if (onDeleted) onDeleted();
    if (onCloseModal) onCloseModal();
  }
  function handleOpenCorreo(tipo) {
    let plantilla = plantillas[tipo || tipoCorreo] || "";
    let correo = plantilla
      .replace("{{NOMBRE}}", payment.NombreAlumno || payment.NumeroControl)
      .replace("{{MES}}", payment.MesPagado)
      .replace("{{MONTO}}", payment.Monto?.toFixed(2) || "0.00")
      .replace("{{SALDO}}", payment.SaldoPendiente?.toFixed(2) || "0.00");
    setCorreoEditado(correo);
    setShowCorreoModal(true);
  }
  async function handleSendCorreo() {
    setEnviandoCorreo(true);
    // Aquí deberías conectar con el API de IONOS WEBMAIL
    toast.success("Correo enviado (simulado)");
    setShowCorreoModal(false);
    setEnviandoCorreo(false);
    if (onDeleted) onDeleted();
    if (onSendCorreo) onSendCorreo();
    if (onCloseModal) onCloseModal();
  }
  function handleCloseCorreo() {
    setShowCorreoModal(false);
    if (onDeleted) onDeleted();
    if (onCloseModal) onCloseModal();
  }
  return (
    <ModalContent>
      <Title>Recibo de Pago</Title>
      <Field>
        <Label>No. Recibo:</Label> <Value>{payment.NumeroRecibo || "-"}</Value>
      </Field>
      <Field>
        <Label>No. Control:</Label>{" "}
        <Value>{payment.NumeroControl || "-"}</Value>
      </Field>
      <Field>
        <Label>Monto:</Label> <Value>${payment.Monto?.toFixed(2) || "-"}</Value>
      </Field>
      <Field>
        <Label>Descripción:</Label> <Value>{payment.MesPagado || "-"}</Value>
      </Field>
      <Field>
        <Label>Fecha/Hora:</Label> <Value>{fechaFormateada}</Value>
      </Field>
      <Field>
        <Label>Método de Pago:</Label>{" "}
        <Value>{payment.MetodoPago || "-"}</Value>
      </Field>
      <Field>
        <Label>Nota:</Label> <Value>{payment.Nota || "-"}</Value>
      </Field>
      <Field>
        <Label>Notificado:</Label>{" "}
        <Value>{payment.Notificado ? "Sí" : "No"}</Value>
      </Field>
      <Field>
        <Label>Liquidado:</Label>{" "}
        <Value>{payment.Liquidado ? "Sí" : "No"}</Value>
      </Field>
      <Field>
        <Label>ID Curso:</Label> <Value>{payment.IDCurso || "-"}</Value>
      </Field>
      {payment.Beca && (
        <>
          <Field>
            <Label>Beca:</Label> <Value>{payment.Beca ? "Sí" : "No"}</Value>
          </Field>
          <Field>
            <Label>Cantidad Beca:</Label>{" "}
            <Value>${Number(payment.CantidadBeca || 0).toFixed(2)}</Value>
          </Field>
          <Field>
            <Label>Porcentaje Beca:</Label>{" "}
            <Value>{Number(payment.PorcentajeBeca || 0)}%</Value>
          </Field>
        </>
      )}
      <Footer>
        {showNuevoAbonoButton && (
          <Button variation="secondary" onClick={onNuevoAbono}>
            Nuevo Abono
          </Button>
        )}
        <Button variation="primary" onClick={handleEdit}>
          Editar recibo
        </Button>
        <Button variation="danger" onClick={handleDelete}>
          Cancelar recibo
        </Button>
        <Button
          variation="secondary"
          onClick={() => handleOpenCorreo(tipoCorreo)}
        >
          {tipoCorreo === "agradecimiento"
            ? "Enviar correo de agradecimiento"
            : tipoCorreo === "abono"
            ? "Enviar correo abono"
            : "Enviar correo"}
        </Button>
      </Footer>
      {showConfirmDelete && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "2rem",
            marginTop: 16,
          }}
        >
          <Title>¿Seguro que deseas cancelar este recibo?</Title>
          <Footer>
            <Button
              variation="secondary"
              onClick={() => setShowConfirmDelete(false)}
            >
              No
            </Button>
            <Button variation="danger" onClick={handleConfirmDelete}>
              Sí, cancelar recibo
            </Button>
          </Footer>
        </div>
      )}
      {showCorreoModal && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "2rem",
            marginTop: 16,
          }}
        >
          <Title>Correo</Title>
          <Field>
            <Label>Para:</Label>
            <Value>
              {payment.Correo || payment.CorreoAlumno || "(sin correo)"}
            </Value>
          </Field>
          <Field>
            <Label>Mensaje:</Label>
            <textarea
              style={{ width: "100%", minHeight: 120, fontSize: 14 }}
              value={correoEditado}
              onChange={(e) => setCorreoEditado(e.target.value)}
              aria-label="Mensaje de correo"
            />
          </Field>
          <Footer>
            <Button
              type="button"
              variation="secondary"
              onClick={handleCloseCorreo}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variation="primary"
              onClick={handleSendCorreo}
              disabled={enviandoCorreo}
            >
              {enviandoCorreo ? "Enviando..." : "Enviar correo"}
            </Button>
          </Footer>
        </div>
      )}
      {showDisculpasModal && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: "2rem",
            marginTop: 16,
          }}
        >
          <Title>¿Desea enviar un correo de disculpas al alumno?</Title>
          <Footer>
            <Button
              type="button"
              variation="secondary"
              onClick={handleNoEnviarDisculpas}
            >
              No, cancelar
            </Button>
            <Button
              type="button"
              variation="primary"
              onClick={handleEnviarDisculpas}
            >
              Sí, enviar correo de disculpas
            </Button>
          </Footer>
        </div>
      )}
    </ModalContent>
  );
}

export default PaymentReceiptModal;
