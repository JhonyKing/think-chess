import styled from "styled-components";
import { HiMiniUsers } from "react-icons/hi2";
import { useActiveStudentsCount } from "../features/students/useActiveStudentsCount";

const StyledHeader = styled.header`
  background-color: var(--color-grey-0);
  padding: 1.2rem 4.8rem;
  border-bottom: 1px solid var(--color-grey-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StudentsCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-grey-700);
  background-color: var(--color-grey-100);
  padding: 0.6rem 1.2rem;
  border-radius: var(--border-radius-sm);
`;

const CounterIcon = styled(HiMiniUsers)`
  font-size: 1.8rem;
  color: var(--color-brand-600);
`;

const CounterText = styled.span`
  color: var(--color-grey-700);
`;

const CounterNumber = styled.span`
  font-weight: 700;
  color: var(--color-brand-600);
`;

export default function Header() {
  const { count, isLoading } = useActiveStudentsCount();

  return (
    <StyledHeader>
      <StudentsCounter>
        <CounterIcon />
        <CounterText>Total de alumnos:</CounterText>
        <CounterNumber>{isLoading ? "..." : count || 0}</CounterNumber>
      </StudentsCounter>
      <div></div> {/* Spacer for right side */}
    </StyledHeader>
  );
}
