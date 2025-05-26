import styled from "styled-components";
import Spinner from "../../ui/Spinner"; // Adjusted path
import Heading from "../../ui/Heading";
import Empty from "../../ui/Empty";
import Table from "../../ui/Table"; // Import Table component
import { format } from "date-fns"; // For formatting dates
import { es } from "date-fns/locale"; // Spanish locale
import Button from "../../ui/Button"; // Import Button
import { IoMdAdd } from "react-icons/io"; // Import Add icon

// Styled components for Course Row items (can be simple divs or specific styles)
const CourseDetail = styled.div`
  font-size: 1.3rem; /* Slightly smaller */
  color: var(--color-grey-600);
  white-space: nowrap;
  overflow: hidden; /* Added overflow */
  text-overflow: ellipsis; /* Added ellipsis */
`;

const TableContainer = styled.div`
  margin-top: 1.6rem;
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  background-color: var(--color-grey-0);
  overflow: hidden; /* Contain border radius */
`;

const CourseHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.6rem; /* Add space below header */
`;

// Helper function to format dates safely
function formatCourseDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(
      dateString.includes("T") ? dateString : dateString + "T00:00:00Z"
    );
    return format(date, "P", { locale: es }); // Use short date format 'P'
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Inválida";
  }
}

/**
 * Displays a list of courses for a selected school in a table.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.courses - Array of course objects for the selected school.
 * @param {object} [props.selectedSchool] - The selected school object (optional, for displaying name).
 * @param {boolean} props.isLoading - Whether the parent component is still loading schools.
 * @param {Function} props.onAddCourse - Function to trigger adding a new course.
 * @param {Function} props.onSelectCourse - Function to call when a course row is clicked.
 * @param {number|null} props.selectedCourseId - The ID of the currently selected course.
 */
function CourseList({
  courses,
  selectedSchool,
  isLoading,
  onAddCourse,
  onSelectCourse,
  selectedCourseId,
}) {
  // If parent is loading schools, show a spinner or minimal message
  if (isLoading && !selectedSchool) {
    return <Spinner />; // Or null, or a placeholder message
  }

  // If no school is selected
  if (!selectedSchool) {
    return (
      <div>
        <Heading as="h2">Cursos</Heading>
        <Empty resourceName="cursos">
          Selecciona una escuela para ver sus cursos.
        </Empty>
      </div>
    );
  }

  const handleRowClick = (course) => {
    onSelectCourse?.(course.IDCurso); // Pass only the ID
  };

  return (
    <div>
      <CourseHeaderContainer>
        <Heading as="h2" style={{ margin: 0 }}>
          {/* Remove default margin */}
          Cursos de: {selectedSchool.NombreEscuela}
        </Heading>
        {/* Add Course Button - only shown when school is selected */}
        <Button
          variation="primary"
          size="medium"
          onClick={onAddCourse} // Use the passed handler
          aria-label="Agregar nuevo curso"
          disabled={isLoading} // Disable if still loading schools
        >
          <IoMdAdd style={{ marginRight: "0.4rem" }} /> Agregar Curso
        </Button>
      </CourseHeaderContainer>

      {!courses || courses.length === 0 ? (
        <Empty resourceName="cursos">
          Esta escuela no tiene cursos registrados.
        </Empty>
      ) : (
        <TableContainer>
          {/* Define columns: Dia, Inicio, Fin */}
          <Table columns="1fr 1fr 1fr">
            {" "}
            {/* Adjusted to 3 columns */}
            <Table.Header>
              {/* Removed Nombre Curso Header */}
              <div>Día</div>
              <div>Inicio</div>
              <div>Fin</div>
            </Table.Header>
            <Table.Body
              data={courses}
              render={(course) => {
                const isSelected =
                  String(course.IDCurso) === String(selectedCourseId);
                return (
                  <Table.Row key={course.IDCurso} isSelected={isSelected}>
                    <CourseDetail
                      onClick={() => handleRowClick(course)}
                      style={{ cursor: "pointer" }}
                      title={`Seleccionar curso ID: ${course.IDCurso}`}
                    >
                      {course.DiaClase || "-"}
                    </CourseDetail>
                    <CourseDetail>
                      {formatCourseDate(course.InicioCurso)}
                    </CourseDetail>
                    <CourseDetail>
                      {formatCourseDate(course.FinCurso)}
                    </CourseDetail>
                  </Table.Row>
                );
              }}
            />
          </Table>
        </TableContainer>
      )}
    </div>
  );
}

export default CourseList;
