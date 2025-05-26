import styled from "styled-components";
import { HiXMark } from "react-icons/hi2";
import React, {
  useState,
  useContext,
  createContext,
  cloneElement,
  useEffect,
} from "react";
import { createPortal } from "react-dom";

const StyledModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--color-grey-0);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 3.2rem 4rem;
  transition: all 0.5s;
  z-index: 1000;
  /* Removed fixed width, let content define it or use props */
  /* width: 70vw; */
  /* max-width: 800px; */
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: var(--color-grey-800-alpha-50); // Example with alpha
  backdrop-filter: blur(4px);
  z-index: 999;
  transition: all 0.5s;
`;

const Button = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--border-radius-sm);
  transform: translateX(0.8rem);
  transition: all 0.2s;
  position: absolute;
  top: 1.2rem;
  right: 1.9rem;

  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-500);
  }
`;

// 1. Create Context
export const ModalContext = createContext();

// 2. Create Parent Component (Provider)
function Modal({ children, onClose }) {
  const [openName, setOpenName] = useState("");

  const close = () => {
    setOpenName("");
    onClose?.();
  };
  const open = setOpenName;

  return (
    <ModalContext.Provider value={{ openName, close, open }}>
      {children}
    </ModalContext.Provider>
  );
}

// 3. Create Child Components

// Opens a window by setting the openName in context
function Open({ children, opens: opensWindowName }) {
  const { open } = useContext(ModalContext);

  // Clone the child (usually a button) and add the onClick handler
  return cloneElement(children, { onClick: () => open(opensWindowName) });
}

// The Window component renders the modal content conditionally
function Window({ children, name }) {
  const { openName, close } = useContext(ModalContext);
  const ref = React.useRef();

  // Close modal if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        close();
      }
    }

    if (openName === name) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [name, openName, close]);

  if (openName !== name) return null;

  return createPortal(
    <Overlay>
      {/* Stop propagation on modal itself to prevent outside click */}
      <StyledModal
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Button onClick={close}>
          <HiXMark />
        </Button>
        {/* Pass close function to children if they need it (e.g., ConfirmDelete cancel button) */}
        {/* cloneElement is safer to inject props */}
        <div>{cloneElement(children, { onCloseModal: close })}</div>
      </StyledModal>
    </Overlay>,
    document.body
  );
}

// 4. Add child components as properties
Modal.Open = Open;
Modal.Window = Window;

export default Modal;
