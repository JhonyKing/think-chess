import styled from "styled-components";
import { useState } from "react";

// Import actual components
import SchoolRegistration from "./SchoolRegistration";
import SchoolList from "./SchoolList";
import CourseManagement from "./CourseManagement"; // Use the real component

// Placeholder for CourseManagement - REMOVED
/*
const PlaceholderCourseManagement = styled.div`
  border: 1px dashed red;
  padding: 1rem;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--color-grey-50);
  border-radius: var(--border-radius-md);
`;
*/

const StyledSchoolLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr; // Adjust ratio as needed
  gap: 3rem; // Increased gap for better separation
  padding: 2rem 0; // Add some vertical padding

  /* Basic responsive behavior */
  @media (max-width: 1200px) {
    grid-template-columns: 1fr; // Stack columns on smaller screens
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

function SchoolLayout() {
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);
  // State for selected course, managed here
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  const handleSelectSchool = (schoolId) => {
    console.log("[SchoolLayout] handleSelectSchool called with ID:", schoolId);
    setSelectedSchoolId(schoolId);
    // Reset selected course when school changes
    setSelectedCourseId(null);
  };

  // Handler for selecting a course, passed down
  const handleSelectCourse = (courseId) => {
    console.log("[SchoolLayout] handleSelectCourse called with ID:", courseId);
    setSelectedCourseId(courseId);
  };

  return (
    <StyledSchoolLayout>
      <LeftColumn>
        {/* Use actual SchoolRegistration component */}
        <SchoolRegistration />

        {/* Use actual SchoolList component, passing state and handler */}
        <SchoolList
          selectedSchoolId={selectedSchoolId}
          onSelectSchool={handleSelectSchool}
        />
      </LeftColumn>

      <RightColumn>
        {/* Render CourseManagement if a school is selected */}
        {selectedSchoolId ? (
          <CourseManagement
            schoolId={selectedSchoolId}
            // Pass down course state and handler
            selectedCourseId={selectedCourseId}
            onSelectCourse={handleSelectCourse}
          />
        ) : (
          <div
            style={{
              padding: "2rem",
              backgroundColor: "var(--color-grey-100)",
              borderRadius: "var(--border-radius-md)",
              textAlign: "center",
              color: "var(--color-grey-500)",
              height: "100%", // Take full height of the column
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Selecciona una escuela de la lista para ver/gestionar sus cursos.
          </div>
        )}
      </RightColumn>
    </StyledSchoolLayout>
  );
}

export default SchoolLayout;
