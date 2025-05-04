import supabase from "./supabase";

async function getPayments() {
  const { data, error } = await supabase.from("PAGO").select("*");

  if (error) {
    console.error(error);
    throw new Error("Payments could not be loaded");
  }

  return data;
}

export default getPayments;
