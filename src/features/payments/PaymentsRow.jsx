import styled from "styled-components";

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 10rem 10rem 10rem 10rem 15rem 15rem 10rem 10rem 10rem 10rem 10rem 15rem 10rem;
  column-gap: 2.4rem;
  align-items: center;
  padding: 0.3rem 2.4rem;
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }
`;

const NumeroReciboStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const NumeroControlStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const MontoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const MesPagadoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const FechaHoraStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const MetodoPagoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const NotaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const NotificadoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

const LiquidadoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

const IDCursoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

const BecaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
`;

const CantidadBecaStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

const PorcentajeBecaStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
`;

function PaymentsRow({ payment }) {
  const {
    NumeroRecibo,
    NumeroControl,
    Monto,
    MesPagado,
    FechaHora,
    MetodoPago,
    Nota,
    Notificado,
    Liquidado,
    IDCurso,
    CantidadBeca,
    PorcentajeBeca,
    Beca,
  } = payment;

  return (
    <TableRow role="row">
      <NumeroReciboStyled>{NumeroRecibo}</NumeroReciboStyled>
      <NumeroControlStyled>{NumeroControl}</NumeroControlStyled>
      <MontoStyled>{Monto}</MontoStyled>
      <MesPagadoStyled>{MesPagado}</MesPagadoStyled>
      <FechaHoraStyled>{FechaHora}</FechaHoraStyled>
      <MetodoPagoStyled>{MetodoPago}</MetodoPagoStyled>
      <NotaStyled>{Nota}</NotaStyled>
      <NotificadoStyled>{Notificado}</NotificadoStyled>
      <LiquidadoStyled>{Liquidado}</LiquidadoStyled>
      <IDCursoStyled>{IDCurso}</IDCursoStyled>
      <CantidadBecaStyled>{CantidadBeca}</CantidadBecaStyled>
      <PorcentajeBecaStyled>{PorcentajeBeca}</PorcentajeBecaStyled>
      <BecaStyled>{Beca}</BecaStyled>
    </TableRow>
  );
}

export default PaymentsRow;
