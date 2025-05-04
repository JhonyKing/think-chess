import styled from "styled-components";

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 10rem 10rem 10rem 35rem 15rem 15rem 10rem 10rem;
  column-gap: 2.4rem;
  align-items: center;
  padding: 0.3rem 2.4rem;
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }
`;

const GastoIDStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const RazonStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const MontoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const NotaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const FechaHoraStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const NombreEscuelaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const IDCursoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const GrupoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

function ExpensesRow({ expense }) {
  const {
    GastoID,
    Razon,
    Monto,
    Nota,
    FechaHora,
    NombreEscuela,
    IDCurso,
    Grupo,
  } = expense;

  return (
    <TableRow role="row">
      <GastoIDStyled>{GastoID}</GastoIDStyled>
      <RazonStyled>{Razon}</RazonStyled>
      <MontoStyled>${Monto}</MontoStyled>
      <NotaStyled>{Nota}</NotaStyled>
      <FechaHoraStyled>{FechaHora}</FechaHoraStyled>
      <NombreEscuelaStyled>{NombreEscuela}</NombreEscuelaStyled>
      <IDCursoStyled>{IDCurso}</IDCursoStyled>
      <GrupoStyled>{Grupo}</GrupoStyled>
    </TableRow>
  );
}

export default ExpensesRow;
