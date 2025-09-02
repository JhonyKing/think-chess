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

      // Get schools that have active courses (regardless of their Activo field)
      const { data, error } = await supabase
        .from("ESCUELA")
        .select(
          `
          NombreEscuela,
          Activo,
          CURSO!inner(
            IDCurso,
            Activo
          )
        `
        )
        .eq("CURSO.Activo", true)
        .order("NombreEscuela");

      if (!error) {
        // Remove duplicate schools (in case a school has multiple active courses)
        const uniqueSchools = data.reduce((acc, school) => {
          if (!acc.find((s) => s.NombreEscuela === school.NombreEscuela)) {
            acc.push({
              NombreEscuela: school.NombreEscuela,
              Activo: school.Activo,
            });
          }
          return acc;
        }, []);

        setSchools(uniqueSchools);
        console.log(
          `[SchoolSelect] Encontradas ${uniqueSchools.length} escuelas con cursos activos:`,
          uniqueSchools
        );
      } else {
        console.error("Error fetching schools with active courses:", error);
      }
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
