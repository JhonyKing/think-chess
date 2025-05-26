import { useEffect, useState } from "react";
import styled from "styled-components";
import supabase from "../../services/supabase";

const SelectWrapper = styled.div`
  margin-bottom: 2.4rem;
`;

const StyledSelect = styled.select`
  padding: 0.8rem 1.2rem;
  border-radius: 0.4rem;
  border: 1px solid var(--color-grey-200);
  font-size: 1.6rem;
  width: 100%;
`;

function SchoolSelect({ onSelect }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    async function fetchSchools() {
      setLoading(true);
      const { data, error } = await supabase
        .from("ESCUELA")
        .select("NombreEscuela,Activo")
        .eq("Activo", true)
        .order("NombreEscuela");
      if (!error) setSchools(data);
      setLoading(false);
    }
    fetchSchools();
  }, []);

  function handleChange(e) {
    setSelected(e.target.value);
    onSelect(e.target.value);
  }

  if (loading) return <div>Cargando escuelas...</div>;

  return (
    <SelectWrapper>
      <label htmlFor="school-select" style={{ fontWeight: 600 }}>
        Escuela
      </label>
      <StyledSelect
        id="school-select"
        value={selected}
        onChange={handleChange}
        aria-label="Seleccionar escuela"
      >
        <option value="">Selecciona una escuela</option>
        {schools.map((school) => (
          <option key={school.NombreEscuela} value={school.NombreEscuela}>
            {school.NombreEscuela}
          </option>
        ))}
      </StyledSelect>
    </SelectWrapper>
  );
}

export default SchoolSelect;
