import styled from "styled-components";
import { HiTrash } from "react-icons/hi2";

import Modal from "../../ui/Modal";
import ConfirmDelete from "../../ui/ConfirmDelete";
import Table from "../../ui/Table";
import Menus from "../../ui/Menus";
import { useDeleteBank } from "./useBanks";

// Styled component for the bank name
const BankName = styled.div`
  font-size: 1.4rem; /* Match style */
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

function BankRow({ bank }) {
  const { IDBanco: bankId, NombreBanco } = bank;
  const { isDeleting, deleteBank } = useDeleteBank();

  const menuId = `bank-actions-${bankId}`;
  const deleteModalName = `delete-bank-${bankId}`;

  return (
    <Table.Row>
      {/* Display Bank Name */}
      <BankName>{NombreBanco}</BankName>

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
                    aria-label={`Eliminar ${NombreBanco}`}
                  >
                    Eliminar
                  </Menus.Button>
                </Modal.Open>
              </Menus.List>
            </Menus.Menu>

            {/* Delete Confirmation Modal Window (defined inside this Modal context) */}
            <Modal.Window name={deleteModalName}>
              <ConfirmDelete
                resourceName={`banco ${NombreBanco}`}
                disabled={isDeleting}
                onConfirm={() => deleteBank(bankId)}
                aria-label={`Confirmar eliminación de ${NombreBanco}`}
              />
            </Modal.Window>
          </Modal>
        </Menus>
      </ActionsCell>
    </Table.Row>
  );
}

export default BankRow;
