import styled from "styled-components";
import { useState } from "react";
import Spinner from "../../ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import {
  getStudents,
  getLatestNumeroControlForCurrentYear,
} from "../../services/apiStudents";
import StudentRow from "./StudentRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import AddStudentModal from "./AddStudentModal";
import SpinnerMini from "../../ui/SpinnerMini";
import { toast } from "react-hot-toast";
import StudentKardexModal from "./StudentKardexModal";

const Table = styled.div`
  border: 1px solid var(--color--grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-80);
  border-radius: 7px;
  overflow-x: auto;
  max-height: 70vh;
  width: 100%;
`;

const TableHeader = styled.header`
  display: grid;
  grid-template-columns: 10rem 20rem 10rem 10rem 35rem 25rem 25rem 15rem 15rem 30rem 8rem 25rem 8rem 8rem 8rem 8rem 15rem 8rem 15rem 15rem 20rem 20rem 12rem;
  column-gap: 2rem;
  align-items: center;
  text-align: center;

  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-100);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: var(--color-grey-600);
  padding: 1.6rem 2.4rem;
  min-width: max-content;

  & > div {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--color-primary-600);
    }
  }

  & > div:last-child {
    cursor: default;
    &:hover {
      color: var(--color-grey-600);
    }
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1.6rem;
  align-items: center;
  margin-bottom: 2rem;
  justify-content: space-between;
`;

const FilterInput = styled(Input)`
  max-width: 300px;
`;

function StudentsTable() {
  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const [nextNumeroControl, setNextNumeroControl] = useState("");
  const [isGeneratingNum, setIsGeneratingNum] = useState(false);

  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [selectedStudentForKardex, setSelectedStudentForKardex] =
    useState(null);

  const { isLoading, data: students } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const handleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredAndSortedStudents = students
    ?.filter((student) => {
      if (!filterValue) return true;
      const searchTerm = filterValue.toLowerCase();
      return (
        student.NumeroControl?.toString().toLowerCase().includes(searchTerm) ||
        `${student.Nombre} ${student.ApellidoPaterno} ${student.ApellidoMaterno}`
          .toLowerCase()
          .includes(searchTerm) ||
        student.NombreEscuela?.toLowerCase().includes(searchTerm) ||
        student.Correo?.toLowerCase().includes(searchTerm) ||
        student.Tutor?.toLowerCase().includes(searchTerm)
      );
    })
    ?.sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === bValue) return 0;
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      if (aValue === null || aValue === undefined) return 1 * direction;
      if (bValue === null || bValue === undefined) return -1 * direction;
      if (typeof aValue === "string") {
        return aValue.localeCompare(bValue) * direction;
      }
      if (typeof aValue === "number" || typeof aValue === "boolean") {
        return (Number(aValue) - Number(bValue)) * direction;
      }
      if (
        ["FechaNacimiento", "FechaInscripcion", "FechaBaja"].includes(
          sortConfig.key
        )
      ) {
        try {
          const dateA = new Date(aValue).getTime();
          const dateB = new Date(bValue).getTime();
          if (isNaN(dateA)) return 1 * direction;
          if (isNaN(dateB)) return -1 * direction;
          return (dateA - dateB) * direction;
        } catch (e) {
          return 0;
        }
      }
      return 0;
    });

  const handleAddStudent = async () => {
    setIsGeneratingNum(true);
    try {
      const latestNum = await getLatestNumeroControlForCurrentYear();

      const currentYear = new Date().getFullYear().toString().slice(-2);
      const prefix = `${currentYear}100`;
      let nextSeqNum = 0;

      if (latestNum && latestNum.startsWith(prefix)) {
        const lastSeq = parseInt(latestNum.slice(prefix.length), 10);
        if (!isNaN(lastSeq)) {
          nextSeqNum = lastSeq + 1;
        }
      }

      const nextSeqStr = nextSeqNum.toString().padStart(3, "0");
      const generatedNumeroControl = `${prefix}${nextSeqStr}`;

      setNextNumeroControl(generatedNumeroControl);
      setStudentToEdit(null);
      setIsAddEditModalOpen(true);
    } catch (error) {
      console.error("Failed to generate NumeroControl:", error);
      toast.error(error.message || "Error al generar número de control.");
    } finally {
      setIsGeneratingNum(false);
    }
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setNextNumeroControl("");
    setIsAddEditModalOpen(true);
  };

  const handleCloseAddEditModal = () => {
    setIsAddEditModalOpen(false);
    setStudentToEdit(null);
    setNextNumeroControl("");
  };

  const handleOpenKardex = (student) => {
    setSelectedStudentForKardex(student);
    setIsKardexModalOpen(true);
  };

  const handleCloseKardex = () => {
    setIsKardexModalOpen(false);
    setSelectedStudentForKardex(null);
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <FilterContainer>
        <FilterInput
          type="text"
          placeholder="Buscar estudiante..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
        <Button onClick={handleAddStudent} disabled={isGeneratingNum}>
          {isGeneratingNum ? <SpinnerMini /> : "Agregar Estudiante"}
        </Button>
      </FilterContainer>

      <Table role="table">
        <TableHeader role="row">
          <div onClick={() => handleSort("NumeroControl")}>
            # Control{" "}
            {sortConfig.key === "NumeroControl" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Nombre")}>
            Nombre{" "}
            {sortConfig.key === "Nombre" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("ApellidoPaterno")}>
            Apellido P.{" "}
            {sortConfig.key === "ApellidoPaterno" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("ApellidoMaterno")}>
            Apellido M.{" "}
            {sortConfig.key === "ApellidoMaterno" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("NombreEscuela")}>
            Escuela{" "}
            {sortConfig.key === "NombreEscuela" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("QuienRecoge1")}>
            Persona Autorizada 1{" "}
            {sortConfig.key === "QuienRecoge1" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("QuienRecoge2")}>
            Persona Autorizada 2{" "}
            {sortConfig.key === "QuienRecoge2" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("FechaNacimiento")}>
            Fecha Nac.{" "}
            {sortConfig.key === "FechaNacimiento" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Telefono")}>
            Teléfono{" "}
            {sortConfig.key === "Telefono" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Correo")}>
            Correo{" "}
            {sortConfig.key === "Correo" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Activo")}>
            Activo{" "}
            {sortConfig.key === "Activo" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Tutor")}>
            Tutor{" "}
            {sortConfig.key === "Tutor" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Grado")}>
            Grado{" "}
            {sortConfig.key === "Grado" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Grupo")}>
            Grupo{" "}
            {sortConfig.key === "Grupo" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Beca")}>
            Beca{" "}
            {sortConfig.key === "Beca" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("PorcentajeBeca")}>
            Beca %{" "}
            {sortConfig.key === "PorcentajeBeca" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Profesor")}>
            Profesor{" "}
            {sortConfig.key === "Profesor" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Rango")}>
            Rango{" "}
            {sortConfig.key === "Rango" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("FechaInscripcion")}>
            Inscripción{" "}
            {sortConfig.key === "FechaInscripcion" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("FechaBaja")}>
            Baja{" "}
            {sortConfig.key === "FechaBaja" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Nick")}>
            Nick{" "}
            {sortConfig.key === "Nick" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div onClick={() => handleSort("Password")}>
            Password{" "}
            {sortConfig.key === "Password" &&
              (sortConfig.direction === "asc" ? "↑" : "↓")}
          </div>
          <div>Acciones</div>
        </TableHeader>
        {filteredAndSortedStudents?.map((student) => (
          <StudentRow
            student={student}
            key={student.NumeroControl}
            onEdit={() => handleEditStudent(student)}
            onKardexClick={() => handleOpenKardex(student)}
          />
        ))}
      </Table>

      <AddStudentModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseAddEditModal}
        studentToEdit={studentToEdit}
        generatedNumeroControl={nextNumeroControl}
      />

      <StudentKardexModal
        isOpen={isKardexModalOpen}
        onClose={handleCloseKardex}
        student={selectedStudentForKardex}
      />
    </>
  );
}

export default StudentsTable;
