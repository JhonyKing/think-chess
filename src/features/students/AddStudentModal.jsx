import Modal from "../../ui/Modal";
import CreateStudentForm from "./CreateStudentForm";
import styled from "styled-components";

const StyledModal = styled(Modal)`
  max-width: 90rem;
  width: 100%;
`;

const Title = styled.h2`
  font-size: 2.4rem;
  font-weight: 600;
  margin-bottom: 5rem;
`;

function AddStudentModal({
  isOpen,
  onClose,
  studentToEdit,
  generatedNumeroControl,
}) {
  if (!isOpen) return null;

  return (
    <StyledModal onClose={onClose}>
      <Title>
        {studentToEdit ? "Editar Estudiante" : "Agregar Nuevo Estudiante"}
      </Title>
      <CreateStudentForm
        studentToEdit={studentToEdit}
        onCloseModal={onClose}
        generatedNumeroControl={generatedNumeroControl}
      />
    </StyledModal>
  );
}

export default AddStudentModal;
