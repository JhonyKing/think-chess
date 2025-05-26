import Spinner from "../../ui/Spinner";
import SupplierRow from "./SupplierRow";
import { useSuppliers } from "./useSuppliers";
import Table from "../../ui/Table";
import Menus from "../../ui/Menus";
import Empty from "../../ui/Empty";

function SupplierTable() {
  const { isLoading, suppliers, error } = useSuppliers();

  if (isLoading) return <Spinner />;
  if (error) {
    console.error("Error loading suppliers:", error);
    return <div>Error loading suppliers. Please check the console.</div>;
  }
  if (!suppliers || suppliers.length === 0)
    return <Empty resourceName="proveedores" />;

  return (
    <Menus>
      <Table columns="1fr 0.1fr">
        <Table.Header>
          <div>Nombre Proveedor</div>
          <div>Acciones</div>
        </Table.Header>

        <Table.Body
          data={suppliers}
          render={(supplier) => (
            <SupplierRow supplier={supplier} key={supplier.id} />
          )}
        />
      </Table>
    </Menus>
  );
}

export default SupplierTable;
