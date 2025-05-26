import styled from "styled-components";
import { HiCheckCircle, HiXCircle, HiPencil, HiTrash } from "react-icons/hi";
import { useContext } from "react";

import Table from "../../ui/Table";
import Modal from "../../ui/Modal";
import Menus from "../../ui/Menus";
import ConfirmDelete from "../../ui/ConfirmDelete";
import { useDeleteUser } from "./useDeleteUser";
import { ModalContext } from "../../ui/Modal";
import KardexUser from "./KardexUser";

// Define fixed width for columns for better alignment
const Name = styled.div`
  font-weight: 600;
  color: var(--color-grey-600);
  font-family: "Sono";
  width: 20rem; /* Increased width */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Type = styled.div`
  width: 15rem; /* Increased width */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const BooleanCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 9rem; /* Slightly increased width for boolean columns */

  & svg {
    width: 2rem;
    height: 2rem;
  }
`;

// Specific styled component for the 'Configuracion' cell to give it more width
const ConfiguracionCell = styled(BooleanCell)`
  width: 12rem; /* Increased width specifically for Configuracion */
`;

const PositiveIcon = styled(HiCheckCircle)`
  color: var(--color-green-700);
`;

const NegativeIcon = styled(HiXCircle)`
  color: var(--color-red-700);
`;

const ActionsCell = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  width: 8rem; /* Fixed width for actions */
`;

// Styled Trash Icon
const TrashIcon = styled(HiTrash)`
  color: var(--color-red-700); // Make icon red
  &:hover {
    color: var(--color-red-800);
  }
`;

/**
 * Renders a single row in the Users table.
 *
 * @param {{ user: object, onEdit: function }} props
 * @param {object} props.user - The user object for the row.
 * @param {function} props.onEdit - Function to call when the edit button is clicked.
 */
function UserRow({ user, onEdit }) {
  const { isDeleting, deleteUser } = useDeleteUser();
  const { open: openModal } = useContext(ModalContext);

  const {
    Nombre,
    TipoDeUsuario,
    Inicio,
    Asistencias,
    Gastos,
    Registro,
    Reportes,
    Escuelas,
    Estadisticas,
    Alumnos,
    Proveedores,
    Usuarios,
    Configuracion,
  } = user;

  const handleDelete = () => {
    deleteUser(Nombre);
  };

  const renderBooleanIcon = (value) =>
    value ? <PositiveIcon /> : <NegativeIcon />;

  const menuId = `user-actions-${Nombre}`;

  return (
    <Table.Row>
      <Name title={Nombre}>{Nombre}</Name>
      <Type title={TipoDeUsuario}>{TipoDeUsuario}</Type>
      <BooleanCell>{renderBooleanIcon(Inicio)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Asistencias)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Gastos)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Registro)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Reportes)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Escuelas)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Estadisticas)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Alumnos)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Proveedores)}</BooleanCell>
      <BooleanCell>{renderBooleanIcon(Usuarios)}</BooleanCell>
      <ConfiguracionCell>{renderBooleanIcon(Configuracion)}</ConfiguracionCell>

      <ActionsCell>
        <Menus>
          <Modal>
            <Menus.Menu>
              <Menus.Toggle id={menuId} />
              <Menus.List id={menuId}>
                <Menus.Button
                  icon={<HiPencil />}
                  onClick={() => {
                    onEdit(user);
                    openModal("user-form");
                  }}
                >
                  Editar
                </Menus.Button>

                <Modal.Open opens={`kardex-${Nombre}`}>
                  <Menus.Button icon={<HiCheckCircle />}>
                    Ver Kardex
                  </Menus.Button>
                </Modal.Open>

                <Modal.Open opens="delete-user-confirm">
                  <Menus.Button icon={<TrashIcon />}>Eliminar</Menus.Button>
                </Modal.Open>
              </Menus.List>
            </Menus.Menu>

            <Modal.Window name="delete-user-confirm">
              <ConfirmDelete
                resourceName={`usuario ${Nombre}`}
                disabled={isDeleting}
                onConfirm={handleDelete}
              />
            </Modal.Window>

            <Modal.Window name={`kardex-${Nombre}`}>
              <KardexUser user={user} />
            </Modal.Window>
          </Modal>
        </Menus>
      </ActionsCell>
    </Table.Row>
  );
}

export default UserRow;
