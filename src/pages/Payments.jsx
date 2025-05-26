import { useState } from "react";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import SchoolSelect from "../features/payments/SchoolSelect";
import CourseSelect from "../features/payments/CourseSelect";
import PaymentsTable from "../features/payments/PaymentsTable";
import Modal from "../ui/Modal";

function Payments() {
  const [schoolId, setSchoolId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <Modal>
      <Row type="vertical">
        <Heading as="h1">Pagos</Heading>
        <SchoolSelect onSelect={setSchoolId} />
        {schoolId && (
          <CourseSelect schoolId={schoolId} onSelect={setSelectedCourse} />
        )}
        {schoolId && selectedCourse && (
          <PaymentsTable course={selectedCourse} schoolId={schoolId} />
        )}
      </Row>
    </Modal>
  );
}

export default Payments;
