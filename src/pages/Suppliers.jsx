import Heading from "../ui/Heading";
import Row from "../ui/Row";
import SupplierTable from "../features/suppliers/SupplierTable";
import BankTable from "../features/suppliers/BankTable";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CreateSupplierForm from "../features/suppliers/AddSupplier";
import CreateBankForm from "../features/suppliers/AddBank";

function Suppliers() {
  const handleCloseModal = () => {
    // No state to reset now
  };

  return (
    <Modal onClose={handleCloseModal}>
      <Row
        type="horizontal"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.6rem",
        }}
      >
        <Heading as="h1">Proveedores</Heading>
        <Modal.Open opens="add-supplier">
          <Button>Agregar Proveedor</Button>
        </Modal.Open>
      </Row>
      <Row>
        <SupplierTable />
      </Row>

      <Row
        type="horizontal"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "2rem",
          marginBottom: "1.6rem",
        }}
      >
        <Heading as="h2">Bancos</Heading>
        <Modal.Open opens="add-bank">
          <Button>Agregar Banco</Button>
        </Modal.Open>
      </Row>
      <Row>
        <BankTable />
      </Row>

      <Modal.Window name="add-supplier">
        <CreateSupplierForm onCloseModal={handleCloseModal} />
      </Modal.Window>

      <Modal.Window name="add-bank">
        <CreateBankForm onCloseModal={handleCloseModal} />
      </Modal.Window>
    </Modal>
  );
}

export default Suppliers;
