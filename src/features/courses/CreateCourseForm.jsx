import { useForm } from "react-hook-form";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Input from "../../ui/input";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import Heading from "../../ui/Heading";
import { createCourse } from "../../services/apiCourses";
import Checkbox from "../../ui/Checkbox";
import Select from "../../ui/Select";

// Basic form styling, similar to CreateEditSchoolForm
const StyledForm = styled.form`
  padding: 2.4rem 1rem;
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  font-size: 1.4rem;
  width: 100%;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* Single column */
  gap: 1.6rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 2.4rem;
`;

// Options for Day dropdown
const dayOptions = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

function CreateCourseForm({ selectedSchoolName, onCloseModal }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      DiaClase: "LUNES",
      InicioCurso: "",
      FinCurso: "",
      Activo: true,
    },
  });

  const { mutate: createCourseMutate, isPending: isCreating } = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success("Nuevo curso creado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      reset();
      onCloseModal?.();
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo crear el curso.");
      console.error("Create course error:", err);
    },
  });

  function onSubmit(data) {
    const courseData = {
      DiaClase: data.DiaClase,
      InicioCurso: data.InicioCurso,
      FinCurso: data.FinCurso,
      NombreEscuela: selectedSchoolName,
      Activo: !!data.Activo,
    };
    console.log("Submitting Course Data:", courseData);
    createCourseMutate(courseData);
  }

  function handleCancel() {
    reset();
    onCloseModal?.();
  }

  return (
    <>
      <Heading as="h2" style={{ marginBottom: "2.4rem", textAlign: "center" }}>
        Agregar Curso a {selectedSchoolName}
      </Heading>
      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          {/* Dia de Clase - Changed to Select */}
          <FormRow label="Día de Clase" error={errors?.DiaClase?.message}>
            <Select
              id="DiaClase"
              options={dayOptions}
              disabled={isCreating}
              {...register("DiaClase", {
                required: "Día de clase es obligatorio",
              })}
            />
          </FormRow>

          {/* Inicio Curso */}
          <FormRow
            label="Fecha Inicio Curso"
            error={errors?.InicioCurso?.message}
          >
            <Input
              type="date"
              id="InicioCurso"
              disabled={isCreating}
              {...register("InicioCurso", {
                required: "Fecha de inicio es obligatoria",
              })}
              style={{ width: "100%" }}
            />
          </FormRow>

          {/* Fin Curso */}
          <FormRow label="Fecha Fin Curso" error={errors?.FinCurso?.message}>
            <Input
              type="date"
              id="FinCurso"
              disabled={isCreating}
              {...register("FinCurso", {
                required: "Fecha de fin es obligatoria",
              })}
              style={{ width: "100%" }}
            />
          </FormRow>

          {/* Activo Checkbox */}
          <FormRow orientation="horizontal">
            <Checkbox id="Activo" disabled={isCreating} {...register("Activo")}>
              ¿Curso activo?
            </Checkbox>
          </FormRow>
        </FormGrid>

        <ButtonContainer>
          <Button
            variation="secondary"
            type="button"
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? <SpinnerMini /> : "Crear Nuevo Curso"}
          </Button>
        </ButtonContainer>
      </StyledForm>
    </>
  );
}

export default CreateCourseForm;
