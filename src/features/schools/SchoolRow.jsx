import styled from "styled-components";
import { HiPencil, HiOfficeBuilding } from "react-icons/hi";

import Table from "../../ui/Table";
import Menus from "../../ui/Menus";

const IconAndName = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  color: var(--color-grey-600);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  grid-column: 1 / 3;
  cursor: pointer;
  padding: 0.8rem 0;
  margin: -0.8rem 0;
  border-radius: var(--border-radius-sm);

  /* Keep hover effect on the clickable area */
  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.8rem;
    height: 2.8rem;
    color: var(--color-brand-600);
    flex-shrink: 0;
  }
`;

// SchoolName no longer needs wrapping control, handled by IconAndName
const SchoolName = styled.div`
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  /* No white-space needed, handled by parent */
`;

const TextEllipsis = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px; /* Keep max-width or adjust as needed */
`;

const Amount = styled.div`
  font-family: "Sono", sans-serif;
  font-weight: 600;
  text-align: right;
  margin-right: 0.6rem;
  white-space: nowrap; /* Prevent wrapping */
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  /* This container itself shouldn't wrap, children might */
`;

// Generic div style for simple text cells like Zone, Grade
const SimpleTextCell = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Renders a single row in the Schools table.
 *
 * @param {object} props - Component props.
 * @param {object} props.school - The school data object for the row.
 * @param {Function} props.onEdit - Function to call when the edit button is clicked.
 * @param {Function} [props.onSelect] - Function to call when the row is clicked.
 * @param {boolean} [props.isSelected] - Whether this row is currently selected.
 */
function SchoolRow({ school, onEdit, onSelect, isSelected }) {
  const {
    NombreEscuela,
    Direccion,
    Telefono,
    ZonaEscolar,
    MontoPorAlumno,
    GradoActualizado,
  } = school;

  const handleSelect = () => {
    onSelect?.(school);
  };

  return (
    // Render Table.Row directly, passing isSelected
    <Table.Row
      key={`${school.NombreEscuela}-${isSelected}`}
      isSelected={isSelected}
    >
      <IconAndName
        onClick={handleSelect}
        title={`Seleccionar escuela ${NombreEscuela}`}
      >
        <HiOfficeBuilding aria-hidden="true" />
        <SchoolName>{NombreEscuela || "(Nombre Vacío)"}</SchoolName>
      </IconAndName>

      <TextEllipsis title={Direccion}>{Direccion || "-"}</TextEllipsis>
      <TextEllipsis title={Telefono}>{Telefono || "-"}</TextEllipsis>
      <SimpleTextCell>{ZonaEscolar || "-"}</SimpleTextCell>
      <Amount>{`$${MontoPorAlumno?.toFixed(2) ?? "0.00"}`}</Amount>
      <SimpleTextCell>{GradoActualizado || "-"}</SimpleTextCell>
      <ActionButtonContainer>
        <Menus.Menu>
          <Menus.Toggle id={`school-actions-${NombreEscuela}`} />
          <Menus.List id={`school-actions-${NombreEscuela}`}>
            <Menus.Button icon={<HiPencil />} onClick={() => onEdit(school)}>
              Editar
            </Menus.Button>
            {/* Aquí puedes agregar más acciones como Eliminar, Ver, etc. */}
          </Menus.List>
        </Menus.Menu>
      </ActionButtonContainer>
    </Table.Row>
  );
}

export default SchoolRow;
