import supabase from "./supabase";

async function getPayments() {
  const { data, error } = await supabase.from("PAGO").select("*");

  if (error) {
    console.error(error);
    throw new Error("Payments could not be loaded");
  }

  return data;
}

// Obtener bancos
export async function getBancos() {
  const { data, error } = await supabase
    .from("BANCO")
    .select("IDBanco,NombreBanco");
  if (error) throw new Error("No se pudieron cargar los bancos");
  return data;
}

// Crear nuevo pago
export async function createPago(pago) {
  const { data, error } = await supabase
    .from("PAGO")
    .insert([pago])
    .select()
    .single();
  if (error) throw new Error("No se pudo registrar el pago");
  return data;
}

// Obtener el siguiente número de recibo único para el día actual
export async function getNextNumeroRecibo(fecha) {
  // fecha en formato YYYY-MM-DD
  const { data, error } = await supabase
    .from("PAGO")
    .select("NumeroRecibo")
    .like("NumeroRecibo", `${fecha}%`);
  if (error) throw new Error("No se pudo obtener el número de recibo");
  // Buscar el mayor consecutivo
  let max = -1;
  data.forEach((r) => {
    const num = parseInt(r.NumeroRecibo?.slice(6), 10);
    if (!isNaN(num) && num > max) max = num;
  });
  const next = (max + 1).toString().padStart(4, "0");
  return `${fecha}${next}`;
}

// Eliminar pago por NumeroRecibo
export async function deletePago(numeroRecibo) {
  const { error } = await supabase
    .from("PAGO")
    .delete()
    .eq("NumeroRecibo", numeroRecibo);
  if (error) throw new Error("No se pudo eliminar el pago");
  return true;
}

export default getPayments;
