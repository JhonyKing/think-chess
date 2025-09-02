import styled from "styled-components";
import Heading from "../ui/Heading";
import Row from "../ui/Row";
import Modal from "../ui/Modal";

// Existing form components
import CreateStudentForm from "../features/students/CreateStudentForm";
import AddBank from "../features/suppliers/AddBank";
import CreateEditSchoolForm from "../features/schools/CreateEditSchoolForm";
import CreateCourseForm from "../features/courses/CreateCourseForm";
import AddSupplier from "../features/suppliers/AddSupplier";
import CreateEditUserForm from "../features/users/CreateEditUserForm";

// New form components
import CreateEmailForm from "../features/register/CreateEmailForm";
import CreateEmailTemplateForm from "../features/register/CreateEmailTemplateForm";
import CreateProfessorForm from "../features/register/CreateProfessorForm";
import CreateUserTypeForm from "../features/register/CreateUserTypeForm";

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.4rem;
  margin-top: 2.4rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.6rem;
  }
`;

const RegistryCard = styled.div`
  background: var(--color-grey-0);
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-md);
  padding: 3.2rem 2.4rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  box-shadow: var(--shadow-sm);

  &:hover {
    background: var(--color-grey-50);
    border-color: var(--color-brand-200);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CardIcon = styled.div`
  font-size: 4.8rem;
  margin-bottom: 1.6rem;
`;

const CardTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-grey-700);
  text-align: center;
  margin-bottom: 0.8rem;
`;

const CardDescription = styled.p`
  font-size: 1.4rem;
  color: var(--color-grey-500);
  text-align: center;
  line-height: 1.4;
`;

const registryCards = [
  {
    id: "alumnos",
    title: "Alumnos",
    description: "Registrar nuevos estudiantes",
    icon: "👨‍🎓",
    modalName: "student-form",
    component: CreateStudentForm,
    hasImplementation: true,
  },
  {
    id: "bancos",
    title: "Bancos",
    description: "Agregar bancos para pagos",
    icon: "🏦",
    modalName: "bank-form",
    component: AddBank,
    hasImplementation: true,
  },
  {
    id: "correo",
    title: "Correos",
    description: "Configurar cuentas de correo",
    icon: "📧",
    modalName: "email-form",
    component: CreateEmailForm,
    hasImplementation: true,
  },
  {
    id: "escuelas",
    title: "Escuelas",
    description: "Registrar instituciones educativas",
    icon: "🏫",
    modalName: "school-form",
    component: CreateEditSchoolForm,
    hasImplementation: true,
  },
  {
    id: "cursos",
    title: "Cursos",
    description: "Crear cursos académicos",
    icon: "📚",
    modalName: "course-form",
    component: CreateCourseForm,
    hasImplementation: true,
  },
  {
    id: "plantillas",
    title: "Plantillas de Correo",
    description: "Crear templates de email",
    icon: "📋",
    modalName: "template-form",
    component: CreateEmailTemplateForm,
    hasImplementation: true,
  },
  {
    id: "profesores",
    title: "Profesores",
    description: "Registrar profesores",
    icon: "👨‍🏫",
    modalName: "professor-form",
    component: CreateProfessorForm,
    hasImplementation: true,
  },
  {
    id: "proveedores",
    title: "Proveedores",
    description: "Agregar proveedores",
    icon: "🚛",
    modalName: "supplier-form",
    component: AddSupplier,
    hasImplementation: true,
  },
  {
    id: "usuarios",
    title: "Usuarios",
    description: "Crear usuarios del sistema",
    icon: "👥",
    modalName: "user-form",
    component: CreateEditUserForm,
    hasImplementation: true,
  },
  {
    id: "tipos-usuarios",
    title: "Tipos de Usuario",
    description: "Definir roles de usuario",
    icon: "🔐",
    modalName: "user-type-form",
    component: CreateUserTypeForm,
    hasImplementation: true,
  },
];

function Register() {
  const handleCardClick = (card) => {
    if (!card.hasImplementation) {
      alert(
        `La funcionalidad de ${card.title} estará disponible próximamente.`
      );
      return;
    }
    // El modal se abrirá automáticamente cuando se haga click en Modal.Open
  };

  return (
    <Modal>
      <Row type="vertical">
        <Heading as="h1">Centro de Registros</Heading>
        <p style={{ color: "var(--color-grey-600)", fontSize: "1.6rem" }}>
          Selecciona la tabla donde deseas registrar nueva información
        </p>

        <CardsGrid>
          {registryCards.map((card) => (
            <Modal.Open
              key={card.id}
              opens={card.hasImplementation ? card.modalName : ""}
            >
              <RegistryCard
                onClick={() => handleCardClick(card)}
                style={{
                  opacity: card.hasImplementation ? 1 : 0.6,
                  cursor: card.hasImplementation ? "pointer" : "not-allowed",
                }}
              >
                <CardIcon>{card.icon}</CardIcon>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
                {!card.hasImplementation && (
                  <CardDescription
                    style={{
                      color: "var(--color-orange-600)",
                      fontWeight: 500,
                      marginTop: "0.8rem",
                    }}
                  >
                    Próximamente
                  </CardDescription>
                )}
              </RegistryCard>
            </Modal.Open>
          ))}
        </CardsGrid>
      </Row>

      {/* Modal Windows for each form */}
      {registryCards
        .filter((card) => card.hasImplementation && card.component)
        .map((card) => (
          <Modal.Window key={`modal-${card.id}`} name={card.modalName}>
            <card.component
              onCloseModal={() => {}}
              // Pass additional props based on form type
              {...(card.id === "student-form" && {
                studentToEdit: null,
                numeroControlProp: null,
              })}
              {...(card.id === "school-form" && {
                schoolToEdit: null,
              })}
              {...(card.id === "course-form" && {
                selectedSchoolName: null,
              })}
              {...(card.id === "professor-form" && {
                professorToEdit: null,
              })}
              {...(card.id === "user-form" && {
                userToEdit: null,
              })}
            />
          </Modal.Window>
        ))}
    </Modal>
  );
}

export default Register;
