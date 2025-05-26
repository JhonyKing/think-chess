import supabase from "../../services/supabase";
// import { ITEMS_PER_PAGE } from "../../utils/constants"; // Comentado por ahora

// Function to create a new expense
// newExpense object should contain fields like: Razon, Monto, Nota, FechaHora, NombreEscuela, Grupo, IDProveedor, GastoID
export async function createExpense(newExpense) {
  // El payload (newExpense) ya debe venir con la clave "GastoID"
  const { data, error } = await supabase
    .from("GASTO")
    .insert([newExpense])
    .select() // Select all columns by default after insert
    .single();

  if (error) {
    console.error("Error creating expense:", error);
    if (error.code === "23505") {
      throw new Error(
        "Error al crear el gasto: Ya existe un registro con alguna de las claves únicas proporcionadas (ej. GastoID duplicado)."
      );
    } else if (error.code === "23503") {
      throw new Error(
        "Error al crear el gasto: Alguna de las referencias (como Proveedor o Escuela) no es válida."
      );
    } else if (error.code === "22P02" || error.code === "22007") {
      throw new Error(
        "Error al crear el gasto: Formato de datos inválido para algún campo (ej. fecha, monto)."
      );
    }
    // Fallback for other errors, including if it still says "Could not find GastoID"
    if (error.message.includes("GastoID")) {
      throw new Error(
        `Error con la columna GastoID: ${error.message}. Verifique el nombre exacto en la BD.`
      );
    }
    throw new Error("El gasto no pudo ser creado.");
  }

  return data;
}

// Function to edit an existing expense
export async function editExpense({ newData, id }) {
  // eslint-disable-next-line no-unused-vars
  const { PROVEEDOR, ...updateData } = newData;
  const { data, error } = await supabase
    .from("GASTO")
    .update(updateData)
    .eq("GastoID", id) // CAMBIO AQUÍ de vuelta a GastoID
    .select()
    .single();

  if (error) {
    console.error("Error editing expense:", error);
    throw new Error("El gasto no pudo ser actualizado.");
  }
  return data;
}

// Function to delete an expense
export async function deleteExpense(id) {
  const { data, error } = await supabase
    .from("GASTO")
    .delete()
    .eq("GastoID", id); // CAMBIO AQUÍ de vuelta a GastoID

  if (error) {
    console.error("Error deleting expense:", error);
    throw new Error("El gasto no pudo ser eliminado.");
  }

  return data;
}

// This is the main function to get expenses with pagination, filtering, and sorting
export async function getExpenses({ page, filters, sortBy } = {}) {
  let query = supabase
    .from("GASTO")
    .select(
      `"GastoID", Razon, Monto, Nota, FechaHora, IDProveedor, NombreEscuela, Grupo, PROVEEDOR(IDProveedor, NombreProveedor)`,
      { count: "exact" }
    );

  // FILTERS
  if (filters && filters.length > 0) {
    filters.forEach((filter) => {
      if (filter.value !== "all" && filter.value !== "" && filter.field) {
        if (filter.method === "ilike") {
          query = query.ilike(filter.field, `%${filter.value}%`);
        } else if (filter.method === "or") {
          query = query.or(
            filter.value.map((f) => `${f.field}.ilike.%${f.value}%`).join(",")
          );
        } else {
          query = query.eq(filter.field, filter.value);
        }
      }
    });
  }

  // SORT
  if (sortBy && sortBy.field) {
    // Si se ordena por GastoID, usar "GastoID" (con comillas)
    const sortField = sortBy.field === "GastoID" ? `"GastoID"` : sortBy.field;
    query = query.order(sortField, {
      ascending: sortBy.direction === "asc",
    });
  } else {
    query = query.order("FechaHora", { ascending: false });
  }

  // PAGINATION
  if (page) {
    const itemsPerPage = 10;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching expenses: ", error);
    // Check if the error message is about GastoID specifically
    if (error.message.includes("GastoID")) {
      throw new Error(
        `Error al obtener gastos, problema con GastoID: ${error.message}. Verifique el nombre exacto.`
      );
    }
    throw new Error("Los gastos no pudieron ser cargados.");
  }

  return { data, count };
}

// Function to get the maximum GastoID
export async function getMaxExpenseId() {
  const { data, error } = await supabase
    .from("GASTO")
    .select(`"GastoID"`) // Mantener comillas dobles en SQL para GastoID
    .order(`"GastoID"`, { ascending: false }) // Mantener comillas dobles en SQL para GastoID
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getMaxExpenseId] Supabase error:", error);
    // Check if the error message is about GastoID specifically
    if (
      error.message.includes("GastoID") ||
      (error.message.includes("column") &&
        error.message.includes("does not exist"))
    ) {
      throw new Error(
        `Error al obtener max GastoID: ${error.message}. Verifique el nombre exacto de la columna en la BD.`
      );
    }
    throw new Error("No se pudo obtener el ID máximo de gasto por otra razón.");
  }
  // La propiedad en el objeto JS devuelto por Supabase será GastoID (sin comillas) si el select fue "GastoID"
  return data && data.GastoID ? data.GastoID : 0; // CAMBIO AQUÍ de vuelta a data.GastoID
}
