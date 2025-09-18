import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import { createEditStudent, getStudents } from "../../services/apiStudents";
import { getSchoolsList } from "../../services/apiSchools";
import { getProfessors } from "../../services/apiProfessors";
import FileInput from "../../ui/FileInput";
import Select from "../../ui/Select";
import SpinnerMini from "../../ui/SpinnerMini";
import { useControlNumber } from "./useControlNumber";
import { useSendEmailWithTemplate } from "../emails/useSendEmail";

const StyledForm = styled(Form)`
  width: 100%;
  padding: 3rem;

  & > * {
    width: 100%;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.$columns || "1fr 1fr 1fr"};
  gap: 2rem;
  margin-bottom: 2.4rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 3.2rem;
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 0.4rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const ImgPreview = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius-sm);
  margin-top: 1rem;
`;

const BecaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1.6rem;
  margin-top: 1rem;
`;

const ErrorSpan = styled.span`
  font-size: 1.2rem;
  color: var(--color-red-700);
  margin-top: 0.4rem;
`;

function CreateStudentForm({
  studentToEdit = {},
  onCloseModal,
  numeroControlProp,
}) {
  // Obtener datos frescos de todos los estudiantes cuando estamos editando
  const {
    data: allStudents = [],
    isLoading: isLoadingStudents,
    error: studentsError,
  } = useQuery({
    queryKey: ["students"],
    queryFn: getStudents,
    enabled: Boolean(studentToEdit?.NumeroControl), // Solo ejecutar si estamos editando
  });

  // Buscar el estudiante actualizado en los datos frescos
  const freshStudent = allStudents.find(
    (s) => s.NumeroControl === studentToEdit?.NumeroControl
  );

  // Usar datos frescos si están disponibles, sino usar los props como fallback
  const currentStudent = freshStudent || studentToEdit || {};

  const {
    NumeroControl: editNumeroControl,
    URLImagen: existingImageUrl,
    PorcentajeBeca: existingPorcentajeBeca,
    Tutor: existingTutor,
    NombreEscuela: existingSchoolName,
    ...editValues
  } = currentStudent;
  const isEditSession = Boolean(editNumeroControl);

  // Hook para generar número de control automáticamente (solo para nuevos estudiantes)
  const {
    nextControlNumber,
    isLoading: isGeneratingControlNumber,
    error: controlNumberError,
  } = useControlNumber();

  const [imagePreview, setImagePreview] = useState(existingImageUrl || null);

  // Estados para modal de confirmación de email de bienvenida
  // Variables de email eliminadas - ahora se envía automáticamente

  // Hook para envío de emails
  const { sendEmail, isSending } = useSendEmailWithTemplate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: isEditSession
      ? {
          NumeroControl: editNumeroControl,
          ...editValues,
          NombreEscuela: existingSchoolName,
          Tutor: existingTutor,
          PorcentajeBeca: existingPorcentajeBeca ?? 0,
        }
      : {
          Activo: true,
          PorcentajeBeca: 0,
          NombreEscuela: "",
          NumeroControl: "", // Se generará automáticamente
        },
  });

  const hasBeca = watch("Beca");
  const imageField = watch("URLImagen");

  useEffect(() => {
    if (imageField && imageField[0]) {
      const file = imageField[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      return () => URL.revokeObjectURL(previewUrl);
    } else if (!isEditSession) {
      setImagePreview(null);
    } else if (isEditSession && !imageField) {
      setImagePreview(existingImageUrl || null);
    }
  }, [imageField, isEditSession, existingImageUrl]);

  // Efecto para establecer el número de control generado automáticamente
  useEffect(() => {
    if (!isEditSession && nextControlNumber) {
      setValue("NumeroControl", nextControlNumber);
    }
  }, [nextControlNumber, isEditSession, setValue]);

  // Mantener compatibilidad con el prop numeroControlProp (legacy)
  useEffect(() => {
    if (!isEditSession && numeroControlProp && !nextControlNumber) {
      setValue("NumeroControl", numeroControlProp);
    }
  }, [numeroControlProp, isEditSession, setValue, nextControlNumber]);

  // Actualizar el formulario cuando lleguen datos frescos del estudiante
  useEffect(() => {
    if (isEditSession && freshStudent && !isLoadingStudents) {
      reset({
        NumeroControl: freshStudent.NumeroControl,
        ...freshStudent,
        NombreEscuela: freshStudent.NombreEscuela,
        Tutor: freshStudent.Tutor,
        PorcentajeBeca: freshStudent.PorcentajeBeca ?? 0,
      });
    }
  }, [freshStudent, isEditSession, isLoadingStudents, reset]);

  useEffect(() => {
    if (!hasBeca) {
      setValue("PorcentajeBeca", 0);
    }
  }, [hasBeca, setValue]);

  const queryClient = useQueryClient();

  const {
    data: schoolsData,
    isLoading: isLoadingSchools,
    error: schoolsError,
  } = useQuery({
    queryKey: ["schoolsList"],
    queryFn: getSchoolsList,
  });

  const {
    data: professorsData,
    isLoading: isLoadingProfessors,
    error: professorsError,
  } = useQuery({
    queryKey: ["professorsList"],
    queryFn: getProfessors,
  });

  const { mutate: createStudent, isLoading: isCreating } = useMutation({
    mutationFn: createEditStudent,
    onSuccess: (createdStudent) => {
      toast.success("Nuevo Alumno creado con éxito");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["activeStudentsCount"] }); // Actualizar contador
      // Los estudiantes están relacionados con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });

      // Si el nuevo alumno tiene correo, preguntar si desea enviar correo de bienvenida
      if (createdStudent && createdStudent.Correo) {
        const confirmarBienvenida = window.confirm(
          `¿Deseas enviar un correo de bienvenida a ${createdStudent.Nombre} ${createdStudent.ApellidoPaterno}?\n\nCorreo: ${createdStudent.Correo}\nEscuela: ${createdStudent.NombreEscuela}`
        );

        if (confirmarBienvenida) {
          sendEmail(
            {
              tipoPlantilla: "CORREO BIENVENIDA",
              alumnoData: createdStudent,
              paymentData: {}, // No hay datos de pago para correo de bienvenida
            },
            {
              onSuccess: () => {
                toast.success("Correo de bienvenida enviado exitosamente");
              },
              onError: (error) => {
                console.error("Error enviando correo de bienvenida:", error);
                toast.error("Error al enviar correo de bienvenida");
              },
            }
          );
        }
      }
      reset();
      onCloseModal?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: editStudent, isLoading: isEditing } = useMutation({
    mutationFn: (data) => createEditStudent(data, editNumeroControl),
    onSuccess: () => {
      toast.success("Alumno actualizado con éxito");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["activeStudentsCount"] }); // Actualizar contador
      // Los estudiantes están relacionados con pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      reset();
      onCloseModal?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isWorking =
    isCreating ||
    isEditing ||
    isLoadingSchools ||
    isLoadingProfessors ||
    isLoadingStudents ||
    isSending ||
    (!isEditSession && isGeneratingControlNumber);

  function onSubmit(data) {
    console.log("onSubmit called with data:", data);
    console.log("Image FileList:", data.URLImagen);

    const finalPorcentaje = data.Beca ? parseInt(data.PorcentajeBeca, 10) : 0;

    const imageFile =
      data.URLImagen && data.URLImagen[0] ? data.URLImagen[0] : null;

    const studentData = {
      ...data,
      URLImagen: imageFile,
      PorcentajeBeca: finalPorcentaje,
      Activo: !!data.Activo,
      Beca: !!data.Beca,
    };

    if (isEditSession) {
      delete studentData.NumeroControl;
      editStudent(studentData);
    } else {
      // No incluir NumeroControl en los datos - se generará automáticamente en el servicio
      delete studentData.NumeroControl;
      if (studentData.Activo === undefined) studentData.Activo = true;
      createStudent(studentData);
    }
  }

  function onError(formErrors) {
    console.error("Form errors:", formErrors);
    const errorMessages = Object.values(formErrors)
      .map((err) => err.message)
      .join("; ");
    toast.error(errorMessages || "Error en el formulario. Revisa los campos.");
  }

  // Funciones de email eliminadas - ahora se envía automáticamente

  const percentageOptions = Array.from({ length: 11 }, (_, i) => ({
    value: i * 10,
    label: `${i * 10}%`,
  }));

  const schoolOptions = schoolsData
    ? [
        { value: "", label: "-- Selecciona una escuela --" },
        ...schoolsData.map((school) => ({
          value: school.NombreEscuela,
          label: school.NombreEscuela,
        })),
      ]
    : [{ value: "", label: "Cargando escuelas..." }];

  const professorOptions = professorsData
    ? [
        { value: "", label: "-- Selecciona un profesor --" },
        ...professorsData.map((professor) => ({
          value: professor.Nombre,
          label: professor.Nombre,
        })),
      ]
    : [{ value: "", label: "Cargando profesores..." }];

  // Mostrar spinner si estamos cargando datos frescos del estudiante
  if (isEditSession && isLoadingStudents) {
    return (
      <StyledForm>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <SpinnerMini />
          <p>Cargando datos actualizados del estudiante...</p>
        </div>
      </StyledForm>
    );
  }

  // Mostrar error si hay problema cargando los datos
  if (isEditSession && studentsError) {
    return (
      <StyledForm>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <ErrorSpan>Error al cargar datos del estudiante</ErrorSpan>
        </div>
      </StyledForm>
    );
  }

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit, onError)}>
      <FormGrid $columns="1fr">
        <Field>
          <Label htmlFor="NumeroControl">Número de Control</Label>
          <Input
            type="text"
            id="NumeroControl"
            disabled={true} // Siempre deshabilitado - se genera automáticamente
            readOnly={true} // Siempre solo lectura
            {...register("NumeroControl")}
            style={{
              backgroundColor: "var(--color-grey-100)",
              cursor: "not-allowed",
            }}
            placeholder={
              isEditSession
                ? ""
                : isGeneratingControlNumber
                ? "Generando número..."
                : nextControlNumber || "Se generará automáticamente"
            }
          />
          {controlNumberError && (
            <ErrorSpan>
              Error al generar número de control: {controlNumberError.message}
            </ErrorSpan>
          )}
          {!isEditSession && (
            <span
              style={{
                fontSize: "1.2rem",
                color: "var(--color-grey-600)",
                marginTop: "0.4rem",
                display: "block",
              }}
            >
              El número de control se genera automáticamente con el formato:{" "}
              {new Date().getFullYear().toString().slice(-2)}100###
            </span>
          )}
        </Field>
      </FormGrid>

      <FormGrid>
        <Field>
          <Label htmlFor="ApellidoPaterno">Apellido Paterno</Label>
          <Input
            type="text"
            id="ApellidoPaterno"
            {...register("ApellidoPaterno", {
              required: "Este campo es requerido",
            })}
          />
          {errors.ApellidoPaterno && (
            <ErrorSpan>{errors.ApellidoPaterno.message}</ErrorSpan>
          )}
        </Field>

        <Field>
          <Label htmlFor="ApellidoMaterno">Apellido Materno</Label>
          <Input
            type="text"
            id="ApellidoMaterno"
            {...register("ApellidoMaterno")}
          />
        </Field>

        <Field>
          <Label htmlFor="Nombre">Nombre</Label>
          <Input
            type="text"
            id="Nombre"
            {...register("Nombre", { required: "Este campo es requerido" })}
          />
          {errors.Nombre && <ErrorSpan>{errors.Nombre.message}</ErrorSpan>}
        </Field>
      </FormGrid>

      <FormGrid>
        <Field>
          <Label htmlFor="Grado">Grado</Label>
          <Input type="text" id="Grado" {...register("Grado")} />
        </Field>

        <Field>
          <Label htmlFor="Grupo">Grupo</Label>
          <Input type="text" id="Grupo" {...register("Grupo")} />
        </Field>

        <Field>
          <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
          <Input
            type="date"
            id="FechaNacimiento"
            {...register("FechaNacimiento")}
          />
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr">
        <Field>
          <Label htmlFor="Tutor">Nombre del Papá o Mamá (Tutor)</Label>
          <Input type="text" id="Tutor" {...register("Tutor")} />
          {errors.Tutor && <ErrorSpan>{errors.Tutor.message}</ErrorSpan>}
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr">
        <Field>
          <Label htmlFor="URLImagen">Foto del Estudiante</Label>
          <FileInput
            id="URLImagen"
            accept="image/*"
            watchedValue={imageField}
            {...register("URLImagen")}
          />
          {imagePreview && (
            <ImgPreview src={imagePreview} alt="Previsualización" />
          )}
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr">
        <Field>
          <Label htmlFor="Correo">Correo Electrónico</Label>
          <Input
            type="email"
            id="Correo"
            {...register("Correo", {
              pattern: { value: /\S+@\S+\.\S+/, message: "Correo inválido" },
            })}
          />
          {errors.Correo && <ErrorSpan>{errors.Correo.message}</ErrorSpan>}
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr 1fr">
        <Field>
          <Label htmlFor="Telefono">Teléfono/Celular</Label>
          <Input type="text" id="Telefono" {...register("Telefono")} />
        </Field>

        <Field>
          <Label htmlFor="NombreEscuela">Escuela</Label>
          {isLoadingSchools ? (
            <SpinnerMini />
          ) : schoolsError ? (
            <ErrorSpan>Error al cargar escuelas</ErrorSpan>
          ) : (
            <Select
              id="NombreEscuela"
              options={schoolOptions}
              {...register("NombreEscuela", {
                required: "Selecciona una escuela",
              })}
              disabled={isWorking || isLoadingSchools}
            />
          )}
          {errors.NombreEscuela && (
            <ErrorSpan>{errors.NombreEscuela.message}</ErrorSpan>
          )}
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr 1fr">
        <Field>
          <Label htmlFor="QuienRecoge1">Persona Autorizada 1</Label>
          <Input type="text" id="QuienRecoge1" {...register("QuienRecoge1")} />
        </Field>

        <Field>
          <Label htmlFor="QuienRecoge2">Persona Autorizada 2</Label>
          <Input type="text" id="QuienRecoge2" {...register("QuienRecoge2")} />
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr 1fr">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Input
            type="checkbox"
            id="Activo"
            {...register("Activo")}
            style={{ width: "auto" }}
          />
          <Label htmlFor="Activo" style={{ marginBottom: 0 }}>
            Activo
          </Label>
        </div>
        <Field>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Input
              type="checkbox"
              id="Beca"
              {...register("Beca")}
              style={{ width: "auto" }}
            />
            <Label htmlFor="Beca" style={{ marginBottom: 0 }}>
              Beca
            </Label>
          </div>
          {hasBeca && (
            <BecaContainer>
              <Label
                htmlFor="PorcentajeBeca"
                style={{ marginBottom: 0, flexShrink: 0 }}
              >
                Porcentaje:
              </Label>
              <Select
                id="PorcentajeBeca"
                options={percentageOptions}
                {...register("PorcentajeBeca", {
                  setValueAs: (v) => parseInt(v, 10),
                  validate: (value) =>
                    !hasBeca ||
                    (value !== null && value !== undefined && value >= 0) ||
                    "Selecciona un porcentaje",
                })}
              />
              {errors.PorcentajeBeca && (
                <ErrorSpan>{errors.PorcentajeBeca.message}</ErrorSpan>
              )}
            </BecaContainer>
          )}
        </Field>
      </FormGrid>

      <FormGrid $columns="1fr 1fr">
        <Field>
          <Label htmlFor="Profesor">Profesor</Label>
          {isLoadingProfessors ? (
            <SpinnerMini />
          ) : professorsError ? (
            <ErrorSpan>Error al cargar profesores</ErrorSpan>
          ) : (
            <Select
              id="Profesor"
              options={professorOptions}
              {...register("Profesor")}
              disabled={isWorking || isLoadingProfessors}
            />
          )}
          {errors.Profesor && <ErrorSpan>{errors.Profesor.message}</ErrorSpan>}
        </Field>
        <Field>
          <Label htmlFor="Rango">Rango</Label>
          <Select
            id="Rango"
            options={[
              { value: "Madera", label: "Madera" },
              { value: "Bronce", label: "Bronce" },
              { value: "Plata", label: "Plata" },
              { value: "Oro", label: "Oro" },
              { value: "Diamante", label: "Diamante" },
              { value: "Rey del tablero", label: "Rey del tablero" },
            ]}
            {...register("Rango")}
          />
        </Field>
      </FormGrid>

      <ButtonContainer>
        <Button type="button" variation="secondary" onClick={onCloseModal}>
          Cancelar
        </Button>
        <Button disabled={isWorking}>
          {isEditSession ? "Guardar Cambios" : "Confirmar Estudiante"}
        </Button>
      </ButtonContainer>

      {/* Modal de bienvenida eliminado - ahora se envía automáticamente */}
    </StyledForm>
  );
}

export default CreateStudentForm;
