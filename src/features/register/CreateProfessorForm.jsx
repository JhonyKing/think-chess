import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import SpinnerMini from "../../ui/SpinnerMini";
import Checkbox from "../../ui/Checkbox";
import { useCreateUser } from "../users/useCreateUser";
import { useUpdateUser } from "../users/useUpdateUser";

const StyledForm = styled(Form)`
  width: 80rem;
`;

function CreateProfessorForm({ professorToEdit, onCloseModal }) {
  const { Nombre: editId, ...editValues } = professorToEdit || {};
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession
      ? {
          ...editValues,
          TipoDeUsuario: "PROFESOR", // Siempre forzado como PROFESOR
        }
      : {
          TipoDeUsuario: "PROFESOR",
          Inicio: false,
          Asistencias: false,
          Gastos: false,
          Registro: false,
          Reportes: false,
          Escuelas: false,
          Estadisticas: false,
          Alumnos: true, // Los profesores normalmente pueden ver alumnos
          Proveedores: false,
          Usuarios: false,
          Configuracion: false,
        },
  });

  const { errors, isSubmitting } = formState;
  const { createUser, isCreating } = useCreateUser();
  const { updateUser, isUpdating } = useUpdateUser();

  // Real mutation for creating/updating professors
  const handleCreateEdit = async (data) => {
    try {
      // Forzar TipoDeUsuario como PROFESOR
      const professorData = {
        ...data,
        TipoDeUsuario: "PROFESOR",
      };

      if (isEditSession) {
        await updateUser({ userToUpdate: professorData, userName: editId });
        toast.success("Profesor actualizado exitosamente");
      } else {
        await createUser(professorData);
        toast.success("Profesor registrado exitosamente");
      }

      onCloseModal?.();
      reset();
    } catch (error) {
      toast.error(
        error.message || "Error al procesar el registro del profesor"
      );
    }
  };

  const actualIsSubmitting = isSubmitting || isCreating || isUpdating;

  return (
    <StyledForm onSubmit={handleSubmit(handleCreateEdit)}>
      <FormRow label="Nombre de usuario" error={errors?.Nombre?.message}>
        <Input
          type="text"
          id="Nombre"
          disabled={actualIsSubmitting || isEditSession}
          placeholder="profesor.garcia"
          {...register("Nombre", {
            required: "El nombre de usuario es obligatorio",
          })}
        />
        {isEditSession && (
          <small style={{ color: "var(--color-grey-500)" }}>
            El nombre de usuario no se puede cambiar
          </small>
        )}
      </FormRow>

      <FormRow label="Contraseña" error={errors?.Contrasena?.message}>
        <Input
          type="password"
          id="Contrasena"
          disabled={actualIsSubmitting}
          placeholder={
            isEditSession ? "Dejar en blanco para no cambiar" : "••••••••"
          }
          {...register("Contrasena", {
            required: isEditSession ? false : "La contraseña es obligatoria",
            minLength: {
              value: isEditSession ? 0 : 6,
              message: "La contraseña debe tener al menos 6 caracteres",
            },
          })}
        />
      </FormRow>

      {/* Tipo de Usuario - Mostrado pero deshabilitado */}
      <FormRow label="Tipo de Usuario">
        <Input
          type="text"
          value="PROFESOR"
          disabled={true}
          style={{ backgroundColor: "var(--color-grey-100)" }}
        />
        <small style={{ color: "var(--color-grey-500)" }}>
          Los profesores siempre tienen el tipo de usuario PROFESOR
        </small>
      </FormRow>

      {/* Permisos básicos para profesores */}
      <FormRow label="Permisos del profesor">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
        >
          <Checkbox
            id="Alumnos"
            disabled={actualIsSubmitting}
            {...register("Alumnos")}
          >
            Gestión de Alumnos
          </Checkbox>

          <Checkbox
            id="Asistencias"
            disabled={actualIsSubmitting}
            {...register("Asistencias")}
          >
            Control de Asistencias
          </Checkbox>

          <Checkbox
            id="Reportes"
            disabled={actualIsSubmitting}
            {...register("Reportes")}
          >
            Ver Reportes
          </Checkbox>

          <Checkbox
            id="Estadisticas"
            disabled={actualIsSubmitting}
            {...register("Estadisticas")}
          >
            Ver Estadísticas
          </Checkbox>
        </div>
      </FormRow>

      {/* Permisos administrativos (normalmente deshabilitados para profesores) */}
      <FormRow label="Permisos administrativos">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
        >
          <Checkbox
            id="Inicio"
            disabled={actualIsSubmitting}
            {...register("Inicio")}
          >
            Panel de Inicio
          </Checkbox>

          <Checkbox
            id="Gastos"
            disabled={actualIsSubmitting}
            {...register("Gastos")}
          >
            Gestión de Gastos
          </Checkbox>

          <Checkbox
            id="Registro"
            disabled={actualIsSubmitting}
            {...register("Registro")}
          >
            Registros
          </Checkbox>

          <Checkbox
            id="Escuelas"
            disabled={actualIsSubmitting}
            {...register("Escuelas")}
          >
            Gestión de Escuelas
          </Checkbox>

          <Checkbox
            id="Proveedores"
            disabled={actualIsSubmitting}
            {...register("Proveedores")}
          >
            Gestión de Proveedores
          </Checkbox>

          <Checkbox
            id="Usuarios"
            disabled={actualIsSubmitting}
            {...register("Usuarios")}
          >
            Gestión de Usuarios
          </Checkbox>

          <Checkbox
            id="Configuracion"
            disabled={actualIsSubmitting}
            {...register("Configuracion")}
          >
            Configuración
          </Checkbox>
        </div>
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          onClick={() => onCloseModal?.()}
          disabled={actualIsSubmitting}
        >
          Cancelar
        </Button>
        <Button disabled={actualIsSubmitting}>
          {actualIsSubmitting ? <SpinnerMini /> : null}
          {isEditSession ? "Actualizar profesor" : "Registrar profesor"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateProfessorForm;
