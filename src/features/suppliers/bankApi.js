import supabase from "../../services/supabase";

// Function to get all banks
export async function getBanks() {
  const { data, error } = await supabase.from("BANCO").select("*");

  if (error) {
    console.error("Error fetching banks:", error);
    throw new Error("Banks could not be loaded");
  }

  return data;
}

// Function to create a new bank or edit an existing one
export async function createEditBank(newBank, id) {
  let query = supabase.from("BANCO");

  // CREATE
  if (!id) {
    query = query.insert([{ ...newBank }]);
  }

  // EDIT
  if (id) {
    query = query.update({ ...newBank }).eq("id", id);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Error creating/editing bank:", error);
    throw new Error("Bank could not be created or edited");
  }

  return data;
}

// Function to delete a bank
export async function deleteBank(id) {
  const { data, error } = await supabase
    .from("BANCO")
    .delete()
    .eq("IDBanco", id);

  if (error) {
    console.error("Error deleting bank:", error);
    throw new Error("Bank could not be deleted");
  }

  return data;
}
