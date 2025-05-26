import styled from "styled-components";
import Heading from "../../ui/Heading";

const ActivitiesContainer = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  padding: 2.4rem;
  margin-top: 1.6rem; /* Consistent margin */
`;

function CourseActivities({ selectedCourseId, selectedSchoolName }) {
  // In the future, fetch and display actual activities here
  // based on selectedCourseId and selectedSchoolName

  return (
    <ActivitiesContainer>
      <Heading as="h2">Información de Actividades</Heading>
      <p style={{ marginTop: "1rem" }}>
        <strong>Escuela:</strong> {selectedSchoolName} <br />
        <strong>Curso ID:</strong> {selectedCourseId}
      </p>
      {/* Placeholder for future content */}
    </ActivitiesContainer>
  );
}

export default CourseActivities;
