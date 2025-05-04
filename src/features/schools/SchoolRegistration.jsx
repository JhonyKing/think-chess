import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import styled from "styled-components";
import { HiBuildingLibrary } from "react-icons/hi2";

import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import SpinnerMini from "../../ui/SpinnerMini";
import Heading from "../../ui/Heading";
import { createSchool } from "../../services/apiSchools";

const StyledSchoolRegistration = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 2.4rem 3.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SchoolIcon = styled(HiBuildingLibrary)`
  width: 10rem;
  height: 10rem;
  color: var(--color-brand-600);
  margin-bottom: 1.6rem;
`;

function SchoolRegistration() {
  const { register, handleSubmit, reset, formState } = useForm();
  const { errors } = formState;

  const queryClient = useQueryClient();

  const { mutate, isLoading: isCreating } = useMutation({
    mutationFn: createSchool,
    onSuccess: (newSchool) => {
      toast.success(`Escuela "${newSchool.NombreEscuela}" creada con éxito.`);
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      reset();
    },
    onError: (err) => {
      // Error already toasted in apiSchools if it's a duplicate
      if (!err.message.includes("ya existe")) {
        toast.error(err.message);
      }
    },
  });

  function onSubmit(data) {
    if (!data.NombreEscuela) return;
    mutate({ NombreEscuela: data.NombreEscuela });
  }

  return (
    <StyledSchoolRegistration>
      <SchoolIcon />
      <Heading as="h2" style={{ marginBottom: "1.6rem" }}>
        Registrar Nueva Escuela
      </Heading>
      <Form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <FormRow
          label="Nombre de la Escuela"
          error={errors?.NombreEscuela?.message}
          orientation="vertical"
        >
          <Input
            type="text"
            id="NombreEscuela"
            disabled={isCreating}
            {...register("NombreEscuela", {
              required: "El nombre es obligatorio",
            })}
          />
        </FormRow>

        <FormRow orientation="vertical">
          <Button
            disabled={isCreating}
            size="medium"
            style={{ alignSelf: "flex-end" }}
          >
            {isCreating ? <SpinnerMini /> : "Agregar Escuela"}
          </Button>
        </FormRow>
      </Form>
    </StyledSchoolRegistration>
  );
}

export default SchoolRegistration;
