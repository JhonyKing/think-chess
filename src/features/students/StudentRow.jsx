// import { formatCurrency } from "../../utils/helpers";

// import CreateCabinForm from "./CreateCabinForm";
// import { useMutation } from "@tanstack/react-query";
// import {
//   deleteStudent,
//   deactivateStudent,
//   reactivateStudent,
// } from "../../services/apiStudents";

// import { HiPencil, HiTrash, HiSquare2Stack } from "react-icons/hi2";
// import { useCreateCabin } from "./useCreateCabin";
// import Modal from "../../ui/Modal";
// import ConfirmDelete from "../../ui/ConfirmDelete";
// import Table from "../../ui/Table";
// import Menus from "../../ui/Menus";

//import CreateStudentForm from "./CreateStudentForm";
import styled from "styled-components";
import { toast } from "react-hot-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import {
  HiPencil,
  HiTrash,
  HiArrowDownCircle,
  HiArrowUpCircle,
  HiEye,
} from "react-icons/hi2";
import { es } from "date-fns/locale";
import SpinnerMini from "../../ui/SpinnerMini";
import { useContext } from "react";
import { ModalContext } from "../../ui/Modal";
import Menus from "../../ui/Menus";
import {
  deactivateStudent,
  reactivateStudent,
} from "../../services/apiStudents";

const TableRow = styled.div`
  display: grid;
  /* Define grid-template-columns as a single string */
  grid-template-columns: 10rem 20rem 10rem 10rem 35rem 25rem 25rem 15rem 15rem 30rem 8rem 25rem 8rem 8rem 8rem 8rem 15rem 8rem 15rem 15rem 20rem 20rem 12rem;
  column-gap: 2.4rem;
  align-items: center;
  text-align: center;
  padding: 1.4rem 2.4rem;
  min-width: max-content;
  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }
  background-color: ${(props) =>
    props.$isDeactivated ? "var(--color-grey-100)" : "transparent"};
  color: ${(props) =>
    props.$isDeactivated ? "var(--color-grey-500)" : "inherit"};
`;

// const StudentStyled = styled.div`
//   font-size: 1.6rem;
//   font-weight: 600;
//   color: var(--color-grey-600);
//   font-family: "Sono";
// `;

const NoControlStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const NombreStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const ApellidoPaternoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const ApellidoMaternoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const NombreEscuelaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const FechaNacimientoStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const TelefonoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const CorreoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const ActivoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  text-align: center;
`;

const TutorStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const GradoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  text-align: center;
`;

const BecaStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  text-align: center;
`;

const ProfesorStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const RangoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const GrupoStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  text-align: center;
`;

const FechaInscripcionStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const FechaBajaStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const PorcentajeBecaStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  color: var(--color-green-700);
  text-align: center;
`;

// Temporarily comment out unused styled components
/* */
const Actions = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  align-items: center;
`;
/* */

// NEW STYLED COMPONENTS for new fields
const QuienRecogeStyled = styled.div`
  font-family: "Sono";
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const NickStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  color: var(--color-indigo-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

const PasswordStyled = styled.div`
  font-family: "Sono";
  font-weight: 600;
  color: var(--color-indigo-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
`;

// Temporarily comment out ActionButton definition
/* */
// const ActionButton = styled.button` // Remove unused component
//   background: none;
//   border: none;
//   padding: 0.4rem;
//   border-radius: var(--border-radius-sm);
//   transition: all 0.2s;
//   cursor: pointer;
//
//   &:hover {
//     background-color: var(--color-grey-100);
//   }
//   &:disabled {
//     cursor: not-allowed;
//     opacity: 0.5;
//   }
//
//   & svg {
//     width: 1.8rem;
//     height: 1.8rem;
//     color: var(--color-grey-500);
//     &:hover {
//       color: var(--color-grey-700);
//     }
//   }
// `;
/* */

function StudentRow({ student, onEdit, onKardexClick, onPrepareDelete }) {
  const { open: openModal } = useContext(ModalContext);
  const queryClient = useQueryClient();

  const { isLoading: isDeactivating, mutate: mutateDeactivate } = useMutation({
    mutationFn: deactivateStudent,
    onSuccess: () => {
      toast.success(`Estudiante desactivado`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const { isLoading: isReactivating, mutate: mutateReactivate } = useMutation({
    mutationFn: reactivateStudent,
    onSuccess: () => {
      toast.success(`Estudiante reactivado`);
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err) => toast.error(err.message),
  });

  const {
    NumeroControl,
    Nombre,
    ApellidoPaterno,
    ApellidoMaterno,
    NombreEscuela,
    QuienRecoge1,
    QuienRecoge2,
    FechaNacimiento,
    Telefono,
    Correo,
    Activo,
    Tutor,
    Grado,
    Grupo,
    Beca,
    PorcentajeBeca,
    Profesor,
    Rango,
    FechaInscripcion,
    FechaBaja,
    Nick,
    Password,
  } = student;
  const isDeactivated = !Activo && !!FechaBaja;
  const isProcessing = isDeactivating || isReactivating;

  const handleEdit = () => {
    if (onEdit) onEdit();
    openModal("student-form");
  };
  const handleKardex = () => {
    if (onKardexClick) onKardexClick();
    openModal("student-kardex");
  };
  const handleDeactivate = () => {
    mutateDeactivate(NumeroControl);
  };
  const handleReactivate = () => {
    mutateReactivate(NumeroControl);
  };
  const menuId = `student-${NumeroControl}`;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      // Using UTC timezone explicitly based on previous usage
      return formatInTimeZone(dateString, "UTC", "dd/MMM/yy", { locale: es });
    } catch (error) {
      console.error(
        "StudentRow formatDate error for input:",
        dateString,
        error
      );
      // Fallback for potentially invalid date strings
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return formatInTimeZone(date, "UTC", "dd/MMM/yy", { locale: es });
        }
      } catch (fallbackError) {
        console.error("StudentRow formatDate fallback error:", fallbackError);
      }
      return "Fecha inválida";
    }
  };
  const displayValue = (value) => value ?? "-";
  const displayBoolean = (value) =>
    value === null || value === undefined ? "-" : value ? "Sí" : "No";
  const displayPercentage = (value) =>
    value !== null && value !== undefined ? `${value}%` : "-";

  return (
    <TableRow role="row" $isDeactivated={isDeactivated}>
      <NoControlStyled>{displayValue(NumeroControl)}</NoControlStyled>
      <NombreStyled>{displayValue(Nombre)}</NombreStyled>
      <ApellidoPaternoStyled>
        {displayValue(ApellidoPaterno)}
      </ApellidoPaternoStyled>
      <ApellidoMaternoStyled>
        {displayValue(ApellidoMaterno)}
      </ApellidoMaternoStyled>
      <NombreEscuelaStyled title={NombreEscuela}>
        {displayValue(NombreEscuela)}
      </NombreEscuelaStyled>
      <QuienRecogeStyled title={QuienRecoge1}>
        {displayValue(QuienRecoge1)}
      </QuienRecogeStyled>
      <QuienRecogeStyled title={QuienRecoge2}>
        {displayValue(QuienRecoge2)}
      </QuienRecogeStyled>
      <FechaNacimientoStyled>
        {formatDate(FechaNacimiento)}
      </FechaNacimientoStyled>
      <TelefonoStyled>{displayValue(Telefono)}</TelefonoStyled>
      <CorreoStyled title={Correo}>{displayValue(Correo)}</CorreoStyled>
      <ActivoStyled>{displayBoolean(Activo)}</ActivoStyled>
      <TutorStyled title={Tutor}>{displayValue(Tutor)}</TutorStyled>
      <GradoStyled>{displayValue(Grado)}</GradoStyled>
      <GrupoStyled>{displayValue(Grupo)}</GrupoStyled>
      <BecaStyled>{displayBoolean(Beca)}</BecaStyled>
      <PorcentajeBecaStyled>
        {Beca ? displayPercentage(PorcentajeBeca) : "-"}
      </PorcentajeBecaStyled>
      <ProfesorStyled>{displayValue(Profesor)}</ProfesorStyled>
      <RangoStyled>{displayValue(Rango)}</RangoStyled>
      <FechaInscripcionStyled>
        {formatDate(FechaInscripcion)}
      </FechaInscripcionStyled>
      <FechaBajaStyled>{formatDate(FechaBaja)}</FechaBajaStyled>
      <NickStyled>{displayValue(Nick)}</NickStyled>
      <PasswordStyled>{displayValue(Password)}</PasswordStyled>

      <Actions>
        <Menus>
          <Menus.Menu>
            <Menus.Toggle id={menuId} disabled={isProcessing} />

            <Menus.List id={menuId}>
              <Menus.Button
                icon={<HiEye />}
                onClick={handleKardex}
                disabled={isProcessing}
              >
                Ver Kardex
              </Menus.Button>

              <Menus.Button
                icon={<HiPencil />}
                onClick={handleEdit}
                disabled={isProcessing}
              >
                Editar
              </Menus.Button>

              {/* Show Deactivate button if student is currently Active */}
              {Activo && (
                <Menus.Button
                  icon={<HiArrowDownCircle />}
                  onClick={handleDeactivate}
                  disabled={isProcessing}
                >
                  Desactivar
                </Menus.Button>
              )}
              {/* Show Reactivate button if student is currently Inactive */}
              {!Activo && (
                <Menus.Button
                  icon={<HiArrowUpCircle />}
                  onClick={handleReactivate}
                  disabled={isProcessing}
                >
                  Reactivar
                </Menus.Button>
              )}

              <Menus.Button
                icon={<HiTrash />}
                disabled={isProcessing}
                onClick={() => onPrepareDelete(student)}
              >
                Eliminar
              </Menus.Button>
            </Menus.List>
          </Menus.Menu>
        </Menus>
        {isProcessing && <SpinnerMini />}
      </Actions>
    </TableRow>
  );
}

export default StudentRow;

//const { isDeleting, deleteStudent } = useDeleteStudent();
//const { isCreating, createStudent } = useCreateStudent();
//   function handleDuplicate() {
//     createStudent({
//       name: `Copy of ${name}`,
//       maxCapacity,
//       regularPrice,
//       discount,
//       image,
//       description,
//     });
//   }

//   const {
//     id: cabinId,
//     name,
//     maxCapacity,
//     regularPrice,
//     discount,
//     image,
//     description,
//   } = cabin;

//   return (
//     <Table.Row role="row">
//       <Img src={image} />
//       <Cabin>{name}</Cabin>
//       <div>Fits up to {maxCapacity}</div>
//       <Price>{formatCurrency(regularPrice)}</Price>
//       {discount ? (
//         <Discount>{formatCurrency(discount)}</Discount>
//       ) : (
//         <span>&mdash;</span>
//       )}
//       <div>
//         <Modal>
//           <Menus.Menu>
//             <Menus.Toggle id={cabinId} />
//             <Menus.List id={cabinId}>
//               <Menus.Button icon={<HiSquare2Stack />} onClick={handleDuplicate}>
//                 Duplicate
//               </Menus.Button>
//               <Modal.Open opens="edit">
//                 <Menus.Button icon={<HiPencil />}>Edit</Menus.Button>
//               </Modal.Open>
//               <Modal.Open opens="delete">
//                 <Menus.Button icon={<HiTrash />}>Delete</Menus.Button>
//               </Modal.Open>
//             </Menus.List>

//             <Modal.Window name="edit">
//               <CreateCabinForm cabinToEdit={cabin} />
//             </Modal.Window>

//             <Modal.Window name="delete">
//               <ConfirmDelete
//                 resourceName="cabins"
//                 disabled={isDeleting}
//                 onConfirm={() => deleteCabin(cabinId)}
//               />
//             </Modal.Window>
//           </Menus.Menu>
//         </Modal>
//       </div>
//     </Table.Row>
//   );
// }

// export default CabinRow;

/*import styled from 'styled-components';
import { HiPencil, HiTrash, HiSquare2Stack } from 'react-icons/hi2';

import Menus from 'ui/Menus';
import Modal from 'ui/Modal';
import ConfirmDelete from 'ui/ConfirmDelete';
import Table from 'ui/Table';

import { formatCurrency } from 'utils/helpers';
import { useDeleteCabin } from './useDeleteCabin';
import { useCreateCabin } from './useCreateCabin';
import CreateCabinForm from './CreateCabinForm';

// v1
// const TableRow = styled.div`
//   display: grid;
//   grid-template-columns: 0.6fr 1.8fr 2.2fr 1fr 1fr 1fr;
//   column-gap: 2.4rem;
//   align-items: center;
//   padding: 1.4rem 2.4rem;

//   &:not(:last-child) {
//     border-bottom: 1px solid var(--color-grey-100);
//   }
// `;

const Img = styled.img`
  display: block;
  width: 6.4rem;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  object-position: center;
  /* transform: scale(1.66666) translateX(-2px); 
  transform: scale(1.5) translateX(-7px);
`;

const Cabin = styled.div`
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-grey-600);
  font-family: 'Sono';
`;

const Price = styled.div`
  font-family: 'Sono';
  font-weight: 600;
`;

const Discount = styled.div`
  font-family: 'Sono';
  font-weight: 500;
  color: var(--color-green-700);
`;

function CabinRow({ cabin }) {
  const {
    id: cabinId,
    name,
    maxCapacity,
    regularPrice,
    discount,
    image,
    description,
  } = cabin;

  const { mutate: deleteCabin, isLoading: isDeleting } = useDeleteCabin();
  const { mutate: createCabin } = useCreateCabin();

  function handleDuplicate() {
    createCabin({
      name: `${name} duplicate`,
      maxCapacity,
      regularPrice,
      discount,
      image,
      description,
    });
  }

  return (
    <Table.Row role='row'>
      <Img src={image} alt={`Cabin ${name}`} />

      <Cabin>{name}</Cabin>

      <div>Fits up to {maxCapacity} guests</div>

      <Price>{formatCurrency(regularPrice)}</Price>

      {discount ? (
        <Discount>{formatCurrency(discount)}</Discount>
      ) : (
        <span>&mdash;</span>
      )}

      <Modal>
        <Menus.Menu>
          <Menus.Toggle id={cabinId} />

          <Menus.List id={cabinId}>
            <Menus.Button icon={<HiSquare2Stack />} onClick={handleDuplicate}>
              Duplicate
            </Menus.Button>

            <Modal.Toggle opens='edit'>
              <Menus.Button icon={<HiPencil />}>Edit cabin</Menus.Button>
            </Modal.Toggle>

            {/* Now it gets a bit confusing... }
            <Modal.Toggle opens='delete'>
              <Menus.Button icon={<HiTrash />}>Delete cabin</Menus.Button>
            </Modal.Toggle>
          </Menus.List>
        </Menus.Menu>

        {/* This needs to be OUTSIDE of the menu, which in no problem. The compound component gives us this flexibility }
        <Modal.Window name='edit'>
          <CreateCabinForm cabinToEdit={cabin} />
        </Modal.Window>

        <Modal.Window name='delete'>
          <ConfirmDelete
            resource='cabin'
            onConfirm={() => deleteCabin(cabinId)}
            disabled={isDeleting}
          />
        </Modal.Window>
      </Modal>

      {/* <div>
        <ButtonWithConfirm
          title='Delete cabin'
          description='Are you sure you want to delete this cabin? This action can NOT be undone.'
          confirmBtnLabel='Delete'
          onConfirm={() => deleteCabin(cabinId)}
          disabled={isDeleting}
        >
          Delete
        </ButtonWithConfirm>

        <Link to={`/cabins/${cabinId}`}>Details &rarr;</Link>
      </div> }
    </Table.Row>
  );
}

export default CabinRow;

*/
