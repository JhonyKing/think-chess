import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import styled from "styled-components";

import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Select from "../../ui/Select";
import SpinnerMini from "../../ui/SpinnerMini";
import Heading from "../../ui/Heading";
import { createCourse } from "../../services/apiCourses";

const StyledCourseCreator = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 2.4rem 3.2rem;
  margin-bottom: 2rem; // Add margin if needed
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem 2.4rem; // Adjust gaps as needed
  margin-bottom: 1.6rem;
  align-items: start;
`;

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem; // Space between label and input
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 1.4rem; // Match FormRow label size if needed
`;

const Error = styled.span`
  font-size: 1.2rem; // Match FormRow error size
  color: var(--color-red-700);
`;

const weekdaysOptions = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

function CourseCreator({ schoolId }) {
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors } = formState;

  const queryClient = useQueryClient();

  const { mutate, isLoading: isCreating } = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success("Nuevo curso creado con éxito.");
      queryClient.invalidateQueries({ queryKey: ["courses", schoolId] });
      reset();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function onSubmit(data) {
    console.log("Submitting course data:", {
      ...data,
      NombreEscuela: schoolId,
    });
    mutate({ ...data, NombreEscuela: schoolId });
  }

  return (
    <StyledCourseCreator>
      <Heading as="h2" style={{ marginBottom: "1.6rem" }}>
        Crear Nuevo Curso
      </Heading>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          {/* Manual layout for Fecha de Inicio */}
          <FieldContainer>
            <Label htmlFor="InicioCurso">Fecha de Inicio</Label>
            <Input
              type="date"
              id="InicioCurso"
              disabled={isCreating}
              {...register("InicioCurso", {
                required: "La fecha de inicio es obligatoria",
              })}
            />
            {errors?.InicioCurso && <Error>{errors.InicioCurso.message}</Error>}
          </FieldContainer>

          {/* Manual layout for Fecha de Fin */}
          <FieldContainer>
            <Label htmlFor="FinCurso">Fecha de Fin</Label>
            <Input
              type="date"
              id="FinCurso"
              disabled={isCreating}
              {...register("FinCurso", {
                required: "La fecha de fin es obligatoria",
                // validate: (value, formValues) => value >= formValues.InicioCurso || "La fecha de fin debe ser posterior a la de inicio"
              })}
            />
            {errors?.FinCurso && <Error>{errors.FinCurso.message}</Error>}
          </FieldContainer>
        </FormGrid>

        <FormRow
          label="Día de Clase"
          error={errors?.DiaClase?.message}
          orientation="vertical"
        >
          <Select
            id="DiaClase"
            disabled={isCreating}
            options={weekdaysOptions}
            {...register("DiaClase", {
              required: "Selecciona un día de la semana",
            })}
          />
        </FormRow>

        <FormRow orientation="vertical">
          <Button
            disabled={isCreating}
            size="medium"
            style={{ alignSelf: "flex-end" }}
          >
            {isCreating ? <SpinnerMini /> : "Agregar Curso"}
          </Button>
        </FormRow>
      </Form>
    </StyledCourseCreator>
  );
}

export default CourseCreator;
