import Heading from "../ui/Heading";
import Row from "../ui/Row";
import ExpensesTable from "../features/expenses/ExpensesTable";

function Expenses() {
  return (
    <Row type="horizontal">
      <Heading as="h1">All Expenses</Heading>
      <ExpensesTable />
    </Row>
  );
}

export default Expenses;
