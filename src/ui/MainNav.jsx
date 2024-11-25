import { NavLink } from "react-router";
import styled from "styled-components";
import {
  HiOutlineAcademicCap,
  HiOutlineBanknotes,
  HiOutlineBuildingLibrary,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineCircleStack,
  HiOutlineCog6Tooth,
  HiOutlineDocumentChartBar,
  HiOutlineFolderPlus,
  HiOutlineHome,
  HiOutlineTruck,
  HiOutlineUsers,
} from "react-icons/hi2";

const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StyledNavLink = styled(NavLink)`
  &:link,
  &:visited {
    display: flex;
    align-items: center;
    gap: 1.2rem;

    color: var(--color-grey-600);
    font-size: 1.6rem;
    font-weight: 500;
    padding: 1.2rem 2.4rem;
    transition: all 0.3s;
  }

  /* This works because react-router places the active class on the active NavLink */
  &:hover,
  &:active,
  &.active:link,
  &.active:visited {
    color: var(--color-grey-800);
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-400);
    transition: all 0.3s;
  }

  &:hover svg,
  &:active svg,
  &.active:link svg,
  &.active:visited svg {
    color: var(--color-brand-600);
  }
`;
function MainNav() {
  return (
    <nav>
      <NavList>
        <li>
          <StyledNavLink to="/dashboard">
            <HiOutlineHome />
            Inicio
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/attendance">
            <HiOutlineCalendarDays />
            Asistencias
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/expenses">
            <HiOutlineCircleStack />
            Gastos
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/payments">
            <HiOutlineBanknotes /> Pagos
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/register">
            <HiOutlineFolderPlus />
            Registro
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/reports">
            <HiOutlineDocumentChartBar />
            Reportes
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/schools">
            <HiOutlineBuildingLibrary />
            Escuelas
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/statistics">
            <HiOutlineChartBar />
            Estadísticas
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/students">
            <HiOutlineAcademicCap />
            Alumnos
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/suppliers">
            <HiOutlineTruck />
            Proveedores
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/users">
            <HiOutlineUsers />
            Usuarios
          </StyledNavLink>
        </li>
        <li>
          <StyledNavLink to="/settings">
            <HiOutlineCog6Tooth />
            Configuración
          </StyledNavLink>
        </li>
      </NavList>
    </nav>
  );
}

export default MainNav;
