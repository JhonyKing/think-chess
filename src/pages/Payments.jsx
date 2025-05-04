import Heading from "../ui/Heading";
import Row from "../ui/Row";
import PaymentsTable from "../features/payments/PaymentsTable";

function Payments() {
  return (
    <Row type="horizontal">
      <Heading as="h1">All Payments</Heading>
      <PaymentsTable />
    </Row>
  );
}

export default Payments;
