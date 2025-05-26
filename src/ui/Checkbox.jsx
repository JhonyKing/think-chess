import styled from "styled-components";
import React from "react";

const StyledCheckbox = styled.div`
  display: flex;
  gap: 1.6rem;

  & input[type="checkbox"] {
    height: 2.4rem;
    width: 2.4rem;
    outline-offset: 2px;
    transform-origin: 0;
    accent-color: var(--color-brand-600);
  }

  & input[type="checkbox"]:disabled {
    accent-color: var(--color-brand-600);
  }

  & label {
    flex: 1;

    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
`;

const Checkbox = React.forwardRef(function Checkbox(
  { disabled = false, id, children, ...props },
  ref
) {
  return (
    <StyledCheckbox>
      <input type="checkbox" id={id} disabled={disabled} ref={ref} {...props} />
      <label htmlFor={id}>{children}</label>
    </StyledCheckbox>
  );
});

export default Checkbox;
