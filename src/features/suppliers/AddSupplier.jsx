import styled from "styled-components";
import { useForm } from "react-hook-form";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import { useCreateSupplier } from "./useSuppliers";

// Styled component for the form
const StyledForm = styled(Form)`
  width: 60rem; /* Keep increased width */
`;

function CreateSupplierForm({ onCloseModal }) {
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors } = formState;

  const { isCreating: isWorking, createSupplier } = useCreateSupplier();

  // Handle form submission
  function onSubmit(data) {
    createSupplier(data, {
      onSuccess: () => {
        reset();
        onCloseModal?.();
      },
    });
  }

  // Handle form errors (optional, react-hook-form handles display)
  function onError(errors) {
    console.error("Form errors:", errors);
  }

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit, onError)}>
      <FormRow
        label="Nombre del Proveedor"
        error={errors?.NombreProveedor?.message}
      >
        <Input
          type="text"
          id="NombreProveedor"
          disabled={isWorking}
          {...register("NombreProveedor", {
            required: "Este campo es obligatorio",
          })}
          aria-invalid={errors.NombreProveedor ? "true" : "false"}
          aria-describedby="NombreProveedorError"
        />
      </FormRow>
      {errors.NombreProveedor && (
        <span
          id="NombreProveedorError"
          role="alert"
          style={{ color: "red", fontSize: "0.8rem" }}
        >
          {errors.NombreProveedor.message}
        </span>
      )}

      {/* Add other fields for supplier if needed here */}

      <FormRow>
        {/* type="reset" is important to reset the form */}
        <Button
          variation="secondary"
          type="reset"
          disabled={isWorking}
          onClick={() => onCloseModal?.()} // Add cancel button functionality
        >
          Cancelar
        </Button>
        <Button disabled={isWorking}>Agregar Proveedor</Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateSupplierForm;
