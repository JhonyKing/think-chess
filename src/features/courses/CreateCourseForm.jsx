import { useForm } from "react-hook-form";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Input from "../../ui/Input";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import Heading from "../../ui/Heading";
import { createCourse } from "../../services/apiCourses";
import Checkbox from "../../ui/Checkbox";
import Select from "../../ui/Select";
import { useSchools } from "../schools/useSchools";
import supabase from "../../services/supabase";

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
  const { data: schools = [], isLoading: loadingSchools } = useSchools();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      DiaClase: "LUNES",
      InicioCurso: "",
      FinCurso: "",
      NombreEscuela: selectedSchoolName || "",
      Activo: true,
    },
  });

  const selectedSchool = watch("NombreEscuela");

  const { mutate: createCourseMutate, isPending: isCreating } = useMutation({
    mutationFn: async (courseData) => {
      // Validación adicional en el frontend
      if (!courseData.NombreEscuela) {
        throw new Error("Debe seleccionar una escuela.");
      }

      // Validar fechas
      const startDate = new Date(courseData.InicioCurso);
      const endDate = new Date(courseData.FinCurso);
      if (endDate <= startDate) {
        throw new Error(
          "La fecha de fin debe ser posterior a la fecha de inicio."
        );
      }

      // Si el curso será activo, verificar si hay cursos activos y pedir confirmación
      if (courseData.Activo) {
        const { data: activeCourses, error: checkError } = await supabase
          .from("CURSO")
          .select("IDCurso, InicioCurso, FinCurso")
          .eq("NombreEscuela", courseData.NombreEscuela)
          .eq("Activo", true);

        if (checkError) {
          throw new Error(
            "Error al verificar cursos activos: " + checkError.message
          );
        }

        if (activeCourses && activeCourses.length > 0) {
          const confirmMessage = `¡ATENCIÓN!\n\nExisten ${activeCourses.length} curso(s) activo(s) en ${courseData.NombreEscuela}.\n\nAl crear este nuevo curso activo:\n- Se desactivarán automáticamente los cursos anteriores\n- Se inactivarán todos los estudiantes de esa escuela\n- Se actualizarán las bajas del mes actual\n\n¿Está seguro de que desea continuar?`;

          if (!window.confirm(confirmMessage)) {
            throw new Error("Operación cancelada por el usuario.");
          }
        }
      }

      // Crear el curso (toda la lógica de desactivación está en el servicio)
      return createCourse(courseData);
    },
    onSuccess: () => {
      toast.success(
        "¡Curso creado exitosamente! Se han aplicado los cambios correspondientes."
      );
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["schoolsList"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      reset();
      onCloseModal?.();
    },
    onError: (err) => {
      if (err.message === "Operación cancelada por el usuario.") {
        // No mostrar toast de error si el usuario canceló
        return;
      }
      toast.error(err.message || "No se pudo crear el curso.");
      console.error("Create course error:", err);
    },
  });

  function onSubmit(data) {
    if (!data.NombreEscuela) {
      toast.error("Debe seleccionar una escuela.");
      return;
    }

    const courseData = {
      DiaClase: data.DiaClase,
      InicioCurso: data.InicioCurso,
      FinCurso: data.FinCurso,
      NombreEscuela: data.NombreEscuela,
      Activo: !!data.Activo,
    };
    console.log("Submitting Course Data:", courseData);
    createCourseMutate(courseData);
  }

  function handleCancel() {
    reset();
    onCloseModal?.();
  }

  if (loadingSchools) {
    return <SpinnerMini />;
  }

  return (
    <>
      <Heading as="h2" style={{ marginBottom: "2.4rem", textAlign: "center" }}>
        {selectedSchoolName
          ? `Agregar Curso a ${selectedSchoolName}`
          : "Crear Nuevo Curso"}
      </Heading>
      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          {/* Selector de Escuela */}
          {!selectedSchoolName && (
            <FormRow label="Escuela" error={errors?.NombreEscuela?.message}>
              <Select
                id="NombreEscuela"
                disabled={isCreating}
                {...register("NombreEscuela", {
                  required: "La escuela es obligatoria",
                })}
              >
                <option value="">Seleccionar escuela...</option>
                {schools.map((school) => (
                  <option
                    key={school.NombreEscuela}
                    value={school.NombreEscuela}
                  >
                    {school.NombreEscuela}
                  </option>
                ))}
              </Select>
            </FormRow>
          )}

          {/* Día de Clase */}
          <FormRow label="Día de Clase" error={errors?.DiaClase?.message}>
            <Select
              id="DiaClase"
              disabled={isCreating}
              {...register("DiaClase", {
                required: "Día de clase es obligatorio",
              })}
            >
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Select>
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
                validate: (value) => {
                  const startDate = watch("InicioCurso");
                  if (startDate && value) {
                    return (
                      new Date(value) > new Date(startDate) ||
                      "La fecha de fin debe ser posterior a la fecha de inicio"
                    );
                  }
                  return true;
                },
              })}
              style={{ width: "100%" }}
            />
          </FormRow>

          {/* Activo Checkbox con advertencia */}
          <FormRow orientation="horizontal">
            <Checkbox id="Activo" disabled={isCreating} {...register("Activo")}>
              ¿Curso activo?
              {selectedSchool && (
                <small
                  style={{
                    display: "block",
                    color: "var(--color-orange-600)",
                    marginTop: "0.4rem",
                  }}
                >
                  ⚠️ Si activas este curso, se desactivarán automáticamente
                  todos los cursos activos de {selectedSchool} y sus
                  estudiantes.
                </small>
              )}
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
