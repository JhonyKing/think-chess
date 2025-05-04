import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styled, { css } from "styled-components";
import {
  getCoursesBySchool,
  deactivateCourse,
  reactivateCourse,
} from "../../services/apiCourses";
import Spinner from "../../ui/Spinner";
import Heading from "../../ui/Heading";
import Empty from "../../ui/Empty"; // Import Empty component
import { format } from "date-fns"; // For formatting dates
import { es } from "date-fns/locale"; // Spanish locale
import Button from "../../ui/Button"; // Import Button
import SpinnerMini from "../../ui/SpinnerMini"; // Import SpinnerMini
import { HiOutlineEyeSlash, HiOutlineEye } from "react-icons/hi2"; // Icons for actions
import toast from "react-hot-toast"; // Import toast

// Similar styling to SchoolList but maybe adapt for table-like view
const CourseListContainer = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* max-height: 300px; // Adjust height as needed */
  overflow-y: auto;
`;

const CourseListItem = styled.div`
  display: grid; // Use grid for columns
  grid-template-columns: 10rem 1fr 1fr 10rem 8rem; // ID, Start, End, Day, Actions
  gap: 1.6rem;
  align-items: center;
  padding: 1rem 1.6rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1.4rem;

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

const CourseHeader = styled(CourseListItem)`
  font-weight: 600;
  color: var(--color-grey-600);
  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-200);
  cursor: default;
  text-transform: uppercase;
  font-size: 1.2rem;
  letter-spacing: 0.4px;

  &:hover {
    background-color: var(--color-grey-50); // No hover effect
  }

  // Add empty div for Actions column header
  & > div:last-of-type {
    visibility: hidden; // Hide header for actions or give it a title
  }
`;

const StyledCourseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem; // Gap between active/inactive sections
`;

// Helper function to format dates nicely
function formatCourseDate(dateString) {
  if (!dateString) return "-";
  try {
    // Directly use new Date() which should handle ISO timestamps
    // Ensure the date is treated as UTC if it doesn't have timezone info
    // Adding 'T00:00:00Z' might help if only date part is received unexpectedly
    const date = new Date(
      dateString.includes("T") ? dateString : dateString + "T00:00:00Z"
    );
    return format(date, "dd MMM yyyy", { locale: es });
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Fecha inválida";
  }
}

function CourseList({ schoolId, selectedCourseId, onSelectCourse }) {
  const queryClient = useQueryClient();
  const {
    isLoading,
    data: courses,
    error,
  } = useQuery({
    // Rerun query when schoolId changes
    queryKey: ["courses", schoolId],
    queryFn: () => getCoursesBySchool(schoolId),
    enabled: !!schoolId, // Only run query if schoolId is truthy
  });

  // --- Mutations for Course Activation ---
  const { mutate: deactivate, isLoading: isDeactivating } = useMutation({
    mutationFn: deactivateCourse,
    onSuccess: () => {
      toast.success("Curso desactivado");
      queryClient.invalidateQueries({ queryKey: ["courses", schoolId] });
      // IMPORTANT: Also invalidate schools query to trigger re-evaluation of school status
      queryClient.invalidateQueries({ queryKey: ["schoolsWithCourses"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { mutate: reactivate, isLoading: isReactivating } = useMutation({
    mutationFn: reactivateCourse,
    onSuccess: () => {
      toast.success("Curso reactivado");
      queryClient.invalidateQueries({ queryKey: ["courses", schoolId] });
      // IMPORTANT: Also invalidate schools query to trigger re-evaluation of school status
      queryClient.invalidateQueries({ queryKey: ["schoolsWithCourses"] });
    },
    onError: (err) => toast.error(err.message),
  });
  // -------------------------------------

  if (isLoading) return <Spinner />;
  if (error) return <p>Error al cargar cursos: {error.message}</p>;

  // Separate courses into active and inactive
  const activeCourses = courses?.filter((course) => course.Activo) ?? [];
  const inactiveCourses = courses?.filter((course) => !course.Activo) ?? [];

  const renderCourseList = (title, courseArray) => (
    <div>
      <Heading as="h4" style={{ marginBottom: "1rem" }}>
        {title}
      </Heading>
      {courseArray.length === 0 ? (
        <Empty resourceName="cursos" />
      ) : (
        <CourseListContainer>
          <CourseHeader as="header">
            <div>ID Curso</div>
            <div>Inicio</div>
            <div>Fin</div>
            <div>Día</div>
            <div></div> {/* Empty header for actions column */}
          </CourseHeader>
          {courseArray.map((course) => {
            const isProcessing = isDeactivating || isReactivating;
            return (
              <CourseListItem
                key={course.IDCurso}
                $isSelected={course.IDCurso === selectedCourseId}
              >
                <div>{course.IDCurso}</div>
                <div>{formatCourseDate(course.InicioCurso)}</div>
                <div>{formatCourseDate(course.FinCurso)}</div>
                <div>{course.DiaClase}</div>
                <div>
                  {course.Activo ? (
                    <Button
                      size="small"
                      variation="danger"
                      onClick={() => deactivate(course.IDCurso)}
                      disabled={isProcessing}
                      title="Desactivar curso"
                    >
                      {isDeactivating ? <SpinnerMini /> : <HiOutlineEyeSlash />}
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variation="secondary"
                      onClick={() => reactivate(course.IDCurso)}
                      disabled={isProcessing}
                      title="Reactivar curso"
                    >
                      {isReactivating ? <SpinnerMini /> : <HiOutlineEye />}
                    </Button>
                  )}
                  {/* Add button/logic to select course for activity view if needed */}
                  <Button
                    size="small"
                    variation={
                      course.IDCurso === selectedCourseId
                        ? "primary"
                        : "secondary"
                    }
                    onClick={() => onSelectCourse(course.IDCurso)}
                    disabled={isProcessing}
                    title="Seleccionar curso"
                    style={{ marginLeft: "0.5rem" }} // Add some space
                  >
                    Ver Act.
                  </Button>
                </div>
              </CourseListItem>
            );
          })}
        </CourseListContainer>
      )}
    </div>
  );

  return (
    <StyledCourseList>
      {renderCourseList("Cursos Activos", activeCourses)}
      {renderCourseList("Cursos Inactivos (Archivados)", inactiveCourses)}
    </StyledCourseList>
  );
}

export default CourseList;
