import styled from "styled-components";
import Button from "./Button";
import { useState } from "react";

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
  color: var(--color-grey-900);
`;

const Message = styled.p`
  font-size: 1.6rem;
  text-align: center;
  margin-bottom: 2.4rem;
  color: var(--color-grey-700);
  line-height: 1.5;
`;

const EmailInfo = styled.div`
  background: var(--color-grey-50);
  border-radius: 0.8rem;
  padding: 1.6rem;
  margin-bottom: 2.4rem;
  border-left: 4px solid var(--color-brand-600);
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: var(--color-grey-700);
  margin-right: 0.8rem;
`;

const InfoValue = styled.span`
  color: var(--color-grey-900);
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 2.4rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem 1.2rem;
  border-radius: 0.4rem;
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
  margin-bottom: 1.6rem;
`;

/**
 * Modal de confirmación para envío de correos electrónicos
 */
function EmailConfirmationModal({
  onCloseModal,
  onConfirm,
  studentData,
  paymentData,
  emailType = "single", // "single", "reminder", "welcome"
  isLoading = false,
}) {
  const [selectedReminderType, setSelectedReminderType] = useState(
    "CORREO RECORDATORIO"
  );

  // Configurar contenido según el tipo de correo
  const getModalContent = () => {
    switch (emailType) {
      case "payment-complete":
        return {
          title: "¿Enviar Correo de Agradecimiento?",
          message:
            "¿Deseas enviar un correo de agradecimiento por el pago completo realizado?",
          templateType: "CORREO AGRADECIMIENTO",
          showSelector: false,
        };

      case "payment-partial":
        return {
          title: "¿Enviar Correo de Abono?",
          message:
            "¿Deseas enviar un correo de recordatorio del abono realizado?",
          templateType: "CORREO ABONO",
          showSelector: false,
        };

      case "reminder":
        return {
          title: "¿Enviar Recordatorio?",
          message: "Selecciona el tipo de recordatorio que deseas enviar:",
          templateType: selectedReminderType,
          showSelector: true,
          selectorOptions: [
            { value: "CORREO RECORDATORIO", label: "Recordatorio Normal" },
            {
              value: "CORREO RECORDATORIO VENCIDO",
              label: "Recordatorio Vencido",
            },
            { value: "CORREO DISCULPAS", label: "Correo de Disculpas" },
          ],
        };

      case "mass-reminder":
        return {
          title: "¿Enviar Recordatorios Masivos?",
          message:
            "Selecciona el tipo de recordatorio para enviar a todos los alumnos con adeudo:",
          templateType: selectedReminderType,
          showSelector: true,
          selectorOptions: [
            { value: "CORREO RECORDATORIO", label: "Recordatorio Normal" },
            {
              value: "CORREO RECORDATORIO VENCIDO",
              label: "Recordatorio Vencido",
            },
          ],
        };

      case "welcome":
        return {
          title: "¿Enviar Correo de Bienvenida?",
          message:
            "¿Deseas enviar un correo de bienvenida al nuevo alumno registrado?",
          templateType: "CORREO BIENVENIDA",
          showSelector: false,
        };

      default:
        return {
          title: "¿Enviar Correo?",
          message: "¿Confirmas el envío del correo electrónico?",
          templateType: "CORREO RECORDATORIO",
          showSelector: false,
        };
    }
  };

  const modalContent = getModalContent();

  const handleConfirm = () => {
    onConfirm(modalContent.templateType);
  };

  return (
    <ModalContent>
      <Title>{modalContent.title}</Title>

      <Message>{modalContent.message}</Message>

      {modalContent.showSelector && (
        <Select
          value={selectedReminderType}
          onChange={(e) => setSelectedReminderType(e.target.value)}
          disabled={isLoading}
          aria-label="Seleccionar tipo de recordatorio"
        >
          {modalContent.selectorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}

      {studentData && (
        <EmailInfo>
          <div style={{ marginBottom: "0.8rem" }}>
            <InfoLabel>Destinatario:</InfoLabel>
            <InfoValue>
              {studentData.Nombre} {studentData.ApellidoPaterno}{" "}
              {studentData.ApellidoMaterno}
            </InfoValue>
          </div>
          <div style={{ marginBottom: "0.8rem" }}>
            <InfoLabel>Correo:</InfoLabel>
            <InfoValue>{studentData.Correo}</InfoValue>
          </div>
          <div style={{ marginBottom: "0.8rem" }}>
            <InfoLabel>No. Control:</InfoLabel>
            <InfoValue>{studentData.NumeroControl}</InfoValue>
          </div>
          {paymentData && (
            <>
              <div style={{ marginBottom: "0.8rem" }}>
                <InfoLabel>Concepto:</InfoLabel>
                <InfoValue>{paymentData.MesPagado}</InfoValue>
              </div>
              {paymentData.Monto && (
                <div>
                  <InfoLabel>Monto:</InfoLabel>
                  <InfoValue>${Number(paymentData.Monto).toFixed(2)}</InfoValue>
                </div>
              )}
            </>
          )}
        </EmailInfo>
      )}

      <Footer>
        <Button
          type="button"
          variation="secondary"
          onClick={onCloseModal}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variation="primary"
          onClick={handleConfirm}
          disabled={isLoading || !studentData?.Correo}
        >
          {isLoading ? "Enviando..." : "Enviar Correo"}
        </Button>
      </Footer>
    </ModalContent>
  );
}

export default EmailConfirmationModal;


