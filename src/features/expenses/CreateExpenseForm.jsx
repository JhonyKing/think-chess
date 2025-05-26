import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useEffect } from "react"; // Import useEffect for reset
import toast from "react-hot-toast"; // Import toast

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import Select from "../../ui/Select";
import Textarea from "../../ui/Textarea";
import SpinnerMini from "../../ui/SpinnerMini";

import {
  useCreateExpense,
  useEditExpense,
  useMaxExpenseId,
} from "./useExpenses"; // Added useMaxExpenseId
import { useSuppliers } from "../suppliers/useSuppliers";
import { useSchools } from "../schools/useSchools"; // Check if path is correct

const StyledForm = styled(Form)`
  width: 80rem;
`;

const razonOptions = [
  { value: "Pago a Colegios", label: "Pago a Colegios" },
  { value: "Pago a Maestros", label: "Pago a Maestros" },
  { value: "Gasto Adicional", label: "Gasto Adicional" },
];

// Accept expenseToEdit prop (can be null)
function CreateExpenseForm({ expenseToEdit, onCloseModal }) {
  // Ensure we are working with an object, default to {} if expenseToEdit is null/undefined
  const currentExpense = expenseToEdit || {};
  // Destructure the guaranteed object
  const { GastoID: editId, ...editValuesDb } = currentExpense;
  const isEditSession = Boolean(editId);

  // Fetch max ID only if in "add" mode
  const {
    maxExpenseId,
    isLoading: isLoadingMaxId,
    error: errorMaxId,
  } = useMaxExpenseId({
    enabled: !isEditSession, // Only run query if not in edit session
  });

  // Prepare initial form values, mapping DB's NombreEscuela (FK ID) to form's IDEscuela field
  const initialFormValues = isEditSession
    ? {
        ...editValuesDb, // Spread all properties from the expense to edit
      }
    : {};

  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: initialFormValues,
  });
  const { errors } = formState;

  const { isCreating, createExpenseMutate } = useCreateExpense();
  const { isEditing, editExpenseMutate } = useEditExpense(); // Use edit hook
  const { isLoading: isLoadingSuppliers, suppliers } = useSuppliers();
  const { isLoading: isLoadingSchools, schools } = useSchools(); // Use schools hook

  const isWorking =
    isCreating ||
    isEditing ||
    isLoadingSuppliers ||
    isLoadingSchools ||
    (!isEditSession && isLoadingMaxId); // Consider isLoadingMaxId for disabling form during initial load in add mode

  // Reset form when expenseToEdit changes (for switching between add/edit)
  useEffect(() => {
    if (isEditSession) {
      reset(editValuesDb);
    } else {
      reset({});
    }
  }, [isEditSession, editId, reset]);

  // Prepare options
  const supplierOptions =
    suppliers?.map((supplier) => ({
      value: supplier.IDProveedor,
      label: supplier.NombreProveedor,
    })) || [];

  const schoolOptions =
    schools?.map((school) => ({
      value: school.NombreEscuela,
      label: school.NombreEscuela,
    })) || [];

  async function onSubmit(formData) {
    console.log("[CreateExpenseForm] formData crudo:", formData);
    const selectedSchoolName = formData.NombreEscuela;
    console.log(
      "[CreateExpenseForm] selectedSchoolName (formData.NombreEscuela):",
      selectedSchoolName
    );

    const finalSchoolNameToSubmit =
      selectedSchoolName && String(selectedSchoolName).trim() !== ""
        ? String(selectedSchoolName).trim()
        : null;
    console.log(
      "[CreateExpenseForm] finalSchoolNameToSubmit (después de trim/null check):",
      finalSchoolNameToSubmit
    );

    const parsedProveedorId = parseInt(formData.IDProveedor, 10);
    if (isNaN(parsedProveedorId) && formData.IDProveedor) {
      console.error("ID Proveedor inválido:", formData.IDProveedor);
      toast.error("El ID del proveedor no es válido.");
      return;
    }

    const commonPayload = {
      Razon: formData.Razon,
      Monto: parseFloat(formData.Monto),
      Nota: formData.Nota,
      FechaHora: formData.FechaHora,
      Grupo: formData.Grupo,
      NombreEscuela: finalSchoolNameToSubmit,
      IDProveedor: parsedProveedorId,
    };
    console.log(
      "[CreateExpenseForm] commonPayload antes de enviar:",
      commonPayload
    );

    if (isEditSession) {
      console.log(
        "[CreateExpenseForm] Editando Gasto. Payload:",
        commonPayload,
        "ID:",
        editId
      );
      editExpenseMutate(
        { newData: commonPayload, id: editId },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
          onError: (err) => {
            // Toast de error ya se maneja en el hook
            console.error(
              "[CreateExpenseForm] Error al editar gasto:",
              err.message
            );
          },
        }
      );
    } else {
      // CREATING A NEW EXPENSE
      if (isLoadingMaxId) {
        toast.error("Obteniendo ID de gasto, por favor espere un momento.");
        return;
      }
      if (errorMaxId) {
        toast.error(
          "No se pudo determinar el ID para el nuevo gasto. Revise la consola."
        );
        console.error(
          "[CreateExpenseForm] Error al obtener max GastoID:",
          errorMaxId
        );
        return;
      }

      const newGastoIdVal =
        (maxExpenseId === undefined ||
        maxExpenseId === null ||
        isNaN(Number(maxExpenseId))
          ? 0
          : Number(maxExpenseId)) + 1;
      console.log(
        "[CreateExpenseForm] Calculado newGastoIdVal:",
        newGastoIdVal,
        "(basado en maxExpenseId:",
        maxExpenseId,
        ")"
      );

      const finalPayloadForCreation = {
        ...commonPayload,
        GastoID: newGastoIdVal, // Clave JS estándar: GastoID
      };

      console.log(
        "[CreateExpenseForm] Payload FINAL para CREAR gasto (propiedad GastoID debe existir aquí):",
        finalPayloadForCreation
      );
      console.log(
        "[CreateExpenseForm] Verificando valor de GastoID en payload final:",
        finalPayloadForCreation.GastoID
      );

      createExpenseMutate(finalPayloadForCreation, {
        onSuccess: () => {
          reset();
          onCloseModal?.();
          // Invalidation of queries is handled in useCreateExpense hook
        },
        onError: (err) => {
          console.error(
            "[CreateExpenseForm] Error al crear gasto (desde form):",
            err.message
          );
        },
      });
    }
  }

  function onError(formErrors) {
    console.error("Errores de validación del formulario:", formErrors);
    toast.error("Por favor revise los errores en el formulario.");
  }

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit, onError)}>
      {/* Razon Select */}
      <FormRow label="Razón" error={errors?.Razon?.message}>
        <Select
          id="Razon"
          disabled={isWorking}
          options={razonOptions}
          {...register("Razon", { required: "Este campo es obligatorio" })}
        />
      </FormRow>

      {/* Proveedor Select */}
      <FormRow label="Proveedor" error={errors?.IDProveedor?.message}>
        <Select
          id="IDProveedor"
          disabled={isWorking || isLoadingSuppliers}
          options={supplierOptions}
          {...register("IDProveedor", {
            required: "Este campo es obligatorio",
          })}
        />
      </FormRow>
      {isLoadingSuppliers && <SpinnerMini />}

      {/* Escuela Select - use IDEscuela */}
      <FormRow label="Escuela" error={errors?.NombreEscuela?.message}>
        <Select
          id="NombreEscuela"
          disabled={isWorking || isLoadingSchools}
          options={[
            { value: "", label: "Seleccione Escuela (opcional)" },
            ...schoolOptions,
          ]}
          {...register("NombreEscuela")}
        />
      </FormRow>
      {isLoadingSchools && <SpinnerMini />}

      {/* Monto Input */}
      <FormRow label="Monto" error={errors?.Monto?.message}>
        <Input
          type="number"
          id="Monto"
          disabled={isWorking}
          step="0.01"
          {...register("Monto", {
            required: "Este campo es obligatorio",
            valueAsNumber: true,
            min: { value: 0, message: "El monto no puede ser negativo" },
          })}
        />
      </FormRow>

      {/* FechaHora Input */}
      <FormRow label="Fecha y Hora" error={errors?.FechaHora?.message}>
        <Input
          type="datetime-local"
          id="FechaHora"
          disabled={isWorking}
          {...register("FechaHora", { required: "Este campo es obligatorio" })}
        />
      </FormRow>

      {/* Grupo Input */}
      <FormRow label="Grupo" error={errors?.Grupo?.message}>
        <Input
          type="text"
          id="Grupo"
          disabled={isWorking}
          {...register("Grupo")}
        />
      </FormRow>

      {/* Nota Textarea */}
      <FormRow label="Nota" error={errors?.Nota?.message}>
        <Textarea id="Nota" disabled={isWorking} {...register("Nota")} />
      </FormRow>

      {/* Buttons */}
      <FormRow>
        <Button
          variation="secondary"
          type="reset"
          disabled={isWorking}
          onClick={() => onCloseModal?.()}
        >
          Cancelar
        </Button>
        <Button disabled={isWorking}>
          {isWorking
            ? "Guardando..."
            : isEditSession
            ? "Guardar Cambios"
            : "Agregar Gasto"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateExpenseForm;
