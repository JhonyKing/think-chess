//import getStudents from "../services/apiStudents";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import StudentsTable from "../features/students/StudentsTable";
//import Button from "../ui/Button";
//import { useState } from "react";
//import CreateStudentForm from "../features/students/CreateStudentForm";

function Students() {
  //const [showForm, setShowForm] = useState(false);

  return (
    <Row type="vertical">
      <Heading as="h1">Estudiantes</Heading>
      <StudentsTable />
    </Row>
  );
}

export default Students;
