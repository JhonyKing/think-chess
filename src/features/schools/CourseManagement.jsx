import styled from "styled-components";
// import { useState } from "react";
import CourseCreator from "./CourseCreator";
import CourseList from "./CourseList";
import ActivityManager from "./ActivityManager";
// import ActivityManager from "./ActivityManager";

const StyledCourseManagement = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  background-color: var(--color-grey-50); // Slightly different background
  padding: 2.4rem;
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-grey-100);
`;

// Receive selectedCourseId and onSelectCourse as props
function CourseManagement({ schoolId, selectedCourseId, onSelectCourse }) {
  // Remove local state for selectedCourseId
  // const [selectedCourseId, setSelectedCourseId] = useState(null);

  if (!schoolId) return null; // Don't render if no school is selected

  // Remove local handler, use the one passed from props
  /*
  const handleSelectCourse = (id) => {
    setSelectedCourseId(id);
  };
  */

  return (
    <StyledCourseManagement>
      {/* Course Creation Form */}
      <CourseCreator schoolId={schoolId} />

      {/* Course List - Use actual component */}
      <CourseList
        schoolId={schoolId}
        selectedCourseId={selectedCourseId}
        onSelectCourse={onSelectCourse}
      />

      {/* Activity Manager - Use actual component */}
      {/* Render only if a course is selected */}
      {selectedCourseId && <ActivityManager courseId={selectedCourseId} />}

      {/* Placeholder for Activity Manager - REMOVED */}
      {/* 
      <div>
        <h4>Actividades del Curso Seleccionado</h4>
        {selectedCourseId ? (
          <p>
            Gestor de actividades para el curso {selectedCourseId} aparecerá
            aquí...
          </p>
        ) : (
          <p>
            Selecciona un curso de la lista para ver/gestionar sus actividades.
          </p>
        )}
      </div>
      */}
    </StyledCourseManagement>
  );
}

export default CourseManagement;
