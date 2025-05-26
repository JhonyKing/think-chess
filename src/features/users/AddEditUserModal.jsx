import Modal from "../../ui/Modal";
import CreateEditUserForm from "./CreateEditUserForm";

/**
 * Renders a modal containing the form to add or edit a user.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Function to call when the modal should be closed.
 * @param {object} [props.userToEdit] - The user object to edit (if editing).
 */
function AddEditUserModal({ isOpen, onClose, userToEdit }) {
  // If the modal is not open, render nothing.
  if (!isOpen) return null;

  // Determine the title based on whether we are editing or adding
  const modalTitle = userToEdit ? "Editar Usuario" : "Agregar Nuevo Usuario";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      {/* Pass userToEdit and onClose to the form */}
      <CreateEditUserForm
        userToEdit={userToEdit}
        onCloseModal={onClose} // Pass onClose to the form to close the modal on success/cancel
      />
    </Modal>
  );
}

export default AddEditUserModal;
