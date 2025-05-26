import styled from "styled-components";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { es } from "date-fns/locale/es"; // Import Spanish locale specifically
import { HiTrash, HiPencil } from "react-icons/hi2";
import { useContext } from "react";

import Table from "../../ui/Table";
import Modal, { ModalContext } from "../../ui/Modal";
import Menus from "../../ui/Menus";
import ConfirmDelete from "../../ui/ConfirmDelete";
import { useDeleteExpense } from "./useExpenses";
import Tag from "../../ui/Tag"; // For Razon
import { formatCurrency } from "../../utils/helpers"; // For formatting Monto

// Define column styles (Adjusted widths)
const RazonTag = styled.div`
  width: 12rem;
  display: flex;
  justify-content: center;
`;
const Monto = styled.div`
  width: 10rem;
  font-weight: 600;
  text-align: right;
`;
const Fecha = styled.div`
  width: 15rem;
`;
const Proveedor = styled.div`
  width: 15rem;
`;
const Escuela = styled.div`
  width: 15rem;
`;
const Grupo = styled.div`
  width: 10rem;
`;
const Nota = styled.div`
  width: 25rem;
  white-space: pre-wrap;
  word-wrap: break-word;
`;
const ActionsCell = styled.div`
  width: 5rem;
  display: flex;
  justify-content: center;
`;

const TrashIcon = styled(HiTrash)`
  color: var(--color-red-700);
  &:hover {
    color: var(--color-red-800);
  }
`;

// Helper to map Razon to Tag type
const razonToTagType = {
  "Pago a Colegios": "blue",
  "Pago a Maestros": "green",
  "Gasto Adicional": "silver",
};

function ExpenseRow({ expense, onEdit }) {
  // Ensure correct destructuring based on API response
  const {
    GastoID,
    Razon,
    Monto: montoValue,
    Nota: notaValue,
    FechaHora,
    NombreEscuela,
    Grupo: grupoValue,
    PROVEEDOR: proveedorData, // Destructure the joined object
  } = expense;

  // Safely access NombreProveedor
  const nombreProveedor = proveedorData?.NombreProveedor || "N/A";

  const { isDeleting, deleteExpenseMutate } = useDeleteExpense();
  const { open: openModal } = useContext(ModalContext);

  const menuId = `expense-actions-${GastoID}`;
  const deleteModalName = `delete-expense-${GastoID}`;

  // Format Date
  const formattedDate = FechaHora
    ? format(parseISO(FechaHora), "PPpp", { locale: es })
    : "N/A";

  return (
    <Table.Row>
      <Fecha title={formattedDate}>{formattedDate}</Fecha>
      <RazonTag>
        <Tag type={razonToTagType[Razon] || "default"}>{Razon || "N/A"}</Tag>
      </RazonTag>
      <Proveedor title={nombreProveedor}>{nombreProveedor}</Proveedor>
      <Escuela title={NombreEscuela}>{NombreEscuela || "N/A"}</Escuela>
      <Grupo title={grupoValue}>{grupoValue || "N/A"}</Grupo>
      <Monto>{formatCurrency(montoValue || 0)}</Monto>
      <Nota title={notaValue}>{notaValue || "N/A"}</Nota>

      {/* Actions */}
      <ActionsCell>
        <Menus>
          <Modal>
            {" "}
            {/* Local Modal for Delete */}
            <Menus.Menu>
              <Menus.Toggle id={menuId} />
              <Menus.List id={menuId}>
                <Menus.Button
                  icon={<HiPencil />}
                  onClick={() => {
                    onEdit(expense);
                    openModal("expense-form");
                  }}
                  aria-label={`Editar gasto ${GastoID}`}
                >
                  Editar
                </Menus.Button>
                <Modal.Open opens={deleteModalName}>
                  <Menus.Button
                    icon={<TrashIcon />}
                    aria-label={`Eliminar gasto ${GastoID}`}
                  >
                    Eliminar
                  </Menus.Button>
                </Modal.Open>
              </Menus.List>
            </Menus.Menu>
            <Modal.Window name={deleteModalName}>
              <ConfirmDelete
                resourceName={`gasto ID ${GastoID}`}
                disabled={isDeleting}
                onConfirm={() => deleteExpenseMutate(GastoID)}
              />
            </Modal.Window>
          </Modal>
        </Menus>
      </ActionsCell>
    </Table.Row>
  );
}

export default ExpenseRow;
