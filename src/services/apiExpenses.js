import supabase from "./supabase";

async function getExpenses() {
  const { data, error } = await supabase.from("GASTO").select("*");

  if (error) {
    console.error(error);
    throw new Error("Expenses could not be loaded");
  }

  return data;
}

export default getExpenses;
