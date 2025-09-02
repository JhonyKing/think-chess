import { useState, useMemo, useContext } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Spinner from "../ui/Spinner";
import CourseList from "../features/schools/CourseList";
import CourseActivities from "../features/activities/CourseActivities";
import SchoolsTable from "../features/schools/SchoolsTable";
import Modal, { ModalContext } from "../ui/Modal";
import { getSchools } from "../services/apiSchools";
import CreateEditSchoolForm from "../features/schools/CreateEditSchoolForm";
import CreateCourseForm from "../features/courses/CreateCourseForm";
import ActivityManager from "../features/schools/ActivityManager";
import Button from "../ui/Button";

// Layout container for the Schools page
// Changed to a single column layout
const StyledSchoolsLayout = styled.div`
  display: flex; /* Use flex for single column */
  flex-direction: column;
  gap: 3.2rem; /* Increased gap between sections */
  margin-top: 1rem;
`;

// Container for school lists (active/inactive)
const SchoolsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.4rem; /* Space between active and inactive tables */
`;

// Header for each school section
const SectionHeader = styled(Heading)`
  font-size: 1.8rem;
  font-style: italic;
  font-weight: 400;
  margin-bottom: 1.6rem;
  margin-top: 2.4rem;
`;

function SchoolsContent() {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [schoolToEdit, setSchoolToEdit] = useState(null);
  const { open, close } = useContext(ModalContext);

  // Fetch schools data
  const {
    data: schoolsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Memoize filtered school lists using both DB field and actual course status
  const activeSchools = useMemo(() => {
    if (!schoolsData) return [];
    return schoolsData.filter((school) => {
      // Use both criteria: DB field AND actual active courses
      const hasActiveCourse = school.CURSO?.some((course) => course.Activo);
      return school.Activo || hasActiveCourse; // Either DB says active OR has active courses
    });
  }, [schoolsData]);

  const inactiveSchools = useMemo(() => {
    if (!schoolsData) return [];
    return schoolsData.filter((school) => {
      // Only inactive if BOTH: DB says inactive AND no active courses
      const hasActiveCourse = school.CURSO?.some((course) => course.Activo);
      return !school.Activo && !hasActiveCourse;
    });
  }, [schoolsData]);

  const handleSelectSchool = (school) => {
    setSelectedSchool((current) => {
      const newSelectedSchool =
        current?.NombreEscuela === school.NombreEscuela ? null : school;
      // Deselect course when school changes
      if (newSelectedSchool?.NombreEscuela !== current?.NombreEscuela) {
        setSelectedCourseId(null);
      }
      return newSelectedSchool;
    });
  };
  const handleSelectCourse = (courseId) => {
    setSelectedCourseId((current) =>
      String(current) === String(courseId) ? null : String(courseId)
    );
  };

  // Handlers para modal de escuela usando contexto
  const handleAddSchool = () => {
    setSchoolToEdit(null);
    open("school-form");
  };
  const handleEditSchool = (school) => {
    setSchoolToEdit(school);
    open("school-form");
  };
  const handleCloseSchoolModal = () => {
    setSchoolToEdit(null);
    close();
  };

  // Handlers para modal de curso
  const handleAddCourse = () => {
    open("course-form");
  };
  const handleCloseCourseModal = () => {
    close();
  };

  // Handler para modal de actividad
  const handleAddActivity = () => {
    open("activity-form");
  };

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <p>Error cargando escuelas: {error.message || "Error desconocido"}</p>
    );
  }

  console.log("Cursos de la escuela seleccionada:", selectedSchool?.CURSO);

  return (
    <>
      <Row type="horizontal" $contentposition="space-between-center">
        <Heading as="h1">Escuelas</Heading>
      </Row>
      <StyledSchoolsLayout>
        <SchoolsContainer>
          {/* Active Schools Table */}
          <div>
            <SectionHeader as="h2" style={{ marginTop: "2.8rem" }}>
              Escuelas Activas
            </SectionHeader>
            <SchoolsTable
              schools={activeSchools}
              isLoading={isLoading}
              onSelect={handleSelectSchool}
              selectedSchoolNombre={selectedSchool?.NombreEscuela}
              emptyMessage="No hay escuelas activas registradas."
              onAdd={handleAddSchool}
              onEdit={handleEditSchool}
            />
          </div>
          {/* Inactive Schools Table */}
          <div>
            <SectionHeader as="h2">Escuelas Inactivas</SectionHeader>
            <SchoolsTable
              schools={inactiveSchools}
              isLoading={isLoading}
              onSelect={handleSelectSchool}
              selectedSchoolNombre={selectedSchool?.NombreEscuela}
              emptyMessage="No hay escuelas inactivas registradas."
              onAdd={handleAddSchool}
              onEdit={handleEditSchool}
            />
          </div>
        </SchoolsContainer>
        <CourseList
          courses={selectedSchool?.CURSO || []}
          selectedSchool={selectedSchool}
          isLoading={isLoading}
          onAddCourse={handleAddCourse}
          onSelectCourse={handleSelectCourse}
          selectedCourseId={selectedCourseId}
        />
        {/* Botón Agregar Actividad, solo si hay curso seleccionado */}
        {selectedCourseId && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "1.6rem",
            }}
          >
            <Button
              variation="primary"
              size="medium"
              onClick={handleAddActivity}
            >
              <span style={{ display: "flex", alignItems: "center" }}>
                <svg
                  style={{ marginRight: "0.4rem" }}
                  width="1.5em"
                  height="1.5em"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5V19M5 12H19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Agregar Actividad
              </span>
            </Button>
          </div>
        )}
        {selectedCourseId && selectedSchool && (
          <CourseActivities
            selectedCourseId={selectedCourseId}
            selectedSchoolName={selectedSchool.NombreEscuela}
          />
        )}
        {/* Lista de actividades del curso seleccionado */}
        {selectedCourseId && (
          <div style={{ marginTop: "2.4rem" }}>
            <ActivityManager courseId={selectedCourseId} />
          </div>
        )}
      </StyledSchoolsLayout>
      {/* Modal único para agregar/editar escuela, siempre renderizado */}
      <Modal.Window name="school-form">
        <CreateEditSchoolForm
          key={schoolToEdit?.NombreEscuela || "new"}
          schoolToEdit={schoolToEdit}
          onCloseModal={handleCloseSchoolModal}
        />
      </Modal.Window>
      {/* Modal para agregar curso */}
      <Modal.Window name="course-form">
        <CreateCourseForm
          key={selectedSchool?.NombreEscuela || "new-course"}
          selectedSchoolName={selectedSchool?.NombreEscuela}
          onCloseModal={handleCloseCourseModal}
        />
      </Modal.Window>
      {/* Modal para agregar actividad */}
      <Modal.Window name="activity-form">
        {/* Solo el formulario de agregar actividad, sin la lista */}
        <div style={{ padding: "2rem 0" }}>
          <ActivityManager courseId={selectedCourseId} />
        </div>
      </Modal.Window>
    </>
  );
}

function Schools() {
  return (
    <Modal>
      <SchoolsContent />
    </Modal>
  );
}

export default Schools;
