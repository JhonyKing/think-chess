import supabase from "../../services/supabase";

// Function to get all suppliers
export async function getSuppliers() {
  const { data, error } = await supabase.from("PROVEEDOR").select("*");

  if (error) {
    console.error("Error fetching suppliers:", error);
    throw new Error("Suppliers could not be loaded");
  }

  return data;
}

// Function to create a new supplier or edit an existing one
export async function createEditSupplier(newSupplier, id) {
  let query = supabase.from("PROVEEDOR");

  // CREATE
  if (!id) {
    query = query.insert([{ ...newSupplier }]);
  }

  // EDIT
  if (id) {
    query = query.update({ ...newSupplier }).eq("id", id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Error creating/editing supplier:", error);
    throw new Error("Supplier could not be created or edited");
  }

  return data;
}

// Function to delete a supplier
export async function deleteSupplier(id) {
  const { data, error } = await supabase
    .from("PROVEEDOR")
    .delete()
    .eq("IDProveedor", id);

  if (error) {
    console.error("Error deleting supplier:", error);
    throw new Error("Supplier could not be deleted");
  }

  return data;
}
