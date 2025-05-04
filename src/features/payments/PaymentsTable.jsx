import styled from "styled-components";
import Spinner from "../../ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import getPayments from "../../services/apiPayments";
import PaymentsRow from "./PaymentsRow";

const Table = styled.div`
  border: 1px solid var(--color--grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-80);
  border-radius: 7px;
  overflow: hidden;
`;

const TableHeader = styled.header`
  display: grid;
  grid-template-columns: 10rem 10rem 10rem 10rem 15rem 15rem 10rem 10rem 10rem 10rem 10rem 15rem 10rem;
  column-gap: 2.4rem;
  align-items: center;

  background-color: var(--color-grey-50);
  border-bottom: 1px solid var(--color-grey-100);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
  color: var(--color-grey-600);
  padding: 1.6rem 2.4rem;
`;

function PaymentsTable() {
  const { isLoading, data: payments } = useQuery({
    queryKey: ["payments"],
    queryFn: getPayments,
  });

  if (isLoading) return <Spinner />;
  return (
    <Table
      role="table"
      //columns="10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem 10rem "
      //columns="0.6fr 1.8fr 2.2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
    >
      <TableHeader role="row">
        <div># Recibo</div>
        <div># Control</div>
        <div>Monto</div>
        <div>Mes pagado</div>
        <div>Fecha/Hora</div>
        <div>Metodo de pago</div>
        <div>Nota</div>
        <div>Notificado</div>
        <div>Liquidado</div>
        <div>IDCurso</div>
        <div>Beca</div>
        <div>Cantidad de beca</div>
        <div>% Beca</div>
      </TableHeader>
      {payments.map((payment) => (
        <PaymentsRow payment={payment} key={payment.NumeroControl} />
      ))}
    </Table>
  );
}

export default PaymentsTable;
