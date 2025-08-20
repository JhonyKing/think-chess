import styled from "styled-components";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "../../services/apiStudents";

const KardexLayout = styled.div`
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 2fr; // Image column and data column
  gap: 3rem;
  width: 80rem; // Set a width for the view content
  max-width: 90vw;
`;

const StudentImage = styled.img`
  width: 100%;
  max-height: 30rem;
  object-fit: contain;
  border-radius: var(--border-radius-md);
  background-color: var(--color-grey-100);
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.4rem 2rem;
`;

const DataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Label = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  text-transform: uppercase;
  background-color: var(--color-grey-200);
  color: var(--color-grey-700);
  padding: 0.4rem 0.8rem;
  border-radius: var(--border-radius-sm);
  display: inline-block;
  width: fit-content;
`;

const Value = styled.span`
  font-size: 1.4rem;
  color: var(--color-grey-700);
  word-break: break-word;
`;

const Title = styled.h2`
  font-size: 2.4rem;
  font-weight: 600;
  margin-bottom: 3rem;
  text-align: center; // Center the title
`;

// Helper for date formatting
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    // Parse the date string (assuming it's ISO format from DB)
    const date = new Date(dateString);
    // Format the date in UTC timezone
    return formatInTimeZone(date, "UTC", "dd MMM yyyy", { locale: es });
  } catch (error) {
    console.error("Kardex date format error:", dateString, error);
    return "Fecha inválida";
  }
};

// Helper for boolean formatting
const formatBoolean = (value) => (value ? "Sí" : "No");

/**
 * Component to display the Kardex information for a student.
 * Assumes it will be rendered inside a Modal.Window.
 *
 * @param {object} props
 * @param {object} props.student - The student object containing data to display.
 */
function StudentKardexView({ student /*, onCloseModal */ }) {
  // Obtener datos frescos del estudiante desde la base de datos
  const {
    data: allStudents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  if (!student) {
    console.error("StudentKardexView rendered without a student prop.");
    return <p>Error: No se encontró información del estudiante.</p>;
  }

  if (isLoading) {
    return <p>Cargando información del estudiante...</p>;
  }

  if (error) {
    console.error("Error loading student data:", error);
    return <p>Error al cargar información del estudiante.</p>;
  }

  // Buscar el estudiante actualizado en los datos frescos
  const freshStudent = allStudents.find(
    (s) => s.NumeroControl === student.NumeroControl
  );

  // Usar datos frescos si están disponibles, sino usar los props como fallback
  const currentStudent = freshStudent || student;

  const fullName = `${currentStudent.Nombre || ""} ${
    currentStudent.ApellidoPaterno || ""
  } ${currentStudent.ApellidoMaterno || ""}`.trim();

  return (
    <>
      <Title>Kardex del Estudiante: {fullName}</Title>
      <KardexLayout>
        <div>
          <StudentImage
            src={currentStudent.URLImagen || "default-user.jpg"}
            alt={`Foto de ${fullName}`}
            onError={(e) => (e.target.src = "default-user.jpg")}
          />
        </div>
        <DataGrid>
          <DataItem>
            <Label>Número de Control</Label>
            <Value>{currentStudent.NumeroControl || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Nombre Completo</Label>
            <Value>{fullName || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Grado</Label>
            <Value>{currentStudent.Grado || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Grupo</Label>
            <Value>{currentStudent.Grupo || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Fecha de Nacimiento</Label>
            <Value>{formatDate(currentStudent.FechaNacimiento)}</Value>
          </DataItem>
          <DataItem>
            <Label>Nombre Papá/Mamá (Tutor)</Label>
            <Value>{currentStudent.Tutor || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Correo Electrónico</Label>
            <Value>{currentStudent.Correo || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Teléfono/Celular</Label>
            <Value>{currentStudent.Telefono || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Escuela</Label>
            <Value>{currentStudent.NombreEscuela || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Persona Autorizada 1</Label>
            <Value>{currentStudent.QuienRecoge1 || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Persona Autorizada 2</Label>
            <Value>{currentStudent.QuienRecoge2 || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Profesor</Label>
            <Value>{currentStudent.Profesor || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Rango</Label>
            <Value>{currentStudent.Rango || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Activo</Label>
            <Value>{formatBoolean(currentStudent.Activo)}</Value>
          </DataItem>
          <DataItem>
            <Label>Beca</Label>
            <Value>{formatBoolean(currentStudent.Beca)}</Value>
          </DataItem>
          {currentStudent.Beca && (
            <DataItem>
              <Label>Porcentaje Beca</Label>
              <Value>
                {currentStudent.PorcentajeBeca !== null &&
                currentStudent.PorcentajeBeca !== undefined
                  ? `${currentStudent.PorcentajeBeca}%`
                  : "N/A"}
              </Value>
            </DataItem>
          )}
          <DataItem>
            <Label>Fecha de Inscripción</Label>
            <Value>{formatDate(currentStudent.FechaInscripcion)}</Value>
          </DataItem>
          <DataItem>
            <Label>Fecha de Baja</Label>
            <Value>{formatDate(currentStudent.FechaBaja)}</Value>
          </DataItem>
          <DataItem>
            <Label>Nick</Label>
            <Value>{currentStudent.Nick || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Password</Label>
            <Value>{currentStudent.Password || "N/A"}</Value>
          </DataItem>
        </DataGrid>
      </KardexLayout>
    </>
  );
}

export default StudentKardexView;
