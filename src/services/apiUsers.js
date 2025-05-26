import supabase from "./supabase";

/**
 * Fetches all users from the database.
 * NOTE: Does NOT fetch the 'Contrasena' field for security.
 *
 * @async
 * @function getUsers
 * @returns {Promise<Array<object>>} A promise that resolves to an array of user objects.
 * @throws {Error} Throws an error if the data couldn't be loaded.
 */
export async function getUsers() {
  const { data, error } = await supabase
    .from("USUARIO")
    .select(
      "Nombre, TipoDeUsuario, Inicio, Asistencias, Gastos, Registro, Reportes, Escuelas, Estadisticas, Alumnos, Proveedores, Usuarios, Configuracion, URLImagen"
    ); // Exclude Contrasena, ahora incluye URLImagen

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error("No se pudieron cargar los usuarios.");
  }

  return data;
}

/**
 * Creates a new user in the database.
 * TODO: Implement password hashing before sending to Supabase if not handled by database policy/trigger.
 *
 * @async
 * @function createUser
 * @param {object} newUser - The user object containing all required fields.
 * @returns {Promise<object>} A promise that resolves to the newly created user object.
 * @throws {Error} Throws an error if the user couldn't be created.
 */
export async function createUser(newUser) {
  // Potential enhancement: Hash password here if needed
  // const hashedPassword = await hashPassword(newUser.Contrasena);
  // const userToInsert = { ...newUser, Contrasena: hashedPassword };

  const { data, error } = await supabase
    .from("USUARIO")
    .insert([newUser]) // Use newUser directly for now
    .select()
    .single(); // Expecting a single object back

  if (error) {
    console.error("Error creating user:", error);
    throw new Error("No se pudo crear el usuario.");
  }

  return data;
}

/**
 * Updates an existing user in the database.
 * NOTE: Assumes 'Nombre' is the unique identifier and cannot be changed.
 * If 'Contrasena' is provided and not empty, it will be updated.
 * TODO: Implement password hashing if needed.
 *
 * @async
 * @function updateUser
 * @param {object} userToUpdate - Object containing fields to update. MUST include all boolean fields. Can include 'Contrasena' if it needs changing.
 * @param {string} userName - The 'Nombre' of the user to update.
 * @returns {Promise<object>} A promise that resolves to the updated user object.
 * @throws {Error} Throws an error if the user couldn't be updated.
 */
export async function updateUser(userToUpdate, userName) {
  // Prepare data: Exclude 'Nombre' from the update payload.
  // Creating a shallow copy and removing Nombre if it exists
  const updateData = { ...userToUpdate };
  delete updateData.Nombre; // Remove Nombre if it exists in the update object

  // Only include Contrasena in the update if it's provided and not empty
  if (!updateData.Contrasena) {
    delete updateData.Contrasena;
  } else {
    // Potential enhancement: Hash password here if needed
    // updateData.Contrasena = await hashPassword(updateData.Contrasena);
  }

  const { data, error } = await supabase
    .from("USUARIO")
    .update(updateData)
    .eq("Nombre", userName)
    .select()
    .single(); // Expecting a single object back

  if (error) {
    console.error("Error updating user:", error);
    throw new Error("No se pudo actualizar el usuario.");
  }

  return data;
}

/**
 * Fetches all user types from the TIPODEUSUARIO table.
 * Assumes the table has a 'nombre' column for the type name.
 *
 * @async
 * @function getUserTypes
 * @returns {Promise<Array<object>>} A promise that resolves to an array of user type objects.
 * @throws {Error} Throws an error if the data couldn't be loaded.
 */
export async function getUserTypes() {
  const { data, error } = await supabase
    .from("TIPODEUSUARIO")
    .select("Funcion"); // Corrected column name to Funcion

  if (error) {
    console.error("Error fetching user types:", error);
    throw new Error("No se pudieron cargar los tipos de usuario.");
  }

  return data;
}

/**
 * Deletes a user from the database.
 *
 * @async
 * @function deleteUser
 * @param {string} userName - The 'Nombre' of the user to delete.
 * @returns {Promise<null>} A promise that resolves when the user is deleted.
 * @throws {Error} Throws an error if the user couldn't be deleted.
 */
export async function deleteUser(userName) {
  const { error } = await supabase
    .from("USUARIO")
    .delete()
    .eq("Nombre", userName);

  if (error) {
    console.error("Error deleting user:", error);
    throw new Error("No se pudo eliminar el usuario.");
  }

  return null; // Or return something else if needed
}
