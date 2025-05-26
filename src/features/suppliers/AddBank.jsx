import styled from "styled-components";
import { useForm } from "react-hook-form";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import { useCreateBank } from "./useBanks";

// Styled component for the form
const StyledForm = styled(Form)`
  width: 60rem; /* Increased width from 40rem */
`;

function CreateBankForm({ onCloseModal }) {
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors } = formState;

  const { isCreating: isWorking, createBank } = useCreateBank();

  // Handle form submission
  function onSubmit(data) {
    createBank(data, {
      onSuccess: () => {
        reset();
        onCloseModal?.();
      },
    });
  }

  // Handle form errors
  function onError(errors) {
    console.error("Form errors:", errors);
  }

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit, onError)}>
      <FormRow label="Nombre del Banco" error={errors?.NombreBanco?.message}>
        <Input
          type="text"
          id="NombreBanco"
          disabled={isWorking}
          {...register("NombreBanco", {
            required: "Este campo es obligatorio",
          })}
          aria-invalid={errors.NombreBanco ? "true" : "false"}
          aria-describedby="NombreBancoError"
        />
      </FormRow>
      {errors.NombreBanco && (
        <span
          id="NombreBancoError"
          role="alert"
          style={{ color: "red", fontSize: "0.8rem" }}
        >
          {errors.NombreBanco.message}
        </span>
      )}

      {/* Add other fields for bank if needed here */}

      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          disabled={isWorking}
          onClick={() => onCloseModal?.()}
        >
          Cancelar
        </Button>
        <Button disabled={isWorking}>Agregar Banco</Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateBankForm;
