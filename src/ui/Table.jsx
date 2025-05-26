import { createContext, useContext } from "react";
import styled, { css } from "styled-components";

const StyledTable = styled.div`
  border: 1px solid var(--color-grey-200);

  font-size: 1.4rem;
  background-color: var(--color-grey-0);
  border-radius: 7px;
  min-width: max-content; /* Ensure table dictates its needed width */
  /* Remove overflow handling, parent (TableContainer) handles it */
  /* overflow-x: auto; */
`;

const CommonRow = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.columns};
  column-gap: 2.4rem;
  align-items: center;
  transition: none;
`;

const StyledHeader = styled(CommonRow)`
  padding: 1.6rem 2.4rem;

  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-100);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: var(--color-grey-600);
  /* Make header sticky within TableContainer */
  position: sticky;
  top: 0;
  z-index: 1;
`;

const StyledRow = styled(CommonRow)`
  padding: 1.2rem 2.4rem;

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }

  /* Default background */
  background-color: transparent;
  transition: background-color 0.1s ease-in-out;

  /* Apply hover only if NOT selected */
  &:hover {
    ${(props) =>
      !props.$isSelected && // Use $ prefix for transient prop
      css`
        background-color: var(--color-grey-50);
      `}
  }

  /* Apply selected style directly */
  ${(props) =>
    props.$isSelected && // Use $ prefix for transient prop
    css`
      background-color: var(--color-blue-100);

      &:hover {
        background-color: var(--color-blue-200);
      }
    `}
`;

const StyledBody = styled.section`
  margin: 0.4rem 0;
  /* No overflow or max-height needed here, parent handles it */
`;

const Footer = styled.footer`
  background-color: var(--color-grey-50);
  display: flex;
  justify-content: center;
  padding: 1.2rem;

  /* This will hide the footer when it contains no child elements. Possible thanks to the parent selector :has 🎉 */
  &:not(:has(*)) {
    display: none;
  }
`;

const Empty = styled.p`
  font-size: 1.6rem;
  font-weight: 500;
  text-align: center;
  margin: 2.4rem;
`;

// 2. Create Context
const TableContext = createContext();

// 3. Create Parent Component
function Table({ columns, children }) {
  return (
    <TableContext.Provider value={{ columns }}>
      <StyledTable role="table">{children}</StyledTable>
    </TableContext.Provider>
  );
}

// 4. Create Child Components
function Header({ children }) {
  const { columns } = useContext(TableContext);
  return (
    <StyledHeader role="rowheader" columns={columns} as="header">
      {children}
    </StyledHeader>
  );
}

function Row({ children, isSelected }) {
  const { columns } = useContext(TableContext);
  return (
    <StyledRow role="row" columns={columns} $isSelected={isSelected}>
      {children}
    </StyledRow>
  );
}

function Body({ data, render }) {
  if (!data?.length) return <Empty>No data to show at the moment</Empty>;

  return <StyledBody>{data.map(render)}</StyledBody>;
}

// 5. Add Child components as properties to parent component
Table.Header = Header;
Table.Row = Row;
Table.Body = Body;
Table.Footer = Footer; // Keep Footer export if needed elsewhere

export default Table;
