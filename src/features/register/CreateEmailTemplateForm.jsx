import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import FormRow from "../../ui/FormRow";
import SpinnerMini from "../../ui/SpinnerMini";
import Textarea from "../../ui/Textarea";
import Select from "../../ui/Select";
import {
  createEmailTemplate,
  updateEmailTemplate,
} from "../../services/apiEmailTemplates";

const StyledForm = styled(Form)`
  width: 80rem;
`;

const TemplatePreview = styled.div`
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  padding: 1.6rem;
  background: var(--color-grey-50);
  margin-top: 1.2rem;
`;

const PreviewTitle = styled.h4`
  font-size: 1.4rem;
  margin-bottom: 0.8rem;
  color: var(--color-grey-700);
`;

const PreviewContent = styled.div`
  font-size: 1.3rem;
  line-height: 1.5;
  color: var(--color-grey-600);
  white-space: pre-wrap;
`;

const templateTypes = [
  { value: "pago_recordatorio", label: "Recordatorio de Pago" },
  { value: "pago_confirmacion", label: "Confirmación de Pago" },
  { value: "inscripcion_bienvenida", label: "Bienvenida por Inscripción" },
  { value: "curso_inicio", label: "Inicio de Curso" },
  { value: "actividad_recordatorio", label: "Recordatorio de Actividad" },
  { value: "reporte_mensual", label: "Reporte Mensual" },
  { value: "personalizado", label: "Personalizado" },
];

function CreateEmailTemplateForm({ templateToEdit, onCloseModal }) {
  const { PlantillaID: editId, ...editValues } = templateToEdit || {};
  const isEditSession = Boolean(editId);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState, watch } = useForm({
    defaultValues: isEditSession
      ? editValues
      : {
          TipoPlantilla: "personalizado",
        },
  });

  const { errors, isSubmitting } = formState;
  const watchedContent = watch("Contenido", "");
  const watchedSubject = watch("Asunto", "");

  // Real mutation for creating/updating email templates
  const { mutate: handleCreateEdit, isPending } = useMutation({
    mutationFn: (data) => {
      if (isEditSession) {
        return updateEmailTemplate(editId, data);
      } else {
        return createEmailTemplate(data);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditSession
          ? "Plantilla de correo actualizada exitosamente"
          : "Plantilla de correo creada exitosamente"
      );
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      onCloseModal?.();
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "Error al procesar la plantilla de correo");
    },
  });

  const actualIsSubmitting = isSubmitting || isPending;

  return (
    <StyledForm onSubmit={handleSubmit(handleCreateEdit)}>
      <FormRow label="Nombre de la plantilla" error={errors?.Nombre?.message}>
        <Input
          type="text"
          id="Nombre"
          disabled={actualIsSubmitting}
          placeholder="Recordatorio de pago mensual"
          {...register("Nombre", {
            required: "El nombre de la plantilla es obligatorio",
          })}
        />
      </FormRow>

      <FormRow label="Tipo de plantilla" error={errors?.TipoPlantilla?.message}>
        <Select
          id="TipoPlantilla"
          disabled={actualIsSubmitting}
          {...register("TipoPlantilla", {
            required: "El tipo de plantilla es obligatorio",
          })}
        >
          {templateTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </FormRow>

      <FormRow label="Asunto del correo" error={errors?.Asunto?.message}>
        <Input
          type="text"
          id="Asunto"
          disabled={actualIsSubmitting}
          placeholder="Recordatorio: Pago de mensualidad pendiente"
          {...register("Asunto", {
            required: "El asunto es obligatorio",
          })}
        />
      </FormRow>

      <FormRow label="Contenido del correo" error={errors?.Contenido?.message}>
        <Textarea
          id="Contenido"
          disabled={actualIsSubmitting}
          rows={8}
          placeholder="Hola {{NOMBRE_ESTUDIANTE}},

Te recordamos que tu pago de mensualidad correspondiente al mes de {{MES}} está pendiente.

Monto a pagar: ${{MONTO}}
Fecha límite: {{FECHA_LIMITE}}

Para realizar tu pago, puedes contactarnos al teléfono {{TELEFONO_ESCUELA}}.

Saludos cordiales,
{{NOMBRE_ESCUELA}}"
          {...register("Contenido", {
            required: "El contenido es obligatorio",
          })}
        />
      </FormRow>

      <FormRow label="Variables disponibles" error={null}>
        <div style={{ fontSize: "1.3rem", color: "var(--color-grey-600)" }}>
          {
            "{{NOMBRE_ESTUDIANTE}}, {{APELLIDO_PATERNO}}, {{MES}}, {{MONTO}}, {{FECHA_LIMITE}}, {{NOMBRE_ESCUELA}}, {{TELEFONO_ESCUELA}}"
          }
        </div>
      </FormRow>

      {(watchedSubject || watchedContent) && (
        <FormRow label="Vista previa">
          <TemplatePreview>
            <PreviewTitle>
              Asunto: {watchedSubject || "Sin asunto"}
            </PreviewTitle>
            <PreviewContent>{watchedContent || "Sin contenido"}</PreviewContent>
          </TemplatePreview>
        </FormRow>
      )}

      <FormRow label="Descripción" error={errors?.Descripcion?.message}>
        <Textarea
          id="Descripcion"
          disabled={actualIsSubmitting}
          placeholder="Descripción opcional de cuándo usar esta plantilla..."
          {...register("Descripcion")}
        />
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
          {isEditSession ? "Actualizar plantilla" : "Crear plantilla"}
        </Button>
      </FormRow>
    </StyledForm>
  );
}

export default CreateEmailTemplateForm;
