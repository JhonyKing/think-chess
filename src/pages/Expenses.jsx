import Heading from "../ui/Heading";
import Row from "../ui/Row";
import ExpensesTable from "../features/expenses/ExpensesTable";

function Expenses() {
  return (
    <>
      <Row
        type="horizontal"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Heading as="h1">Gastos</Heading>
      </Row>

      <Row>
        <ExpensesTable />
      </Row>
    </>
  );
}

export default Expenses;
