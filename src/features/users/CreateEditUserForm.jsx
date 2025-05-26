import { useForm } from "react-hook-form";
import styled from "styled-components";
import { useEffect, useState } from "react";

import Input from "../../ui/Input";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import SpinnerMini from "../../ui/SpinnerMini";
import Heading from "../../ui/Heading";
import Select from "../../ui/Select";
import Spinner from "../../ui/Spinner";
import { useCreateUser } from "./useCreateUser";
import { useUpdateUser } from "./useUpdateUser";
import { useUserTypes } from "./useUserTypes";
import FileInput from "../../ui/FileInput";
import supabase, { supabaseUrl } from "../../services/supabase";

// Styled components for the form layout
const StyledForm = styled.form`
  padding: 2.4rem 4rem; /* Increased horizontal padding */
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  overflow: visible; /* Allow content to potentially overflow if needed, or adjust min-width */
  font-size: 1.4rem;
  width: 100%;
  min-width: 75rem; /* Significantly increased min-width */
`;

// Use multiple columns for checkboxes if needed, or keep single column
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(20rem, 1fr)
  ); // Responsive grid for fields
  gap: 1.6rem 2.4rem; // Row and column gap
  align-items: center;
`;

// Specific grid area for main fields - Force single column
const MainFields = styled.div`
  grid-column: 1 / -1; // Span all columns
  display: grid;
  grid-template-columns: 1fr; // Single column layout
  gap: 1.6rem; // Only vertical gap needed
`;

// Container for permission checkboxes
const PermissionsContainer = styled.fieldset`
  grid-column: 1 / -1; // Span all columns
  border: 1px solid var(--color-grey-200);
  border-radius: var(--border-radius-sm);
  padding: 1.6rem;
  margin-top: 1.6rem;

  legend {
    font-weight: 500;
    padding: 0 0.8rem;
    color: var(--color-grey-700);
  }
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(15rem, 1fr)
  ); // Adjust minmax as needed
  gap: 1.2rem 2rem; // Smaller gap for checkboxes
`;

const ButtonContainer = styled.div`
  grid-column: 1 / -1; // Span all columns
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 2.4rem;
`;

const AvatarPreview = styled.img`
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-grey-200);
  display: block;
  margin-bottom: 1.2rem;
`;

const permissionFields = [
  "Inicio",
  "Asistencias",
  "Gastos",
  "Registro",
  "Reportes",
  "Escuelas",
  "Estadisticas",
  "Alumnos",
  "Proveedores",
  "Usuarios",
  "Configuracion",
];

// Styled Heading for the form title
const FormTitle = styled(Heading)`
  font-size: 2.4rem; // Increased font size
  margin-bottom: 2.4rem;
  text-align: center;
`;

/**
 * Form component for creating or editing a user.
 *
 * @param {object} props
 * @param {object} [props.userToEdit={}] - The user object to edit. Defaults to empty object for create mode.
 * @param {function} [props.onCloseModal] - Function to close the containing modal.
 */
function CreateEditUserForm({ userToEdit, onCloseModal }) {
  const { createUser, isCreating } = useCreateUser();
  const { updateUser, isUpdating } = useUpdateUser();
  const {
    userTypes,
    isLoading: isLoadingTypes,
    error: errorTypes,
  } = useUserTypes();

  const currentUser = userToEdit || {};
  const { Nombre: editUserName } = currentUser;
  const isEditSession = Boolean(editUserName);

  const isWorking = isCreating || isUpdating || isLoadingTypes;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: isEditSession
      ? userToEdit
      : {
          Nombre: "",
          Contrasena: "",
          TipoDeUsuario: "",
          Inicio: false,
          Asistencias: false,
          Gastos: false,
          Registro: false,
          Reportes: false,
          Escuelas: false,
          Estadisticas: false,
          Alumnos: false,
          Proveedores: false,
          Usuarios: false,
          Configuracion: false,
        },
  });

  const [imagePreview, setImagePreview] = useState(
    userToEdit?.URLImagen || null
  );
  const imageField = watch("URLImagen");

  useEffect(() => {
    // Si el usuario selecciona un archivo, mostrar el preview SOLO si es un File
    if (imageField && imageField[0] instanceof File) {
      const file = imageField[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
    // Si no hay archivo seleccionado, mostrar la URL de la imagen original (si existe)
    if (userToEdit?.URLImagen) {
      setImagePreview(userToEdit.URLImagen);
    } else {
      setImagePreview(null);
    }
  }, [imageField, userToEdit?.URLImagen]);

  // Effect to reset form ONLY when the user to edit actually changes, or when switching modes
  useEffect(() => {
    if (isEditSession) {
      reset(userToEdit);
    } else {
      reset({
        Nombre: "",
        Contrasena: "",
        TipoDeUsuario: "",
        Inicio: false,
        Asistencias: false,
        Gastos: false,
        Registro: false,
        Reportes: false,
        Escuelas: false,
        Estadisticas: false,
        Alumnos: false,
        Proveedores: false,
        Usuarios: false,
        Configuracion: false,
      });
    }
  }, [userToEdit, reset]);

  /**
   * Handles form submission.
   * @param {object} data - Form data from react-hook-form.
   */
  async function onSubmit(data) {
    let imageUrl = userToEdit?.URLImagen || null;
    let fileToUpload = null;
    if (imageField && imageField[0]) {
      fileToUpload = imageField[0];
    }
    if (fileToUpload && typeof fileToUpload.name === "string") {
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${data.Nombre.replace(
        /\s+/g,
        "_"
      )}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, fileToUpload, { upsert: true });
      if (uploadError) {
        console.error("Supabase avatar upload error:", uploadError);
        alert(
          "Error al subir la imagen de avatar: " +
            (uploadError.message ||
              uploadError.error_description ||
              "Error desconocido")
        );
        return;
      }
      imageUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;
    }

    const userData = {
      ...data,
      URLImagen: imageUrl,
      ...permissionFields.reduce((acc, field) => {
        acc[field] = !!data[field];
        return acc;
      }, {}),
    };
    if (!userData.Contrasena) {
      delete userData.Contrasena;
    }
    const mutationOptions = {
      onSuccess: () => {
        reset();
        setImagePreview(null);
        onCloseModal?.();
      },
    };
    if (isEditSession) {
      updateUser(
        { userToUpdate: userData, userName: editUserName },
        mutationOptions
      );
    } else {
      createUser(userData, mutationOptions);
    }
  }

  /**
   * Handles form cancellation.
   */
  function handleCancel() {
    reset(); // Reset form fields
    onCloseModal?.(); // Close the modal
  }

  // Prepare options for the Select component
  const userTypeOptions = userTypes
    ? userTypes.map((type) => ({
        value: type.Funcion, // Use Funcion field
        label: type.Funcion, // Use Funcion field
      }))
    : [];

  // Depuración: mostrar valores en consola
  console.log("userToEdit.URLImagen", userToEdit?.URLImagen);
  console.log("imagePreview", imagePreview);

  if (isLoadingTypes) return <Spinner />;
  if (errorTypes)
    return <p>Error al cargar tipos de usuario: {errorTypes.message}</p>;

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      <FormTitle as="h3">
        {isEditSession
          ? `Editar Usuario: ${editUserName}`
          : "Crear Nuevo Usuario"}
      </FormTitle>

      <FormGrid>
        <MainFields>
          {/* Nombre de Usuario - Force vertical orientation */}
          <FormRow
            label="Nombre de Usuario"
            error={errors?.Nombre?.message}
            orientation="vertical"
          >
            <Input
              type="text"
              id="Nombre"
              disabled={isWorking || isEditSession}
              {...register("Nombre", {
                required: "Este campo es obligatorio",
              })}
            />
          </FormRow>

          {/* Contraseña - Force vertical orientation */}
          <FormRow
            label="Contraseña"
            error={errors?.Contrasena?.message}
            orientation="vertical"
          >
            <Input
              type="password"
              id="Contrasena"
              disabled={isWorking}
              {...register("Contrasena", {
                required: isEditSession
                  ? false
                  : "La contraseña es obligatoria al crear",
                minLength: {
                  value: isEditSession ? 0 : 6,
                  message: "La contraseña debe tener al menos 6 caracteres",
                },
              })}
              placeholder={
                isEditSession ? "Dejar en blanco para no cambiar" : ""
              }
            />
          </FormRow>

          {/* Tipo de Usuario - Force vertical orientation */}
          <FormRow
            label="Tipo de Usuario"
            error={errors?.TipoDeUsuario?.message}
            orientation="vertical"
          >
            <Select
              id="TipoDeUsuario"
              options={[
                { value: "", label: "Seleccione un tipo" },
                ...userTypeOptions,
              ]}
              disabled={isWorking}
              {...register("TipoDeUsuario", {
                required: "Este campo es obligatorio",
              })}
            />
          </FormRow>
        </MainFields>

        {/* Avatar preview y file input */}
        <FormRow label="Avatar" orientation="vertical" id="URLImagen">
          <div>
            {imagePreview && (
              <AvatarPreview src={imagePreview} alt="Avatar preview" />
            )}
            <FileInput
              id="URLImagen"
              accept="image/*"
              watchedValue={imageField}
              {...register("URLImagen")}
            />
          </div>
        </FormRow>

        {/* Permisos Checkboxes */}
        <PermissionsContainer>
          <legend>Permisos</legend>
          <PermissionsGrid>
            {permissionFields.map((field) => (
              <FormRow
                key={field}
                orientation="horizontal"
                labelSpacing="compact"
              >
                <Checkbox
                  id={field}
                  disabled={isWorking}
                  {...register(field)} // Register each checkbox
                >
                  {field} {/* Use field name as label */}
                </Checkbox>
              </FormRow>
            ))}
          </PermissionsGrid>
        </PermissionsContainer>

        {/* Buttons */}
        <ButtonContainer>
          <Button
            variation="secondary"
            type="button" // Important: type="button" to prevent form submission
            onClick={handleCancel}
            disabled={isWorking}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isWorking}>
            {isWorking ? (
              <SpinnerMini />
            ) : isEditSession ? (
              "Guardar Cambios"
            ) : (
              "Crear Usuario"
            )}
          </Button>
        </ButtonContainer>
      </FormGrid>
    </StyledForm>
  );
}

export default CreateEditUserForm;
