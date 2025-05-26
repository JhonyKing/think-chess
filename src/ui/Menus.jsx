import styled from "styled-components";
import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HiEllipsisVertical } from "react-icons/hi2"; // Default icon for Toggle

// Removed unused StyledMenu
/*
const StyledMenu = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative; // Added position relative for context
`;
*/

const StyledToggle = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--border-radius-sm);
  /* transform: translateX(0.8rem); // Often causes issues with positioning, removed */
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-700);
  }
`;

const StyledList = styled.ul`
  position: fixed; // Use fixed to position relative to viewport

  background-color: var(--color-grey-0);
  box-shadow: var(--shadow-md);
  border-radius: var(--border-radius-md);
  z-index: 1001; // Ensure it's above other elements like modal overlay

  /* Position calculated dynamically */
  right: ${(props) => props.position?.x}px;
  top: ${(props) => props.position?.y}px;
`;

const StyledButton = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 1.2rem 2.4rem;
  font-size: 1.4rem;
  transition: all 0.2s;

  display: flex;
  align-items: center;
  gap: 1.6rem;

  &:hover {
    background-color: var(--color-grey-50);
  }

  & svg {
    width: 1.6rem;
    height: 1.6rem;
    color: var(--color-grey-400);
    transition: all 0.3s;
  }
`;

// 1. Create Context
const MenusContext = createContext();

// 2. Create Parent Component (Provider)
function Menus({ children }) {
  const [openId, setOpenId] = useState("");
  const [position, setPosition] = useState(null);

  const close = () => setOpenId("");
  const open = setOpenId; // Just alias for clarity

  return (
    <MenusContext.Provider
      value={{ openId, close, open, position, setPosition }}
    >
      {children}
    </MenusContext.Provider>
  );
}

// 3. Create Child Components to help implement the pattern

function Menu({ children }) {
  // Simple wrapper, might not need StyledMenu if placement is handled by parent
  // return <StyledMenu>{children}</StyledMenu>;
  return <div>{children}</div>; // Using simple div for now
}

function Toggle({ id, children }) {
  const { openId, close, open, setPosition } = useContext(MenusContext);

  function handleClick(e) {
    e.stopPropagation(); // Prevent click from closing menu immediately

    const rect = e.target.closest("button").getBoundingClientRect();
    setPosition({
      // Calculate position based on button, adjust as needed
      x: window.innerWidth - rect.width - rect.x,
      y: rect.y + rect.height + 8, // Position below the button
    });

    // If this menu is already open, or no menu is open, toggle this one.
    // Otherwise (another menu is open), close the other and open this one.
    openId === "" || openId !== id ? open(id) : close();
  }

  return (
    <StyledToggle onClick={handleClick}>
      {children || <HiEllipsisVertical />} {/* Default icon */}
    </StyledToggle>
  );
}

function List({ id, children }) {
  const { openId, position, close } = useContext(MenusContext);
  const ref = React.useRef();

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        close();
      }
    }

    if (openId === id) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [id, openId, close]);

  if (openId !== id) return null;

  // Render using portal at document body
  return createPortal(
    <StyledList position={position} ref={ref}>
      {children}
    </StyledList>,
    document.body
  );
}

function Button({ children, icon, onClick }) {
  const { close } = useContext(MenusContext);

  function handleClick() {
    onClick?.(); // Perform the button's specific action
    close(); // Close the menu
  }

  return (
    <li>
      <StyledButton onClick={handleClick}>
        {icon}
        <span>{children}</span>
      </StyledButton>
    </li>
  );
}

// 4. Add child components as properties to parent component
Menus.Menu = Menu;
Menus.Toggle = Toggle;
Menus.List = List;
Menus.Button = Button;

export default Menus;
