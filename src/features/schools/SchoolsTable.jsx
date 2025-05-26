import styled from "styled-components";
// import { useState, useContext } from "react";
// import Modal, { ModalContext } from "../../ui/Modal";
// import CreateEditSchoolForm from "./CreateEditSchoolForm";
import Button from "../../ui/Button";
import { IoMdAdd } from "react-icons/io";
import Menus from "../../ui/Menus";

import Spinner from "../../ui/Spinner";
import Table from "../../ui/Table"; // Assuming a reusable Table component exists
import SchoolRow from "./SchoolRow";
import Empty from "../../ui/Empty";

// Wrapper to enable horizontal scrolling
const TableWrapper = styled.div`
  overflow-x: auto;
  /* Add some margin or padding if needed */
`;

// Define the table container with specific styling
const TableContainer = styled.div`
  border: 1px solid var(--color-grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  /* overflow: hidden; /* REMOVE this if TableWrapper handles overflow */
`;

/**
 * Renders a table displaying a list of schools.
 *
 * @param {object} props - Component props.
 * @param {Array<object>} props.schools - Array of school objects to display.
 * @param {boolean} props.isLoading - Indicates if the school data is loading.
 * @param {Function} props.onSelect - Function to pass down to SchoolRow for handling selection.
 * @param {string} [props.selectedSchoolNombre] - The name of the currently selected school for highlighting.
 * @param {string} props.emptyMessage - Message to display if there are no schools.
 * @param {Function} props.onAdd - Function to handle adding a new school.
 * @param {Function} props.onEdit - Function to handle editing an existing school.
 */
function SchoolsTable({
  schools,
  isLoading,
  onSelect,
  selectedSchoolNombre,
  emptyMessage,
  onAdd,
  onEdit,
}) {
  // Show spinner while loading
  if (isLoading) return <Spinner />;

  // Show message if no schools are found
  if (!schools || schools.length === 0) {
    return <Empty resourceName={emptyMessage || "escuelas"} />;
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1.6rem",
        }}
      >
        <Button onClick={onAdd} variation="primary" size="medium">
          <IoMdAdd style={{ marginRight: "0.4rem" }} /> Agregar escuela
        </Button>
      </div>
      <Menus>
        <TableWrapper>
          <TableContainer role="table" aria-label="Lista de Escuelas">
            <Table columns="0.3fr 5.7fr 2.5fr 1fr 1fr 1fr 1fr 0.5fr">
              <Table.Header role="rowheader">
                <div style={{ gridColumn: "1 / 3" }}>Nombre</div>
                <div>Dirección</div>
                <div>Teléfono</div>
                <div>Zona Escolar</div>
                <div>Monto Alumno</div>
                <div>Grado Actual.</div>
                <div>Acciones</div>
              </Table.Header>
              <Table.Body
                data={schools}
                render={(school) => (
                  <SchoolRow
                    key={school.NombreEscuela}
                    school={school}
                    onEdit={onEdit}
                    onSelect={onSelect}
                    isSelected={school.NombreEscuela === selectedSchoolNombre}
                  />
                )}
              />
            </Table>
          </TableContainer>
        </TableWrapper>
      </Menus>
    </>
  );
}

export default SchoolsTable;
