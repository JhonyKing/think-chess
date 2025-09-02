import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import SpinnerMini from "../../ui/SpinnerMini";
import Textarea from "../../ui/Textarea";
import Select from "../../ui/Select";
import { useSchools } from "../schools/useSchools";

const StyledForm = styled(Form)`
  width: 80rem;
`;

function CreateTeacherForm({ teacherToEdit, onCloseModal }) {
  const { MaestroID: editId, ...editValues } = teacherToEdit || {};
  const isEditSession = Boolean(editId);

  const { data: schools = [], isLoading: loadingSchools } = useSchools();

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession ? editValues : {},
  });

  const { errors, isSubmitting } = formState;

  // Mock mutation - replace with real API call
  const handleCreateEdit = async (data) => {
    try {
      // TODO: Implement real API call to MAESTROS table
      console.log("Teacher data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        isEditSession
          ? "Maestro actualizado exitosamente"
          : "Maestro registrado exitosamente"
      );

      onCloseModal?.();
      reset();
    } catch (error) {
      toast.error("Error al procesar el registro del maestro");
    }
  };

  if (loadingSchools) {
    return <SpinnerMini />;
  }

  return (
    <StyledForm onSubmit={handleSubmit(handleCreateEdit)}>
      <FormRow label="Nombre(s)" error={errors?.Nombre?.message}>
        <Input
          type="text"
          id="Nombre"
          disabled={isSubmitting}
          placeholder="María Elena"
          {...register("Nombre", {
            required: "El nombre es obligatorio",
          })}
        />
      </FormRow>

      <FormRow
        label="Apellido Paterno"
        error={errors?.ApellidoPaterno?.message}
      >
        <Input
          type="text"
          id="ApellidoPaterno"
          disabled={isSubmitting}
          placeholder="García"
          {...register("ApellidoPaterno", {
            required: "El apellido paterno es obligatorio",
          })}
        />
      </FormRow>

      <FormRow
        label="Apellido Materno"
        error={errors?.ApellidoMaterno?.message}
      >
        <Input
          type="text"
          id="ApellidoMaterno"
          disabled={isSubmitting}
          placeholder="López"
          {...register("ApellidoMaterno")}
        />
      </FormRow>

      <FormRow label="Especialidad" error={errors?.Especialidad?.message}>
        <Input
          type="text"
          id="Especialidad"
          disabled={isSubmitting}
          placeholder="Ajedrez Avanzado, Táctica"
          {...register("Especialidad", {
            required: "La especialidad es obligatoria",
          })}
        />
      </FormRow>

      <FormRow label="Teléfono" error={errors?.Telefono?.message}>
        <Input
          type="tel"
          id="Telefono"
          disabled={isSubmitting}
          placeholder="555-123-4567"
          {...register("Telefono", {
            pattern: {
              value: /^[\d\s\-()+-]+$/,
              message: "Formato de teléfono inválido",
            },
          })}
        />
      </FormRow>

      <FormRow label="Email" error={errors?.Email?.message}>
        <Input
          type="email"
          id="Email"
          disabled={isSubmitting}
          placeholder="maria.garcia@email.com"
          {...register("Email", {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Formato de email inválido",
            },
          })}
        />
      </FormRow>

      <FormRow label="Escuela Principal" error={errors?.NombreEscuela?.message}>
        <Select
          id="NombreEscuela"
          disabled={isSubmitting || loadingSchools}
          {...register("NombreEscuela")}
        >
          <option value="">Seleccionar escuela...</option>
          {schools.map((school) => (
            <option key={school.NombreEscuela} value={school.NombreEscuela}>
              {school.NombreEscuela}
            </option>
          ))}
        </Select>
      </FormRow>

      <FormRow label="Fecha de Ingreso" error={errors?.FechaIngreso?.message}>
        <Input
          type="date"
          id="FechaIngreso"
          disabled={isSubmitting}
          {...register("FechaIngreso")}
        />
      </FormRow>

      <FormRow label="Salario por Hora" error={errors?.SalarioPorHora?.message}>
        <Input
          type="number"
          step="0.01"
          id="SalarioPorHora"
          disabled={isSubmitting}
          placeholder="150.00"
          {...register("SalarioPorHora", {
            min: { value: 0, message: "El salario debe ser mayor o igual a 0" },
          })}
        />
      </FormRow>

      <FormRow label="Notas" error={errors?.Notas?.message}>
        <Textarea
          id="Notas"
          disabled={isSubmitting}
          placeholder="Información adicional sobre el maestro..."
          {...register("Notas")}
        />
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button disabled={isSubmitting}>
          {isSubmitting ? <SpinnerMini /> : null}
          {isEditSession ? "Actualizar maestro" : "Registrar maestro"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateTeacherForm;
