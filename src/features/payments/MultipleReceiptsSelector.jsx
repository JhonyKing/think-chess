import styled from "styled-components";
import { useState } from "react";
import { usePaymentsByStudentAndMonth } from "./usePayments";

const SelectorContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MainButton = styled.button`
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
  position: relative;

  /* Colores según el estado - igual que PaymentStatusButton */
  background: ${({ status }) => {
    if (status === "PA") return "#43a047"; // Verde para pagado
    if (status === "AB") return "#fb8c00"; // Naranja para abono
    if (status === "NA") return "#222"; // Negro para no aplica
    return "#e53935"; // Rojo para no pagado
  }};

  &::after {
    content: ${({ hasMultiple }) => (hasMultiple ? '"▼"' : '""')};
    position: absolute;
    top: -2px;
    right: 1px;
    font-size: 0.8rem;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0.4rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.8rem 1.2rem;
  border: none;
  background: white;
  text-align: left;
  cursor: pointer;
  font-size: 1.2rem;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ReceiptInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const ReceiptNumber = styled.span`
  font-weight: 600;
  color: #333;
`;

const ReceiptDetails = styled.span`
  font-size: 1rem;
  color: #666;
`;

function MultipleReceiptsSelector({
  numeroControl,
  mesPagado,
  idCurso,
  latestPayment,
  onShowReceipt,
  onShowAbono,
  onShowNuevoPago,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { payments, isLoading } = usePaymentsByStudentAndMonth(
    numeroControl,
    mesPagado,
    idCurso
  );

  if (isLoading) {
    return <MainButton disabled>...</MainButton>;
  }

  const hasMultiplePayments = payments && payments.length > 1;

  function handleMainClick() {
    if (hasMultiplePayments) {
      setShowDropdown(!showDropdown);
    } else {
      // Comportamiento normal para un solo recibo
      if (latestPayment) {
        if (latestPayment.Liquidado) {
          onShowReceipt && onShowReceipt(latestPayment);
        } else {
          onShowAbono && onShowAbono(latestPayment);
        }
      } else {
        onShowNuevoPago && onShowNuevoPago();
      }
    }
  }

  function handleReceiptClick(payment) {
    setShowDropdown(false);
    if (payment.Liquidado) {
      onShowReceipt && onShowReceipt(payment);
    } else {
      onShowAbono && onShowAbono(payment);
    }
  }

  function formatFecha(fechaHora) {
    try {
      const fecha = new Date(fechaHora);
      return fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return fechaHora;
    }
  }

  // Determinar el estado del botón principal
  let status = "NP";
  if (latestPayment) {
    if (latestPayment.Monto === 0) status = "NA";
    else if (latestPayment.Liquidado) status = "PA"; // Verde si está liquidado
    else status = "AB"; // Naranja si no está liquidado
  }

  return (
    <SelectorContainer>
      <MainButton
        status={status}
        hasMultiple={hasMultiplePayments}
        onClick={handleMainClick}
        aria-label={
          hasMultiplePayments ? "Ver recibos múltiples" : "Ver recibo"
        }
      >
        {status}
      </MainButton>

      {showDropdown && hasMultiplePayments && (
        <DropdownMenu>
          {payments.map((payment, index) => (
            <DropdownItem
              key={payment.NumeroRecibo}
              onClick={() => handleReceiptClick(payment)}
            >
              <ReceiptInfo>
                <ReceiptNumber>Recibo #{payment.NumeroRecibo}</ReceiptNumber>
                <ReceiptDetails>
                  ${payment.Monto} - {formatFecha(payment.FechaHora)}
                </ReceiptDetails>
                <ReceiptDetails>
                  {payment.Liquidado ? "✅ Liquidado" : "🔸 Abono"}
                  {index === 0 && " (Más reciente)"}
                </ReceiptDetails>
              </ReceiptInfo>
            </DropdownItem>
          ))}

          <DropdownItem
            onClick={() => {
              setShowDropdown(false);
              onShowNuevoPago && onShowNuevoPago();
            }}
          >
            <ReceiptInfo>
              <ReceiptNumber>+ Nuevo Abono</ReceiptNumber>
              <ReceiptDetails>
                Registrar nuevo pago para este mes
              </ReceiptDetails>
            </ReceiptInfo>
          </DropdownItem>
        </DropdownMenu>
      )}

      {showDropdown && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </SelectorContainer>
  );
}

export default MultipleReceiptsSelector;
