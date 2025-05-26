import { useState, useMemo } from "react";
import styled from "styled-components"; // Add import for styled-components
import { IoMdAdd } from "react-icons/io";
import { HiChevronUp, HiChevronDown } from "react-icons/hi"; // Sort icons

import Table from "../../ui/Table";
import Spinner from "../../ui/Spinner";
import UserRow from "./UserRow";
import { useUsers } from "./useUsers";
import Modal from "../../ui/Modal"; // Import the compound Modal component
import CreateEditUserForm from "./CreateEditUserForm"; // Import the form directly
import Button from "../../ui/Button"; // Import Button
import Empty from "../../ui/Empty";
import Input from "../../ui/Input";

// Add a wrapper to handle horizontal scrolling if needed
const TableContainer = styled.div`
  overflow-x: auto; // Enable horizontal scrolling
  max-width: 100%; // Ensure it doesn't overflow its container vertically
`;

// Styled container for operations (filter)
const TableOperations = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 1.6rem;
`;

// Styled header cell button for sorting
const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600; // Match header font weight
  font-size: inherit; // Match header font size
  color: inherit; // Match header color
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

/**
 * Component to display the table of users.
 */
function UsersTable() {
  const { users: allUsers, isLoading, error } = useUsers();
  // State to hold the user being edited, null if creating
  const [userToEdit, setUserToEdit] = useState(null);

  // State for filtering
  const [filterValue, setFilterValue] = useState("");

  // State for sorting
  const [sortBy, setSortBy] = useState("Nombre"); // Default sort
  const [sortDirection, setSortDirection] = useState("asc");

  // Handlers for setting the user to edit
  const handleSetEditUser = (user) => {
    setUserToEdit(user);
  };

  const handleSetAddUser = () => {
    setUserToEdit(null);
  };

  // This function resets the state
  const handleCloseModalAndReset = () => {
    setUserToEdit(null);
  };

  const handleFilterChange = (e) => {
    setFilterValue(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle direction if same field is clicked
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      // Sort ascending by new field
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // --- Data Processing (Filtering & Sorting) ---
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    const lowerCaseFilter = filterValue.toLowerCase();
    if (!lowerCaseFilter) return allUsers;

    return allUsers.filter(
      (user) =>
        user.Nombre.toLowerCase().includes(lowerCaseFilter) ||
        user.TipoDeUsuario.toLowerCase().includes(lowerCaseFilter)
    );
  }, [allUsers, filterValue]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers]; // Create a copy to sort
    sorted.sort((a, b) => {
      const fieldA = a[sortBy];
      const fieldB = b[sortBy];

      let comparison = 0;
      if (typeof fieldA === "string") {
        comparison = fieldA.localeCompare(fieldB, undefined, {
          sensitivity: "base",
        });
      } else if (typeof fieldA === "boolean") {
        // Treat true as 1, false as 0 for sorting
        comparison = (fieldA ? 1 : 0) - (fieldB ? 1 : 0);
      } else {
        // Fallback for other types (though we only expect string/bool here)
        if (fieldA < fieldB) comparison = -1;
        if (fieldA > fieldB) comparison = 1;
      }

      return sortDirection === "asc" ? comparison : comparison * -1;
    });
    return sorted;
  }, [filteredUsers, sortBy, sortDirection]);

  // --- Render Logic ---
  if (isLoading) return <Spinner />;
  if (error) return <p>Error: {error.message}</p>;

  // Define column widths matching UserRow adjustments
  // Name(20) + Type(15) + 10*Boolean(9) + Configuracion(12) + Actions(8) + gaps
  const columnWidths = "20rem 15rem repeat(10, 9rem) 12rem 8rem";

  // Helper to render sort icons
  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortDirection === "asc" ? <HiChevronUp /> : <HiChevronDown />;
  };

  return (
    // Pass the reset handler to the Modal provider's onClose prop
    <Modal onClose={handleCloseModalAndReset}>
      {/* Operations Area (Filter + Add Button) */}
      <TableOperations>
        <Input
          type="text"
          placeholder="Filtrar por nombre o tipo..."
          value={filterValue}
          onChange={handleFilterChange}
          style={{ width: "30rem" }} // Give filter input some width
        />
        {/* Add Button Area (moved into operations) */}
        <div style={{ marginLeft: "auto" }}>
          {" "}
          {/* Push button to the right */}
          <Modal.Open opens="user-form">
            <Button
              variation="primary"
              size="medium"
              onClick={handleSetAddUser}
              aria-label="Agregar nuevo usuario"
            >
              <IoMdAdd style={{ marginRight: "0.4rem" }} />
              Agregar Usuario
            </Button>
          </Modal.Open>
        </div>
      </TableOperations>

      {/* Table Area */}
      <TableContainer>
        <Table columns={columnWidths}>
          <Table.Header>
            {/* Make headers sortable */}
            <div>
              <SortButton onClick={() => handleSort("Nombre")}>
                Nombre {renderSortIcon("Nombre")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("TipoDeUsuario")}>
                Tipo Usuario {renderSortIcon("TipoDeUsuario")}
              </SortButton>
            </div>
            {/* Add sorting for boolean columns too */}
            <div>
              <SortButton onClick={() => handleSort("Inicio")}>
                Inicio {renderSortIcon("Inicio")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Asistencias")}>
                Asistencias {renderSortIcon("Asistencias")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Gastos")}>
                Gastos {renderSortIcon("Gastos")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Registro")}>
                Registro {renderSortIcon("Registro")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Reportes")}>
                Reportes {renderSortIcon("Reportes")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Escuelas")}>
                Escuelas {renderSortIcon("Escuelas")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Estadisticas")}>
                Estadísticas {renderSortIcon("Estadisticas")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Alumnos")}>
                Alumnos {renderSortIcon("Alumnos")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Proveedores")}>
                Proveedores {renderSortIcon("Proveedores")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Usuarios")}>
                Usuarios {renderSortIcon("Usuarios")}
              </SortButton>
            </div>
            <div>
              <SortButton onClick={() => handleSort("Configuracion")}>
                Configuración {renderSortIcon("Configuracion")}
              </SortButton>
            </div>
            <div style={{ textAlign: "center" }}>Acciones</div>{" "}
            {/* Actions not sortable */}
          </Table.Header>

          <Table.Body
            data={sortedUsers} // Use filtered and sorted data
            render={(user) => (
              <UserRow
                key={user.Nombre}
                user={user}
                onEdit={handleSetEditUser} // Pass handler to set userToEdit
              />
            )}
          />
        </Table>
      </TableContainer>

      {/* Modal Window for the form */}
      <Modal.Window name="user-form">
        <CreateEditUserForm
          userToEdit={userToEdit}
          // Still pass it here for internal form cancellation/submission
          onCloseModal={handleCloseModalAndReset}
        />
      </Modal.Window>

      {/* Show Empty component only if filtered list is empty and there was no initial error */}
      {!isLoading && !error && sortedUsers.length === 0 && (
        <Empty resourceName="usuarios con ese filtro" />
      )}
    </Modal>
  );
}

export default UsersTable;
