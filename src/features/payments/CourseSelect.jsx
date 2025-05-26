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

function CourseSelect({ schoolId, onSelect }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!schoolId) return;
    async function fetchCourses() {
      setLoading(true);
      const { data, error } = await supabase
        .from("CURSO")
        .select("IDCurso,NombreEscuela,InicioCurso,FinCurso,Activo,DiaClase")
        .eq("Activo", true)
        .eq("NombreEscuela", schoolId);
      if (!error) setCourses(data);
      setLoading(false);
      if (data && data.length === 1) {
        setSelected(data[0].IDCurso);
        onSelect(data[0]);
      }
    }
    fetchCourses();
  }, [schoolId, onSelect]);

  function handleChange(e) {
    const course = courses.find((c) => c.IDCurso === e.target.value);
    setSelected(e.target.value);
    onSelect(course);
  }

  if (!schoolId) return null;
  if (loading) return <div>Cargando cursos...</div>;
  if (courses.length === 0)
    return <div>No hay cursos activos para esta escuela.</div>;
  if (courses.length === 1) return null;

  return (
    <SelectWrapper>
      <label htmlFor="course-select" style={{ fontWeight: 600 }}>
        Curso
      </label>
      <StyledSelect
        id="course-select"
        value={selected}
        onChange={handleChange}
        aria-label="Seleccionar curso"
      >
        <option value="">Selecciona un curso</option>
        {courses.map((course) => (
          <option key={course.IDCurso} value={course.IDCurso}>
            {course.IDCurso} - {course.DiaClase}
          </option>
        ))}
      </StyledSelect>
    </SelectWrapper>
  );
}

export default CourseSelect;
