import Modal from "../../ui/Modal";
import CreateEditSchoolForm from "./CreateEditSchoolForm";

/**
 * Renders a modal containing the form to add or edit a school.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.onClose - Function to call when the modal should be closed.
 * @param {object} [props.schoolToEdit] - The school object to edit (if editing).
 */
function AddEditSchoolModal({ isOpen, onClose, schoolToEdit }) {
  // If the modal is not open, render nothing.
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Pass schoolToEdit and onClose to the form */}
      <CreateEditSchoolForm
        schoolToEdit={schoolToEdit}
        onCloseModal={onClose}
      />
      {/* Set the modal title dynamically */}
      {/* This assumes the Modal component can accept a title prop or render children as title */}
      {/* If Modal doesn't support title prop directly, adjust as needed */}
      {/* <Modal.Title>{title}</Modal.Title> */}
    </Modal>
  );
}

export default AddEditSchoolModal;
