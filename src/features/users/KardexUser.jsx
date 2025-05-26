import styled from "styled-components";
import Heading from "../../ui/Heading";
import { HiCheckCircle, HiXCircle } from "react-icons/hi";
import React from "react";

const Card = styled.div`
  padding: 3rem 2.5rem;
  background: var(--color-grey-0);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  min-width: 36rem;
  max-width: 40rem;
  margin: 0 auto;
`;

const Avatar = styled.img`
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  margin: 0 auto 2rem auto;
  background: var(--color-grey-200);
`;

const DataList = styled.dl`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem 1.6rem;
  margin-bottom: 2rem;
`;

const Label = styled.dt`
  font-weight: 500;
  color: var(--color-grey-700);
`;

const Value = styled.dd`
  margin: 0;
  color: var(--color-grey-900);
  font-weight: 400;
  word-break: break-word;
`;

const PermIcon = styled.span`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: ${({ value }) =>
    value ? "var(--color-green-700)" : "var(--color-red-700)"};
`;

const booleanFields = [
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

function KardexUser({ user }) {
  if (!user) return null;
  return (
    <Card>
      <Avatar src={user.URLImagen} alt="Avatar usuario" />
      <Heading as="h2" style={{ textAlign: "center", marginBottom: "2rem" }}>
        {user.Nombre}
      </Heading>
      <DataList>
        <Label>Tipo de Usuario</Label>
        <Value>{user.TipoDeUsuario}</Value>
        {booleanFields.map((field) => (
          <React.Fragment key={field}>
            <Label>{field}</Label>
            <Value>
              <PermIcon value={user[field]}>
                {user[field] ? <HiCheckCircle /> : <HiXCircle />}{" "}
                {user[field] ? "Sí" : "No"}
              </PermIcon>
            </Value>
          </React.Fragment>
        ))}
      </DataList>
    </Card>
  );
}

export default KardexUser;
