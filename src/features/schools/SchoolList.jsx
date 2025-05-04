import { useQuery, useMutation } from "@tanstack/react-query";
import styled, { css } from "styled-components";
import { useState, useEffect, useRef } from "react";
import { getSchools } from "../../services/apiSchools";
import { deactivateStudentsBySchool } from "../../services/apiStudents";
import Spinner from "../../ui/Spinner";
import Heading from "../../ui/Heading";
import Empty from "../../ui/Empty";
import toast from "react-hot-toast";
import SpinnerMini from "../../ui/SpinnerMini";

// Basic List container styling
const ListContainer = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 400px; // Example max height
  overflow-y: auto;
`;

const ListItem = styled.div`
  padding: 1rem 1.6rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s;
  font-weight: 500;

  &:hover {
    background-color: var(--color-grey-50);
  }

  ${(props) =>
    props.$isSelected &&
    css`
      background-color: var(--color-brand-600) !important;
      color: var(--color-brand-50);
    `}
`;

const StyledSchoolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

// NOTE: For now, this component only shows all schools.
// Logic to separate active/inactive will be added later.
function SchoolList({ selectedSchoolId, onSelectSchool }) {
  const {
    isLoading,
    data: schoolsWithCourses,
    error,
  } = useQuery({
    queryKey: ["schoolsWithCourses"],
    queryFn: getSchools,
  });

  const [previousActiveSchoolNames, setPreviousActiveSchoolNames] = useState(
    new Set()
  );
  const isInitialLoad = useRef(true);

  const { mutate: deactivateStudents, isLoading: isDeactivatingStudents } =
    useMutation({
      mutationFn: deactivateStudentsBySchool,
      onSuccess: () => {
        console.log("Student deactivation process finished for a school.");
      },
      onError: (err) => {
        toast.error(err.message || `Error desactivando alumnos.`);
      },
    });

  // --- Logic to separate schools (used for rendering below) ---
  const activeSchools = [];
  const inactiveSchools = [];
  if (schoolsWithCourses) {
    schoolsWithCourses.forEach((school) => {
      const hasActiveCourse = school.CURSO?.some((course) => course.Activo);
      if (hasActiveCourse) {
        activeSchools.push(school);
      } else {
        inactiveSchools.push(school);
      }
    });
  }
  // -----------------------------------------------------------

  // --- Effect to deactivate students when a school becomes inactive ---
  useEffect(() => {
    if (isLoading || !schoolsWithCourses) return;

    // Calculate current active schools INSIDE the effect
    const currentActiveSchoolNames = new Set();
    schoolsWithCourses.forEach((school) => {
      if (school.CURSO?.some((course) => course.Activo)) {
        currentActiveSchoolNames.add(school.NombreEscuela);
      }
    });

    if (isInitialLoad.current) {
      setPreviousActiveSchoolNames(currentActiveSchoolNames);
      isInitialLoad.current = false;
      return;
    }

    // Compare and trigger mutation
    previousActiveSchoolNames.forEach((schoolName) => {
      if (!currentActiveSchoolNames.has(schoolName)) {
        console.log(
          `School ${schoolName} became inactive, deactivating students...`
        );
        deactivateStudents(schoolName);
      }
    });

    // Update the previous state
    setPreviousActiveSchoolNames(currentActiveSchoolNames);

    // Corrected Dependencies: Remove previousActiveSchoolNames
  }, [schoolsWithCourses, isLoading, deactivateStudents]);
  // ------------------------------------------------------------------

  if (isLoading) return <Spinner />;
  if (error) return <p>Error: {error.message}</p>;
  if (activeSchools.length === 0 && inactiveSchools.length === 0)
    return <Empty resourceName="escuelas" />;

  const renderSchoolList = (title, schoolArray) => (
    <div>
      <Heading as="h2" style={{ marginBottom: "1rem" }}>
        {title}
      </Heading>
      {schoolArray.length === 0 ? (
        <Empty resourceName="escuelas" />
      ) : (
        <ListContainer>
          {schoolArray.map((school) => (
            <ListItem
              key={school.NombreEscuela}
              onClick={() => onSelectSchool(school.NombreEscuela)}
              $isSelected={school.NombreEscuela === selectedSchoolId}
            >
              {school.NombreEscuela}
            </ListItem>
          ))}
        </ListContainer>
      )}
    </div>
  );

  return (
    <StyledSchoolList>
      {renderSchoolList("Escuelas Activas", activeSchools)}
      {isDeactivatingStudents && <SpinnerMini />}
      {renderSchoolList("Escuelas Inactivas", inactiveSchools)}
    </StyledSchoolList>
  );
}

export default SchoolList;
