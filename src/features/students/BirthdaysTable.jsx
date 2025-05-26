import styled from "styled-components";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ModalContent = styled.div`
  max-height: 60vh;
  overflow-y: auto;
  min-width: 40rem;
  padding: 2rem 1.5rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2.4rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--color-grey-0);
`;

const Th = styled.th`
  background: var(--color-grey-100);
  font-weight: 600;
  padding: 0.8rem 1rem;
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const Td = styled.td`
  padding: 0.7rem 1rem;
  border-bottom: 1px solid var(--color-grey-100);
  font-size: 1.4rem;
`;

function getCurrentMonth() {
  return new Date().getMonth() + 1; // 1-based
}

function getDay(dateString) {
  if (!dateString) return 0;
  const d = new Date(dateString);
  return d.getDate();
}

function BirthdaysTable({ students }) {
  const month = getCurrentMonth();
  // Filtrar cumpleañeros del mes actual
  const birthdayStudents = (students || [])
    .filter((s) => {
      if (!s.FechaNacimiento) return false;
      const d = new Date(s.FechaNacimiento);
      return d.getMonth() + 1 === month;
    })
    .sort((a, b) => {
      // Ordenar por día
      const dayA = getDay(a.FechaNacimiento);
      const dayB = getDay(b.FechaNacimiento);
      if (dayA !== dayB) return dayA - dayB;
      // Si es el mismo día, ordenar por nombre completo
      const nameA = `${a.Nombre || ""} ${a.ApellidoPaterno || ""} ${
        a.ApellidoMaterno || ""
      }`
        .trim()
        .toLowerCase();
      const nameB = `${b.Nombre || ""} ${b.ApellidoPaterno || ""} ${
        b.ApellidoMaterno || ""
      }`
        .trim()
        .toLowerCase();
      return nameA.localeCompare(nameB, "es");
    });

  return (
    <ModalContent>
      <Title>Cumpleañeros del mes</Title>
      <Table>
        <thead>
          <tr>
            <Th>Nombre</Th>
            <Th>Apellido Paterno</Th>
            <Th>Apellido Materno</Th>
            <Th>Escuela</Th>
            <Th>Fecha de Nacimiento</Th>
          </tr>
        </thead>
        <tbody>
          {birthdayStudents.length === 0 ? (
            <tr>
              <Td colSpan={5} style={{ textAlign: "center" }}>
                No hay cumpleañeros este mes.
              </Td>
            </tr>
          ) : (
            birthdayStudents.map((s) => (
              <tr key={s.NumeroControl}>
                <Td>{s.Nombre}</Td>
                <Td>{s.ApellidoPaterno}</Td>
                <Td>{s.ApellidoMaterno}</Td>
                <Td>{s.NombreEscuela}</Td>
                <Td>
                  {s.FechaNacimiento
                    ? format(new Date(s.FechaNacimiento), "dd 'de' MMMM", {
                        locale: es,
                      })
                    : "-"}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </ModalContent>
  );
}

export default BirthdaysTable;
