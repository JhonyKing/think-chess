import { useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import FormRow from "../../ui/FormRow";
import Error from "../../ui/Error";

import { createStudent } from "../../services/apiStudents";

/*const FormRow = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 24rem 1fr 1.2fr;
  gap: 2.4rem;
  padding: 1.2rem 0;

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-grey-100);
  }

  &:has(button) {
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
  }
`;*/

/*const Error = styled.span`
      font-size: 1.4rem;
      color: var(--color-red-700);
    `;*/

const Label = styled.label`
  font-weight: 500;
`;

function CreateStudentForm() {
  const queryClient = useQueryClient();

  const { mutate, isLoading: isCreating } = useMutation({
    mutationFn: (student) => createStudent(student),
    onSuccess: () => {
      toast.success("Student created successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      reset();
    },
    onError: (errors) => {
      toast.error(errors.message);
    },
  });

  const { register, handleSubmit, reset, formState } = useForm();

  const { errors } = formState;

  function onSubmit(data) {
    mutate(data);
  }

  function onError(errors) {
    toast.error(errors.message);
  }
  return (
    <Form onSubmit={handleSubmit(onSubmit, onError)}>
      <FormRow>
        <Label htmlFor="name">Numero de Control</Label>
        <Input
          type="text"
          id="NumeroControl"
          {...register("NumeroControl", {
            required: "This field is required",
          })}
        />
        {errors?.NumeroControl?.message && (
          <Error>{errors.NumeroControl.message}</Error>
        )}
      </FormRow>

      <FormRow>
        <Label htmlFor="Nombre">Nombre</Label>
        <Input
          type="text"
          id="Nombre"
          {...register("Nombre", { required: "This field is required" })}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="ApellidoPaterno">Apellido Paterno</Label>
        <Input
          type="text"
          id="ApellidoPaterno"
          {...register("ApellidoPaterno", {
            required: "This field is required",
          })}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="ApellidoMaterno">Apellido Materno</Label>
        <Input
          type="text"
          id="ApellidoMaterno"
          {...register("ApellidoMaterno")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="NombreEscuela">Escuela</Label>
        <Textarea
          type="text"
          id="NombreEscuela"
          {...register("NombreEscuela", {
            required: "This field is required",
          })}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="FechaNacimiento">Fecha de Nacimiento</Label>
        <Input
          type="date"
          id="FechaNacimiento"
          {...register("FechaNacimiento")}
        />
      </FormRow>

      <FormRow>
        <Label htmlFor="Telefono">Telefono</Label>
        <Input type="text" id="Telefono" {...register("Telefono")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Correo">Correo</Label>
        <Input type="email" id="Correo" {...register("Correo")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Activo">Activo</Label>
        <Input type="checkbox" id="Activo" {...register("Activo")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Beca">Beca</Label>
        <Input type="checkbox" id="Beca" {...register("Beca")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Profesor">Profesor</Label>
        <Input type="text" id="Profesor" {...register("Profesor")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Rango">Rango</Label>
        <Input type="text" id="Rango" {...register("Rango")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Grado">Grado</Label>
        <Input type="text" id="Grado" {...register("Grado")} />
      </FormRow>

      <FormRow>
        <Label htmlFor="Tutor">Tutor</Label>
        <Input type="text" id="Tutor" {...register("Tutor")} />
      </FormRow>

      <FormRow>
        <Button variation="primary" type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create new student"}
        </Button>
      </FormRow>

      <FormRow>
        <Button variation="secondary" type="reset">
          Cancel
        </Button>
      </FormRow>
    </Form>
  );
}

export default CreateStudentForm;
