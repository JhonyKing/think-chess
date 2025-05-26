import styled from "styled-components";
import { useState, useMemo } from "react";
import { IoMdAdd } from "react-icons/io";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";

import { useExpenses } from "./useExpenses";
import ExpenseRow from "./ExpenseRow";
import CreateExpenseForm from "./CreateExpenseForm";

import Table from "../../ui/Table";
import Spinner from "../../ui/Spinner";
import Modal from "../../ui/Modal";
import Button from "../../ui/Button";
import Empty from "../../ui/Empty";
import Input from "../../ui/Input"; // Use consistent casing if possible
import Menus from "../../ui/Menus"; // Needed if Table.Body uses it implicitly, or for context

// Container for scrollable table area
const TableContainer = styled.div`
  overflow: auto; /* Enable scroll */
  max-height: 75vh; /* Limit height like Students */
`;

// Container for filter/add controls
const TableOperations = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 1.6rem;
`;

// Button for sortable table headers
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

function ExpensesTable() {
  const { isLoading, expenses: allExpenses, error } = useExpenses();

  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "FechaHora", // Default sort by date
    direction: "desc", // Default descending
  });
  const [expenseToEdit, setExpenseToEdit] = useState(null); // Add state for editing

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];
    const searchTerm = filterValue.toLowerCase();
    if (!searchTerm) return allExpenses;
    return allExpenses.filter((expense) => {
      return (
        expense.Razon?.toLowerCase().includes(searchTerm) ||
        expense.PROVEEDOR?.NombreProveedor?.toLowerCase().includes(
          searchTerm
        ) ||
        expense.NombreEscuela?.toLowerCase().includes(searchTerm) ||
        expense.Grupo?.toLowerCase().includes(searchTerm) ||
        expense.Monto?.toString().toLowerCase().includes(searchTerm) ||
        expense.Nota?.toLowerCase().includes(searchTerm)
      );
    });
  }, [allExpenses, filterValue]);

  // Sort Logic
  const sortedExpenses = useMemo(() => {
    if (!filteredExpenses.length || !sortConfig.key) return filteredExpenses;
    return [...filteredExpenses].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for nested supplier name
      if (sortConfig.key === "PROVEEDOR.NombreProveedor") {
        aValue = a.PROVEEDOR?.NombreProveedor || "";
        bValue = b.PROVEEDOR?.NombreProveedor || "";
      }

      if (aValue === bValue) return 0;
      const direction = sortConfig.direction === "asc" ? 1 : -1;

      if (aValue === null || aValue === undefined) return 1 * direction;
      if (bValue === null || bValue === undefined) return -1 * direction;

      // Date sorting
      if (sortConfig.key === "FechaHora") {
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
      // Number sorting
      if (typeof aValue === "number") {
        return (aValue - bValue) * direction;
      }
      // String sorting (case-insensitive)
      if (typeof aValue === "string") {
        return (
          aValue.localeCompare(bValue, undefined, { sensitivity: "base" }) *
          direction
        );
      }
      return 0;
    });
  }, [filteredExpenses, sortConfig]);

  // Handlers
  const handleFilterChange = (e) => setFilterValue(e.target.value);
  const handleSort = (key) => {
    setSortConfig((current) => {
      const direction =
        current.key === key && current.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
  };
  const handleSetEditExpense = (expense) => setExpenseToEdit(expense); // Add handler
  const handleSetAddExpense = () => setExpenseToEdit(null); // Handler to clear edit state for Add
  const handleCloseModal = () => setExpenseToEdit(null); // Handler to reset state when modal closes

  // Helper to render sort icons
  const renderSortIcon = (field) => {
    if (sortConfig.key !== field) return null;
    return sortConfig.direction === "asc" ? <HiChevronUp /> : <HiChevronDown />;
  };

  // --- Render Logic ---
  if (isLoading) return <Spinner />;
  if (error) return <p>Error cargando gastos: {error.message}</p>;
  if (!allExpenses || allExpenses.length === 0)
    return <Empty resourceName="gastos" />;

  // Define column widths matching ExpenseRow adjustments
  const columnConfig = "15rem 12rem 15rem 15rem 10rem 10rem 25rem 5rem"; // Increased Nota width

  return (
    <Modal onClose={handleCloseModal}>
      {" "}
      {/* Pass reset handler to Modal */} {/* Modal context for Add Expense */}
      <TableOperations>
        <Input
          type="text"
          placeholder="Filtrar gastos..."
          value={filterValue}
          onChange={handleFilterChange}
          style={{ width: "30rem" }}
        />
        <div style={{ marginLeft: "auto" }}>
          <Modal.Open opens="expense-form">
            <Button
              variation="primary"
              size="medium"
              onClick={handleSetAddExpense}
              aria-label="Agregar nuevo gasto"
            >
              <IoMdAdd style={{ marginRight: "0.4rem" }} />
              Agregar Gasto
            </Button>
          </Modal.Open>
        </div>
      </TableOperations>
      <TableContainer>
        {/* Wrap Table in Menus if Rows use it */}
        <Menus>
          <Table columns={columnConfig}>
            <Table.Header>
              <div>
                <SortButton onClick={() => handleSort("FechaHora")}>
                  Fecha {renderSortIcon("FechaHora")}
                </SortButton>
              </div>
              <div>
                <SortButton onClick={() => handleSort("Razon")}>
                  Razón {renderSortIcon("Razon")}
                </SortButton>
              </div>
              <div>
                <SortButton
                  onClick={() => handleSort("PROVEEDOR.NombreProveedor")}
                >
                  Proveedor {renderSortIcon("PROVEEDOR.NombreProveedor")}
                </SortButton>
              </div>
              <div>
                <SortButton onClick={() => handleSort("NombreEscuela")}>
                  Escuela {renderSortIcon("NombreEscuela")}
                </SortButton>
              </div>
              <div>
                <SortButton onClick={() => handleSort("Grupo")}>
                  Grupo {renderSortIcon("Grupo")}
                </SortButton>
              </div>
              <div>
                <SortButton onClick={() => handleSort("Monto")}>
                  Monto {renderSortIcon("Monto")}
                </SortButton>
              </div>
              <div>
                <SortButton onClick={() => handleSort("Nota")}>
                  Nota {renderSortIcon("Nota")}
                </SortButton>
              </div>
              <div>Acciones</div>
            </Table.Header>
            <Table.Body
              data={sortedExpenses}
              render={(expense) => (
                <ExpenseRow
                  expense={expense}
                  key={expense.GastoID}
                  onEdit={handleSetEditExpense}
                />
              )}
            />
          </Table>
        </Menus>
      </TableContainer>
      {/* Unified Add/Edit Expense Modal Window */}
      <Modal.Window name="expense-form">
        <CreateExpenseForm
          expenseToEdit={expenseToEdit}
          onCloseModal={handleCloseModal}
        />
      </Modal.Window>
    </Modal>
  );
}

export default ExpensesTable;
