import supabase from "./supabase";

/**
 * Obtiene todas las plantillas de correo
 */
export async function getEmailTemplates() {
  const { data, error } = await supabase
    .from("PLANTILLADECORREO") // Nombre correcto de la tabla
    .select("*")
    .order("TipoDeCorreo");

  if (error) {
    console.error("Error fetching email templates:", error);
    throw new Error("No se pudieron cargar las plantillas de correo.");
  }

  return data;
}

/**
 * Crea una nueva plantilla de correo
 */
export async function createEmailTemplate(templateData) {
  const { data, error } = await supabase
    .from("PLANTILLADECORREO")
    .insert([templateData])
    .select()
    .single();

  if (error) {
    console.error("Error creating email template:", error);
    throw new Error(
      "No se pudo crear la plantilla de correo: " + error.message
    );
  }

  return data;
}

/**
 * Actualiza una plantilla de correo existente
 */
export async function updateEmailTemplate(id, templateData) {
  const { data, error } = await supabase
    .from("PLANTILLADECORREO")
    .update(templateData)
    .eq("PlantillaID", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating email template:", error);
    throw new Error(
      "No se pudo actualizar la plantilla de correo: " + error.message
    );
  }

  return data;
}

/**
 * Elimina una plantilla de correo
 */
export async function deleteEmailTemplate(id) {
  const { error } = await supabase
    .from("PLANTILLADECORREO")
    .delete()
    .eq("PlantillaID", id);

  if (error) {
    console.error("Error deleting email template:", error);
    throw new Error(
      "No se pudo eliminar la plantilla de correo: " + error.message
    );
  }
}

/**
 * Hook personalizado para plantillas de correo
 */
export function useEmailTemplates() {
  return {
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
  };
}
