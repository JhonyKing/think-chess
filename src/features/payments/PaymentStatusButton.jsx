import styled, { css } from "styled-components";
import { usePaymentsByStudentAndMonth } from "./usePayments";
import MultipleReceiptsSelector from "./MultipleReceiptsSelector";

const Button = styled.button`
  width: 4rem;
  height: 2.8rem;
  border: none;
  border-radius: 0.4rem;
  font-weight: 700;
  font-size: 1.3rem;
  color: #fff;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ status }) =>
    status === "NP" &&
    css`
      background: #e53935;
    `}
  ${({ status }) =>
    status === "PA" &&
    css`
      background: #43a047;
    `}
  ${({ status }) =>
    status === "AB" &&
    css`
      background: #fb8c00;
    `}
  ${({ status }) =>
    status === "NA" &&
    css`
      background: #222;
    `}
`;

function PaymentStatusButton({
  payment,
  onShowReceipt,
  onShowAbono,
  onShowNoAplica,
  onShowNuevoPago,
  status: statusProp,
  numeroControl, // Para buscar múltiples pagos
  mesPagado, // Para buscar múltiples pagos
  idCurso, // CRÍTICO: Para filtrar por mismo curso
}) {
  // Obtener múltiples pagos si se proporcionan numeroControl, mesPagado e idCurso
  const { payments } = usePaymentsByStudentAndMonth(
    numeroControl,
    mesPagado,
    idCurso
  );

  // Si hay múltiples pagos para este mes, SIEMPRE usar el selector especial
  // para permitir ver todos los recibos, sin importar si está liquidado o no
  if (
    payments &&
    payments.length > 1 &&
    numeroControl &&
    mesPagado &&
    idCurso
  ) {
    return (
      <MultipleReceiptsSelector
        numeroControl={numeroControl}
        mesPagado={mesPagado}
        idCurso={idCurso}
        latestPayment={payment}
        onShowReceipt={onShowReceipt}
        onShowAbono={onShowAbono}
        onShowNuevoPago={onShowNuevoPago}
      />
    );
  }

  // Comportamiento normal para un solo pago o sin datos de contexto
  let status = statusProp || "NP";
  if (!statusProp) {
    if (payment) {
      if (payment.Monto === 0) status = "NA";
      else if (payment.Liquidado) status = "PA"; // Verde si está liquidado
      else status = "AB"; // Naranja si no está liquidado
    }
  }

  const labelMap = {
    NP: "No pagado",
    PA: "Pagado",
    AB: "Abono",
    NA: "No aplica",
  };

  function handleClick() {
    if (status === "PA" && onShowReceipt && payment) {
      onShowReceipt(payment);
    } else if (status === "AB" && onShowAbono && payment) {
      onShowAbono(payment);
    } else if (status === "NA" && onShowNoAplica && payment) {
      onShowNoAplica(payment);
    } else if (status === "NP" && onShowNuevoPago) {
      onShowNuevoPago();
    }
  }

  return (
    <Button
      status={status}
      aria-label={labelMap[status]}
      tabIndex={0}
      onClick={handleClick}
    >
      {status}
    </Button>
  );
}

export default PaymentStatusButton;
