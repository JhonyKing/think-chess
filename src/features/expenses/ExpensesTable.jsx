import styled from "styled-components";
import Spinner from "../../ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import getExpenses from "../../services/apiExpenses";
import ExpensesRow from "./ExpensesRow";

const Table = styled.div`
  border: 1px solid var(--color--grey-200);
  font-size: 1.4rem;
  background-color: var(--color-grey-80);
  border-radius: 7px;
  overflow: hidden;
`;

const TableHeader = styled.header`
  display: grid;
  grid-template-columns: 10rem 10rem 10rem 35rem 15rem 15rem 10rem 10rem;
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

function ExpensesTable() {
  const { isLoading, data: expenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: getExpenses,
  });

  if (isLoading) return <Spinner />;
  return (
    <Table role="table">
      <TableHeader role="row">
        <div>ID Gasto</div>
        <div>Razon</div>
        <div>Monto</div>
        <div>Nota</div>
        <div>Fecha y Hora</div>
        <div>Nombre Escuela</div>
        <div>ID Curso</div>
        <div>Grupo</div>
      </TableHeader>
      {expenses.map((expense) => (
        <ExpensesRow expense={expense} key={expense.GastoID} />
      ))}
    </Table>
  );
}

export default ExpensesTable;
