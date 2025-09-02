import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import SpinnerMini from "../../ui/SpinnerMini";
import supabase from "../../services/supabase";

const StyledForm = styled(Form)`
  width: 60rem;
`;

function CreateUserTypeForm({ userTypeToEdit, onCloseModal }) {
  const { id: editId, ...editValues } = userTypeToEdit || {};
  const isEditSession = Boolean(editId);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: isEditSession ? editValues : {},
  });

  const { errors, isSubmitting } = formState;

  // Real mutation for creating/updating user types
  const { mutate: handleCreateEdit, isPending } = useMutation({
    mutationFn: async (data) => {
      if (isEditSession) {
        const { error } = await supabase
          .from("TIPODEUSUARIO")
          .update({ Funcion: data.Funcion })
          .eq("id", editId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("TIPODEUSUARIO")
          .insert([{ Funcion: data.Funcion }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEditSession
          ? "Tipo de usuario actualizado exitosamente"
          : "Tipo de usuario creado exitosamente"
      );
      queryClient.invalidateQueries({ queryKey: ["userTypes"] });
      onCloseModal?.();
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "Error al procesar el tipo de usuario");
    },
  });

  const actualIsSubmitting = isSubmitting || isPending;

  return (
    <StyledForm onSubmit={handleSubmit(handleCreateEdit)}>
      <FormRow label="Función" error={errors?.Funcion?.message}>
        <Input
          type="text"
          id="Funcion"
          disabled={actualIsSubmitting}
          placeholder="ADMINISTRADOR, PROFESOR, ASISTENTE, etc."
          {...register("Funcion", {
            required: "La función es obligatoria",
          })}
        />
        <small
          style={{
            color: "var(--color-grey-600)",
            marginTop: "0.8rem",
            display: "block",
          }}
        >
          Ejemplos: ADMINISTRADOR, PROFESOR, ASISTENTE, DIRECTOR, CONTADOR, etc.
        </small>
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
          {isEditSession ? "Actualizar función" : "Crear función"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateUserTypeForm;
