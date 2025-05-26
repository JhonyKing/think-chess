import Spinner from "../../ui/Spinner";
import BankRow from "./BankRow";
import { useBanks } from "./useBanks";
import Table from "../../ui/Table";
import Menus from "../../ui/Menus";
import Empty from "../../ui/Empty";

function BankTable() {
  const { isLoading, banks, error } = useBanks();

  if (isLoading) return <Spinner />;
  if (error) {
    console.error("Error loading banks:", error);
    return <div>Error loading banks. Please check the console.</div>;
  }
  if (!banks || banks.length === 0) return <Empty resourceName="bancos" />;

  return (
    <Menus>
      <Table columns="1fr 0.1fr">
        <Table.Header>
          <div>Nombre Banco</div>
          <div>Acciones</div>
        </Table.Header>

        <Table.Body
          data={banks}
          render={(bank) => <BankRow bank={bank} key={bank.id} />}
        />
      </Table>
    </Menus>
  );
}

export default BankTable;
