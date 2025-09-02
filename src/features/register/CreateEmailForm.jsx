import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import SpinnerMini from "../../ui/SpinnerMini";
import Textarea from "../../ui/Textarea";

const StyledForm = styled(Form)`
  width: 80rem;
`;

function CreateEmailForm({ emailToEdit, onCloseModal }) {
  const { EmailID: editId, ...editValues } = emailToEdit || {};
  const isEditSession = Boolean(editId);

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession ? editValues : {},
  });

  const { errors, isSubmitting } = formState;

  // Mock mutation - replace with real API call
  const handleCreateEdit = async (data) => {
    try {
      // TODO: Implement real API call to CORREO table
      console.log("Email data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        isEditSession
          ? "Configuración de correo actualizada exitosamente"
          : "Configuración de correo creada exitosamente"
      );

      onCloseModal?.();
      reset();
    } catch (error) {
      toast.error("Error al procesar la configuración de correo");
    }
  };

  return (
    <StyledForm onSubmit={handleSubmit(handleCreateEdit)}>
      <FormRow label="Servidor SMTP" error={errors?.ServidorSMTP?.message}>
        <Input
          type="text"
          id="ServidorSMTP"
          disabled={isSubmitting}
          placeholder="smtp.gmail.com"
          {...register("ServidorSMTP", {
            required: "El servidor SMTP es obligatorio",
          })}
        />
      </FormRow>

      <FormRow label="Puerto" error={errors?.Puerto?.message}>
        <Input
          type="number"
          id="Puerto"
          disabled={isSubmitting}
          placeholder="587"
          {...register("Puerto", {
            required: "El puerto es obligatorio",
            min: { value: 1, message: "El puerto debe ser mayor a 0" },
            max: { value: 65535, message: "El puerto debe ser menor a 65536" },
          })}
        />
      </FormRow>

      <FormRow label="Email de envío" error={errors?.EmailEnvio?.message}>
        <Input
          type="email"
          id="EmailEnvio"
          disabled={isSubmitting}
          placeholder="noreply@tuescuela.com"
          {...register("EmailEnvio", {
            required: "El email de envío es obligatorio",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Formato de email inválido",
            },
          })}
        />
      </FormRow>

      <FormRow label="Contraseña" error={errors?.Password?.message}>
        <Input
          type="password"
          id="Password"
          disabled={isSubmitting}
          placeholder="••••••••"
          {...register("Password", {
            required: isEditSession ? false : "La contraseña es obligatoria",
          })}
        />
      </FormRow>

      <FormRow
        label="Nombre del remitente"
        error={errors?.NombreRemitente?.message}
      >
        <Input
          type="text"
          id="NombreRemitente"
          disabled={isSubmitting}
          placeholder="Academia Piensa Ajedrez"
          {...register("NombreRemitente", {
            required: "El nombre del remitente es obligatorio",
          })}
        />
      </FormRow>

      <FormRow
        label="Email de respuesta"
        error={errors?.EmailRespuesta?.message}
      >
        <Input
          type="email"
          id="EmailRespuesta"
          disabled={isSubmitting}
          placeholder="contacto@tuescuela.com"
          {...register("EmailRespuesta", {
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Formato de email inválido",
            },
          })}
        />
      </FormRow>

      <FormRow label="Descripción" error={errors?.Descripcion?.message}>
        <Textarea
          id="Descripcion"
          disabled={isSubmitting}
          placeholder="Configuración de correo para notificaciones automáticas..."
          {...register("Descripcion")}
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
          {isEditSession ? "Actualizar configuración" : "Crear configuración"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateEmailForm;
