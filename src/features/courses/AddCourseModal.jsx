import Modal from "../../ui/Modal";
import CreateCourseForm from "./CreateCourseForm";

function AddCourseModal({ isOpen, onClose, selectedSchoolName }) {
  // Don't render if not open or if school name is missing
  if (!isOpen || !selectedSchoolName) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CreateCourseForm
        selectedSchoolName={selectedSchoolName}
        onCloseModal={onClose}
      />
    </Modal>
  );
}

export default AddCourseModal;
