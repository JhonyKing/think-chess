import Heading from "../ui/Heading";
import Row from "../ui/Row";
import UsersTable from "../features/users/UsersTable";

/**
 * Renders the main page for User management.
 */
function Users() {
  return (
    // Using Row for consistent vertical layout spacing
    <Row type="vertical">
      {/* Page Title */}
      <Heading as="h1">Administración de Usuarios</Heading>

      {/* Users Table Component */}
      <UsersTable />
    </Row>
  );
}

export default Users;
