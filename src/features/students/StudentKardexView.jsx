import styled from "styled-components";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

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
  if (!student) {
    console.error("StudentKardexView rendered without a student prop.");
    return <p>Error: No se encontró información del estudiante.</p>;
  }

  const fullName = `${student.Nombre || ""} ${student.ApellidoPaterno || ""} ${
    student.ApellidoMaterno || ""
  }`.trim();

  return (
    <>
      <Title>Kardex del Estudiante: {fullName}</Title>
      <KardexLayout>
        <div>
          <StudentImage
            src={student.URLImagen || "default-user.jpg"}
            alt={`Foto de ${fullName}`}
            onError={(e) => (e.target.src = "default-user.jpg")}
          />
        </div>
        <DataGrid>
          <DataItem>
            <Label>Número de Control</Label>
            <Value>{student.NumeroControl || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Nombre Completo</Label>
            <Value>{fullName || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Grado</Label>
            <Value>{student.Grado || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Grupo</Label>
            <Value>{student.Grupo || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Fecha de Nacimiento</Label>
            <Value>{formatDate(student.FechaNacimiento)}</Value>
          </DataItem>
          <DataItem>
            <Label>Nombre Papá/Mamá (Tutor)</Label>
            <Value>{student.Tutor || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Correo Electrónico</Label>
            <Value>{student.Correo || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Teléfono/Celular</Label>
            <Value>{student.Telefono || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Escuela</Label>
            <Value>{student.NombreEscuela || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Persona Autorizada 1</Label>
            <Value>{student.QuienRecoge1 || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Persona Autorizada 2</Label>
            <Value>{student.QuienRecoge2 || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Profesor</Label>
            <Value>{student.Profesor || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Rango</Label>
            <Value>{student.Rango || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Activo</Label>
            <Value>{formatBoolean(student.Activo)}</Value>
          </DataItem>
          <DataItem>
            <Label>Beca</Label>
            <Value>{formatBoolean(student.Beca)}</Value>
          </DataItem>
          {student.Beca && (
            <DataItem>
              <Label>Porcentaje Beca</Label>
              <Value>
                {student.PorcentajeBeca !== null &&
                student.PorcentajeBeca !== undefined
                  ? `${student.PorcentajeBeca}%`
                  : "N/A"}
              </Value>
            </DataItem>
          )}
          <DataItem>
            <Label>Fecha de Inscripción</Label>
            <Value>{formatDate(student.FechaInscripcion)}</Value>
          </DataItem>
          <DataItem>
            <Label>Fecha de Baja</Label>
            <Value>{formatDate(student.FechaBaja)}</Value>
          </DataItem>
          <DataItem>
            <Label>Nick</Label>
            <Value>{student.Nick || "N/A"}</Value>
          </DataItem>
          <DataItem>
            <Label>Password</Label>
            <Value>{student.Password || "N/A"}</Value>
          </DataItem>
        </DataGrid>
      </KardexLayout>
    </>
  );
}

export default StudentKardexView;
