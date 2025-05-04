import styled from "styled-components";
import React, { useState, useEffect } from "react";

const FileInputContainer = styled.div`
  display: flex;
  align-items: center;
  border: 1px dashed var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  padding: 1.2rem;
  background-color: var(--color-grey-50);
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;

  &:hover {
    background-color: var(--color-grey-100);
    border-color: var(--color-brand-600);
  }
`;

const FileInputLabel = styled.label`
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-grey-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  margin-right: 1.2rem;
`;

const StyledFileInput = styled.input.attrs({ type: "file" })`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
  overflow: hidden;
`;

const UploadButton = styled.span`
  display: inline-block;
  font: inherit;
  font-weight: 500;
  padding: 0.8rem 1.2rem;
  border-radius: var(--border-radius-sm);
  border: none;
  color: var(--color-brand-50);
  background-color: var(--color-brand-600);
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: var(--color-brand-700);
  }
`;

const FileInput = React.forwardRef(
  ({ id, accept, onChange, watchedValue, ...props }, ref) => {
    const [fileName, setFileName] = useState("Ningún archivo seleccionado");

    useEffect(() => {
      if (!watchedValue || watchedValue.length === 0) {
        setFileName("Ningún archivo seleccionado");
      }
    }, [watchedValue]);

    const handleInputChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setFileName(file.name);
      } else {
        setFileName("Ningún archivo seleccionado");
      }
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <FileInputContainer onClick={() => document.getElementById(id)?.click()}>
        <StyledFileInput
          id={id}
          accept={accept}
          ref={ref}
          onChange={handleInputChange}
          {...props}
        />
        <FileInputLabel htmlFor={id}>{fileName}</FileInputLabel>
        <UploadButton as="span">Seleccionar archivo</UploadButton>
      </FileInputContainer>
    );
  }
);

FileInput.displayName = "FileInput";

export default FileInput;
