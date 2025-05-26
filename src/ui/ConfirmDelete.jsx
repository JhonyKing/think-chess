import styled from "styled-components";
import Button from "./Button";
import Heading from "./Heading";

const StyledConfirmDelete = styled.div`
  width: 40rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;

  & p {
    color: var(--color-grey-500);
    margin-bottom: 1.2rem;
  }

  & div {
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
  }
`;

/**
 * A reusable confirmation dialog for delete operations.
 *
 * @param {object} props
 * @param {string} props.resourceName - The name of the resource being deleted (e.g., "usuario PiensaAncira").
 * @param {function} props.onConfirm - Function to call when deletion is confirmed.
 * @param {boolean} props.disabled - Whether the confirm button should be disabled (e.g., during mutation).
 * @param {function} [props.onCloseModal] - Function to call to close the modal (optional, typically passed by Modal.Window).
 */
function ConfirmDelete({ resourceName, onConfirm, disabled, onCloseModal }) {
  const handleConfirm = () => {
    onConfirm();
    // No need to call onCloseModal here usually, as Modal.Window handles closing
    // However, if onConfirm is async and you want to close *after* success,
    // the mutation hook's onSuccess should handle closing.
  };

  return (
    <StyledConfirmDelete>
      <Heading as="h3">Eliminar {resourceName}</Heading>
      <p>
        ¿Seguro que desea borrar este registro ({resourceName})? Esta acción es
        irreversible.
      </p>

      <div>
        <Button
          variation="secondary"
          disabled={disabled}
          onClick={onCloseModal} // Use onCloseModal passed by Modal.Window for cancel
        >
          Cancelar
        </Button>
        <Button variation="danger" disabled={disabled} onClick={handleConfirm}>
          Eliminar
        </Button>
      </div>
    </StyledConfirmDelete>
  );
}

export default ConfirmDelete;
