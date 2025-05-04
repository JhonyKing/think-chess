import Heading from "../ui/Heading";
import Row from "../ui/Row";
import SchoolLayout from "../features/schools/SchoolLayout";

function Schools() {
  return (
    <>
      <Row type="horizontal">
        <Heading as="h1">Gestión de Escuelas y Cursos</Heading>
        {/* Add filters or global actions here later if needed */}
      </Row>

      <SchoolLayout />
    </>
  );
}

export default Schools;
