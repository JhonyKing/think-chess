import styled, { css } from "styled-components";

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
}) {
  // Permitir pasar el status como prop para control externo
  let status = statusProp || "NP";
  if (!statusProp) {
    if (payment) {
      if (payment.Monto === 0) status = "NA";
      else if (payment.Liquidado) status = "PA";
      else status = "AB";
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
