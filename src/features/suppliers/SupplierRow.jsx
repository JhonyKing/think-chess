import styled from "styled-components";
import { HiTrash } from "react-icons/hi2";

import Modal from "../../ui/Modal";
import ConfirmDelete from "../../ui/ConfirmDelete";
import Table from "../../ui/Table";
import Menus from "../../ui/Menus";
import { useDeleteSupplier } from "./useSuppliers";

// Styled component for the supplier name
const SupplierName = styled.div`
  font-size: 1.4rem; /* Match Users table */
  font-weight: 600;
  color: var(--color-grey-600);
`;

// Styled Trash Icon (similar to UserRow)
const TrashIcon = styled(HiTrash)`
  color: var(--color-red-700);
  &:hover {
    color: var(--color-red-800);
  }
`;

const ActionsCell = styled.div`
  display: flex;
  justify-content: center;
  /* Add gap if needed */
`;

function SupplierRow({ supplier }) {
  const { IDProveedor: supplierId, NombreProveedor } = supplier;

  const { isDeleting, deleteSupplier } = useDeleteSupplier();

  const menuId = `supplier-actions-${supplierId}`;
  const deleteModalName = `delete-supplier-${supplierId}`;

  return (
    <Table.Row>
      {/* Display Supplier Name */}
      <SupplierName>{NombreProveedor}</SupplierName>

      <ActionsCell>
        <Menus>
          <Modal>
            <Menus.Menu>
              <Menus.Toggle id={menuId} />
              <Menus.List id={menuId}>
                {/* Delete Button: Uses Modal.Open */}
                <Modal.Open opens={deleteModalName}>
                  <Menus.Button
                    icon={<TrashIcon />}
                    aria-label={`Eliminar ${NombreProveedor}`}
                  >
                    Eliminar
                  </Menus.Button>
                </Modal.Open>
              </Menus.List>
            </Menus.Menu>

            {/* Delete Confirmation Modal Window (defined inside this Modal context) */}
            <Modal.Window name={deleteModalName}>
              <ConfirmDelete
                resourceName={`proveedor ${NombreProveedor}`}
                disabled={isDeleting}
                onConfirm={() => deleteSupplier(supplierId)}
                aria-label={`Confirmar eliminación de ${NombreProveedor}`}
              />
            </Modal.Window>
          </Modal>
        </Menus>
      </ActionsCell>
    </Table.Row>
  );
}

export default SupplierRow;
