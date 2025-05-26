import { useForm } from "react-hook-form";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HiPencil } from "react-icons/hi"; // Import icon for title
import { useState, useEffect, useMemo } from "react";
import supabase from "../../services/supabase";

import Input from "../../ui/input";
import FormRow from "../../ui/FormRow";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox"; // Assuming Checkbox component exists
import SpinnerMini from "../../ui/SpinnerMini";
import { createSchool, updateSchool } from "../../services/apiSchools";
import Heading from "../../ui/Heading";

// Styled components for the form layout
const StyledForm = styled.form`
  padding: 2.4rem 1rem; /* Reduce horizontal padding */
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  font-size: 1.4rem;
  width: 100%;
`;

// Use single column layout for better spacing in modal
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* Single column */
  gap: 1.6rem; /* Vertical gap between rows */
  align-items: center;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.4rem;

  & svg {
    width: 2.4rem; // Adjust icon size as needed
    height: 2.4rem;
    color: var(--color-brand-600); // Or another color
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 2.4rem;
`;

const StyledField = styled.div`
  margin-bottom: 1.6rem;
`;

async function uploadLogo(file, schoolName) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${schoolName.replace(
    /\s+/g,
    "_"
  )}_${Date.now()}.${fileExt}`;
  const { error } = await supabase.storage
    .from("logos")
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: publicUrlData } = supabase.storage
    .from("logos")
    .getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

function CreateEditSchoolForm({ schoolToEdit = {}, onCloseModal }) {
  const queryClient = useQueryClient();
  // Safeguard: Use an empty object if schoolToEdit is null/undefined
  const currentSchool = schoolToEdit || {};
  // const { NombreEscuela: editSchoolName, ...editValues } = currentSchool;
  // const isEditSession = Boolean(editSchoolName);
  const isEditSession = !!(
    schoolToEdit && Object.keys(schoolToEdit).length > 0
  );

  // Log to check props and values
  // console.log("Rendering CreateEditSchoolForm:");
  // console.log("  schoolToEdit:", schoolToEdit);
  // console.log("  isEditSession:", isEditSession);
  // console.log("  editValues for default:", editValues);

  const defaultFormValues = useMemo(
    () =>
      isEditSession
        ? { ...currentSchool, NombreEscuela: currentSchool.NombreEscuela }
        : {
            NombreEscuela: "",
            Direccion: "",
            Telefono: "",
            ZonaEscolar: "",
            Activo: false,
            MontoPorAlumno: 0,
            GradoActualizado: false,
          },
    [isEditSession, currentSchool]
  );
  // console.log("  defaultFormValues:", defaultFormValues);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  console.log("RENDER FORM: schoolToEdit", schoolToEdit);

  useEffect(() => {
    console.log("EFFECT: schoolToEdit cambió", schoolToEdit);

    const cleanValues = {
      NombreEscuela: schoolToEdit?.NombreEscuela || "",
      Direccion: schoolToEdit?.Direccion || "",
      Telefono: schoolToEdit?.Telefono || "",
      ZonaEscolar: schoolToEdit?.ZonaEscolar || "",
      Activo: !!schoolToEdit?.Activo,
      MontoPorAlumno: schoolToEdit?.MontoPorAlumno ?? 0,
      GradoActualizado: !!schoolToEdit?.GradoActualizado,
    };

    console.log("Valores enviados a reset:", cleanValues);

    if (schoolToEdit && Object.keys(schoolToEdit).length > 0) {
      reset(cleanValues, { keepDefaultValues: false });
    } else {
      reset(
        {
          NombreEscuela: "",
          Direccion: "",
          Telefono: "",
          ZonaEscolar: "",
          Activo: false,
          MontoPorAlumno: 0,
          GradoActualizado: false,
        },
        { keepDefaultValues: false }
      );
    }

    if (schoolToEdit?.URLLogo) {
      setLogoPreview(schoolToEdit.URLLogo);
      setLogoFile(null);
    } else {
      setLogoPreview(null);
      setLogoFile(null);
    }
    // eslint-disable-next-line
  }, [schoolToEdit]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  // Mutation for creating a school
  const { mutate: createMutate, isPending: isCreating } = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      toast.success("Nueva escuela creada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      reset();
      onCloseModal?.();
    },
    onError: (err) => {
      console.error("Create school error:", err);
      // Error toast is handled in the API function, but can add more specific ones here
      // toast.error(err.message || "Failed to create school.");
    },
  });

  // Mutation for updating a school
  const { mutate: updateMutate, isPending: isUpdating } = useMutation({
    mutationFn: ({ schoolData, schoolName }) =>
      updateSchool(schoolData, schoolName),
    onSuccess: () => {
      toast.success("Escuela actualizada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      reset(); // Reset form after successful update
      onCloseModal?.(); // Close modal on success
    },
    onError: (err) => {
      console.error("Update school error:", err);
      // Error toast is handled in the API function
      // toast.error(err.message || "Failed to update school.");
    },
  });

  const isWorking = isCreating || isUpdating;

  async function onSubmit(data) {
    const processedData = {
      ...data,
      MontoPorAlumno: Number(data.MontoPorAlumno) || 0,
      Activo: !!data.Activo,
      GradoActualizado: !!data.GradoActualizado,
    };
    try {
      let logoUrl = schoolToEdit?.URLLogo || "";
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, processedData.NombreEscuela);
      }
      processedData.URLLogo = logoUrl;
      if (isEditSession) {
        await updateMutate({
          schoolData: processedData,
          schoolName: currentSchool.NombreEscuela,
        });
      } else {
        await createMutate(processedData);
      }
    } catch (err) {
      toast.error("Error subiendo el logo: " + err.message);
    }
  }

  function handleCancel() {
    reset(); // Reset form fields
    setLogoPreview(null);
    setLogoFile(null);
    onCloseModal?.(); // Close the modal
  }

  return (
    <>
      {/* Title with Icon */}
      <TitleContainer>
        {isEditSession && <HiPencil aria-hidden="true" />}
        <Heading as="h2" style={{ margin: 0 }}>
          {" "}
          {/* Remove default margin from Heading */}
          {isEditSession ? "Editar Escuela" : "Agregar Nueva Escuela"}
        </Heading>
      </TitleContainer>

      <StyledForm onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          {/* Nombre de la Escuela */}
          <FormRow
            label="Nombre de la Escuela"
            error={errors?.NombreEscuela?.message}
          >
            <Input
              type="text"
              id="NombreEscuela"
              disabled={isWorking}
              {...register("NombreEscuela", {
                required: "Este campo es obligatorio",
              })}
              style={{ width: "25em" }}
            />
          </FormRow>

          {/* Dirección */}
          <FormRow label="Dirección" error={errors?.Direccion?.message}>
            <Input
              type="text"
              id="Direccion"
              disabled={isWorking}
              {...register("Direccion")}
              style={{ width: "25em" }}
            />
          </FormRow>

          {/* Teléfono */}
          <FormRow label="Teléfono" error={errors?.Telefono?.message}>
            <Input
              type="tel"
              id="Telefono"
              disabled={isWorking}
              {...register("Telefono")}
              style={{ width: "25em" }}
            />
          </FormRow>

          {/* Zona Escolar */}
          <FormRow label="Zona Escolar" error={errors?.ZonaEscolar?.message}>
            <Input
              type="text"
              id="ZonaEscolar"
              disabled={isWorking}
              {...register("ZonaEscolar")}
              style={{ width: "25em" }}
            />
          </FormRow>

          {/* Monto por Alumno */}
          <FormRow
            label="Monto por Alumno"
            error={errors?.MontoPorAlumno?.message}
          >
            <Input
              type="number"
              id="MontoPorAlumno"
              disabled={isWorking}
              {...register("MontoPorAlumno", {
                min: {
                  value: 0,
                  message: "El monto debe ser un número positivo",
                },
                valueAsNumber: true,
              })}
              step="0.01"
              style={{ width: "25em" }}
            />
          </FormRow>

          {/* Grado Actualizado - Changed to Checkbox */}
          <FormRow
            label="Grado Actualizado"
            error={errors?.GradoActualizado?.message}
            orientation="horizontal"
          >
            <Checkbox
              id="GradoActualizado"
              disabled={isWorking}
              {...register("GradoActualizado")} // Register as boolean
            >
              ¿Grado actualizado?
            </Checkbox>
            {/* Removed the old Input */}
          </FormRow>

          {/* Activa Checkbox - already correct */}
          <FormRow orientation="horizontal">
            <Checkbox id="Activo" disabled={isWorking} {...register("Activo")}>
              ¿Escuela activa?
            </Checkbox>
          </FormRow>

          <StyledField>
            <label htmlFor="logo">Logo de la escuela:</label>
            <input
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoChange}
              style={{ marginBottom: "0.8rem" }}
            />
            {logoPreview && (
              <img
                src={logoPreview}
                alt="Previsualización logo"
                style={{
                  maxWidth: "120px",
                  maxHeight: "80px",
                  objectFit: "contain",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  marginBottom: "0.8rem",
                }}
              />
            )}
          </StyledField>
        </FormGrid>

        <ButtonContainer>
          <Button
            variation="secondary"
            type="button"
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
              "Crear Nueva Escuela"
            )}
          </Button>
        </ButtonContainer>
      </StyledForm>
    </>
  );
}

export default CreateEditSchoolForm;
