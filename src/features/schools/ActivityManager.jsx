import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styled from "styled-components";
import toast from "react-hot-toast";

import Heading from "../../ui/Heading";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Spinner from "../../ui/Spinner";
import Empty from "../../ui/Empty";
import SpinnerMini from "../../ui/SpinnerMini";
import {
  getActivitiesByCourse,
  createActivity,
} from "../../services/apiActivities";
import { HiPlus } from "react-icons/hi2";

const StyledActivityManager = styled.div`
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);
  padding: 2.4rem 3.2rem;
`;

const AddActivityForm = styled.form`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
`;

const ActivityList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px; // Example height
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ActivityItem = styled.li`
  background-color: var(--color-grey-50);
  padding: 0.8rem 1.2rem;
  border-radius: var(--border-radius-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.4rem;
`;

function ActivityManager({ courseId }) {
  const [newActivityName, setNewActivityName] = useState("");
  const queryClient = useQueryClient();

  // Fetch activities for the selected course
  const {
    isLoading,
    data: activities,
    error,
  } = useQuery({
    queryKey: ["activities", courseId],
    queryFn: () => getActivitiesByCourse(courseId),
    enabled: !!courseId, // Only run if courseId is selected
  });

  // Mutation for creating a new activity
  const { mutate: addActivity, isLoading: isAdding } = useMutation({
    mutationFn: createActivity,
    onSuccess: () => {
      toast.success("Nueva actividad añadida.");
      queryClient.invalidateQueries({ queryKey: ["activities", courseId] });
      setNewActivityName(""); // Clear input field
    },
    onError: (err) => {
      toast.error(err.message || "No se pudo añadir la actividad");
    },
  });

  const handleAddActivitySubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!newActivityName.trim() || !courseId) return;
    addActivity({ Nombre: newActivityName, IDCurso: courseId });
  };

  let activityContent;
  if (isLoading) {
    activityContent = <Spinner />;
  } else if (error) {
    activityContent = <p>Error al cargar actividades: {error.message}</p>;
  } else if (!activities || activities.length === 0) {
    activityContent = <Empty resourceName="actividades" />;
  } else {
    activityContent = (
      <ActivityList>
        {activities.map((activity) => (
          // Assuming ACTIVIDAD table has IDActividad (PK) and Nombre
          <ActivityItem key={activity.IDActividad}>
            <span>
              {activity.IDActividad} - {activity.Nombre}
            </span>
            {/* Add delete/edit buttons later if needed */}
          </ActivityItem>
        ))}
      </ActivityList>
    );
  }

  return (
    <StyledActivityManager>
      <Heading as="h4" style={{ marginBottom: "1.6rem" }}>
        Actividades del Curso
      </Heading>

      <AddActivityForm onSubmit={handleAddActivitySubmit}>
        <Input
          type="text"
          placeholder="Nombre de la nueva actividad"
          value={newActivityName}
          onChange={(e) => setNewActivityName(e.target.value)}
          disabled={isAdding || !courseId}
          style={{ flexGrow: 1 }}
        />
        <Button
          size="medium"
          style={{ padding: "0.8rem 2.4rem", marginLeft: "1rem" }}
          disabled={isAdding || !courseId || !newActivityName.trim()}
        >
          {isAdding ? <SpinnerMini /> : <HiPlus />} Añadir
        </Button>
      </AddActivityForm>

      {activityContent}
    </StyledActivityManager>
  );
}

export default ActivityManager;
