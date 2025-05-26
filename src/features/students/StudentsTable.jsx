import styled from "styled-components";
import { useState, useMemo, useContext } from "react";
import Spinner from "../../ui/Spinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStudents,
  getLatestNumeroControlForCurrentYear,
  deleteStudent,
} from "../../services/apiStudents";
import StudentRow from "./StudentRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import { toast } from "react-hot-toast";
import Modal, { ModalContext } from "../../ui/Modal";
import CreateStudentForm from "./CreateStudentForm";
import StudentKardexView from "./StudentKardexView";
import ConfirmDelete from "../../ui/ConfirmDelete";
import { IoMdAdd } from "react-icons/io";
import { HiChevronUp, HiChevronDown, HiGift } from "react-icons/hi";
import Empty from "../../ui/Empty";
import Table from "../../ui/Table";
import BirthdaysTable from "./BirthdaysTable";

const TableContainer = styled.div`
  /* overflow-x: auto; */ /* Remove */
  overflow: auto; /* Handle both scrolls */
  max-height: 75vh; /* Limit height */
  /* width: 100%; */ /* Remove width */
`;

const TableOperations = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 1.6rem;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: inherit;
  color: inherit;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0;
  text-align: center;
  width: 100%;
  justify-content: center;

  &:hover {
    color: var(--color-grey-800);
  }

  & svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

function StudentsTable() {
  const { isLoading, data: allStudents } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
  });

  const queryClient = useQueryClient();
  const { open: openModal } = useContext(ModalContext);

  const [studentToEdit, setStudentToEdit] = useState(null);
  const [selectedStudentForKardex, setSelectedStudentForKardex] =
    useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [nextNumeroControl, setNextNumeroControl] = useState("");
  const [isGeneratingNum, setIsGeneratingNum] = useState(false);

  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "Nombre",
    direction: "asc",
  });

  const { isLoading: isDeleting, mutate: mutateDelete } = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      toast.success(`Estudiante eliminado`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setStudentToDelete(null);
    },
    onError: (err) => toast.error(err.message),
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

  const handleFilterChange = (e) => setFilterValue(e.target.value);

  const filteredStudents = useMemo(() => {
    if (!allStudents) return [];
    const searchTerm = filterValue.toLowerCase();
    return allStudents.filter((student) => {
      if (!searchTerm) return true;
      return (
        student.NumeroControl?.toString().toLowerCase().includes(searchTerm) ||
        `${student.Nombre} ${student.ApellidoPaterno} ${student.ApellidoMaterno}`
          .toLowerCase()
          .includes(searchTerm) ||
        student.NombreEscuela?.toLowerCase().includes(searchTerm) ||
        student.Correo?.toLowerCase().includes(searchTerm) ||
        student.Tutor?.toLowerCase().includes(searchTerm)
      );
    });
  }, [allStudents, filterValue]);

  const sortedStudents = useMemo(() => {
    if (!filteredStudents.length || !sortConfig.key) return filteredStudents;
    return [...filteredStudents].sort((a, b) => {
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
  }, [filteredStudents, sortConfig]);

  const handlePrepareAdd = async () => {
    setIsGeneratingNum(true);
    try {
      const latestNum = await getLatestNumeroControlForCurrentYear();
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const prefix = `${currentYear}100`;
      let nextSeqNum = 1;
      if (latestNum && latestNum.startsWith(prefix)) {
        const lastSeq = parseInt(latestNum.slice(prefix.length), 10);
        if (!isNaN(lastSeq)) nextSeqNum = lastSeq + 1;
      }
      const nextSeqStr = nextSeqNum.toString().padStart(3, "0");
      setNextNumeroControl(`${prefix}${nextSeqStr}`);
      setStudentToEdit(null);
      setSelectedStudentForKardex(null);
      setStudentToDelete(null);
    } catch (err) {
      toast.error(err.message || "Error al generar número de control.");
      console.error("Failed to generate NumeroControl:", err);
    } finally {
      setIsGeneratingNum(false);
    }
  };

  const handlePrepareEdit = (student) => {
    setNextNumeroControl("");
    setStudentToEdit(student);
    setSelectedStudentForKardex(null);
    setStudentToDelete(null);
  };

  const handlePrepareKardex = (student) => {
    setStudentToEdit(null);
    setSelectedStudentForKardex(student);
    setStudentToDelete(null);
  };

  const handlePrepareDelete = (student) => {
    setStudentToEdit(null);
    setSelectedStudentForKardex(null);
    setStudentToDelete(student);
    openModal?.("delete-student");
  };

  const handleCloseAndResetState = () => {
    setStudentToEdit(null);
    setSelectedStudentForKardex(null);
    setNextNumeroControl("");
    setStudentToDelete(null);
  };

  if (isLoading) return <Spinner />;

  const columnWidths =
    "10rem 20rem 10rem 10rem 35rem 25rem 25rem 15rem 15rem 30rem 8rem 25rem 8rem 8rem 8rem 8rem 15rem 8rem 15rem 15rem 20rem 20rem 12rem";

  const renderSortIcon = (field) => {
    if (sortConfig.key !== field) return null;
    return sortConfig.direction === "asc" ? <HiChevronUp /> : <HiChevronDown />;
  };

  return (
    <>
      <TableOperations>
        <Input
          type="text"
          placeholder="Buscar estudiante..."
          value={filterValue}
          onChange={handleFilterChange}
          style={{ width: "30rem" }}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: "1rem" }}>
          <Modal.Open opens="birthdays-modal">
            <Button
              variation="secondary"
              size="medium"
              aria-label="Cumpleañeros del mes"
            >
              <HiGift style={{ marginRight: "0.4rem" }} />
              Cumpleañeros
            </Button>
          </Modal.Open>
          <Modal.Open opens="student-form">
            <Button onClick={handlePrepareAdd} disabled={isGeneratingNum}>
              {isGeneratingNum ? (
                <SpinnerMini />
              ) : (
                <>
                  <IoMdAdd style={{ marginRight: "0.4rem" }} /> Agregar
                  Estudiante
                </>
              )}
            </Button>
          </Modal.Open>
        </div>
      </TableOperations>

      <TableContainer>
        <Table columns={columnWidths} role="table">
          <Table.Header role="row">
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("NumeroControl")}>
                # Control {renderSortIcon("NumeroControl")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Nombre")}>
                Nombre {renderSortIcon("Nombre")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("ApellidoPaterno")}>
                Apellido P. {renderSortIcon("ApellidoPaterno")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("ApellidoMaterno")}>
                Apellido M. {renderSortIcon("ApellidoMaterno")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("NombreEscuela")}>
                Escuela {renderSortIcon("NombreEscuela")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("QuienRecoge1")}>
                Persona Autorizada 1 {renderSortIcon("QuienRecoge1")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("QuienRecoge2")}>
                Persona Autorizada 2 {renderSortIcon("QuienRecoge2")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("FechaNacimiento")}>
                Fecha Nac. {renderSortIcon("FechaNacimiento")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Telefono")}>
                Teléfono {renderSortIcon("Telefono")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Correo")}>
                Correo {renderSortIcon("Correo")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Activo")}>
                Activo {renderSortIcon("Activo")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Tutor")}>
                Tutor {renderSortIcon("Tutor")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Grado")}>
                Grado {renderSortIcon("Grado")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Grupo")}>
                Grupo {renderSortIcon("Grupo")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Beca")}>
                Beca {renderSortIcon("Beca")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("PorcentajeBeca")}>
                Beca % {renderSortIcon("PorcentajeBeca")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Profesor")}>
                Profesor {renderSortIcon("Profesor")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Rango")}>
                Rango {renderSortIcon("Rango")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("FechaInscripcion")}>
                Inscripción {renderSortIcon("FechaInscripcion")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("FechaBaja")}>
                Baja {renderSortIcon("FechaBaja")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Nick")}>
                Nick {renderSortIcon("Nick")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>
              <SortButton onClick={() => handleSort("Password")}>
                Password {renderSortIcon("Password")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>Acciones</div>
          </Table.Header>

          <Table.Body
            data={sortedStudents}
            render={(student) => (
              <StudentRow
                key={student.NumeroControl}
                student={student}
                onEdit={() => handlePrepareEdit(student)}
                onKardexClick={() => handlePrepareKardex(student)}
                onPrepareDelete={handlePrepareDelete}
              />
            )}
          />
        </Table>
      </TableContainer>

      <Modal.Window name="student-form">
        <CreateStudentForm
          studentToEdit={studentToEdit}
          numeroControlProp={nextNumeroControl}
          onCloseModal={handleCloseAndResetState}
        />
      </Modal.Window>

      <Modal.Window name="student-kardex">
        <StudentKardexView student={selectedStudentForKardex} />
      </Modal.Window>

      <Modal.Window name="delete-student">
        <ConfirmDelete
          resourceName={`estudiante ${studentToDelete?.Nombre || ""} ${
            studentToDelete?.ApellidoPaterno || ""
          }`}
          disabled={isDeleting}
          onConfirm={() => {
            if (studentToDelete?.NumeroControl) {
              mutateDelete(studentToDelete.NumeroControl);
            } else {
              toast.error("No se pudo identificar al estudiante a eliminar.");
              setStudentToDelete(null);
            }
          }}
          onCloseModal={() => setStudentToDelete(null)}
        />
      </Modal.Window>

      <Modal.Window name="birthdays-modal">
        <BirthdaysTable students={allStudents || []} />
      </Modal.Window>

      {!isLoading && sortedStudents.length === 0 && (
        <Empty resourceName="estudiantes con ese filtro" />
      )}
    </>
  );
}

export default StudentsTable;
