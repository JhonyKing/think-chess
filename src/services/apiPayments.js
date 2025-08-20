import supabase from "./supabase";

export async function getPayments() {
  const { data, error } = await supabase.from("PAGO").select("*");

  if (error) {
    console.error(error);
    throw new Error("Payments could not be loaded");
  }

  return data;
}

// Obtener el último pago de un estudiante para precargar el banco
export async function getLastPaymentByStudent(numeroControl) {
  try {
    const { data, error } = await supabase
      .from("PAGO")
      .select("MetodoPago, Nota, FechaHora")
      .eq("NumeroControl", numeroControl)
      .order("FechaHora", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching last payment:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching last payment:", error);
    return null;
  }
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
  console.log("createPago - Datos que se van a insertar:", pago);

  const { data, error } = await supabase
    .from("PAGO")
    .insert([pago])
    .select()
    .single();

  if (error) {
    console.error("Error en createPago:", error);
    console.error("Datos del pago que causaron error:", pago);
    throw new Error(`No se pudo registrar el pago: ${error.message}`);
  }

  console.log("Pago creado exitosamente:", data);
  return data;
}

// Obtener el siguiente número de recibo único para el día actual
export async function getPaymentsByStudentAndMonth(
  numeroControl,
  mesPagado,
  idCurso
) {
  console.log(
    "getPaymentsByStudentAndMonth - NumeroControl:",
    numeroControl,
    "MesPagado:",
    mesPagado,
    "IDCurso:",
    idCurso
  );

  const { data, error } = await supabase
    .from("PAGO")
    .select("*")
    .eq("NumeroControl", numeroControl)
    .eq("MesPagado", mesPagado)
    .eq("IDCurso", idCurso) // CRÍTICO: Filtrar por mismo curso
    .order("FechaHora", { ascending: false }); // Más reciente primero

  if (error) {
    console.error("Error obteniendo pagos del estudiante y mes:", error);
    throw new Error("No se pudieron obtener los pagos del mes");
  }

  console.log(
    "getPaymentsByStudentAndMonth - Pagos encontrados del mismo curso:",
    data
  );
  return data || [];
}

export async function getNextNumeroRecibo(fecha) {
  console.log("getNextNumeroRecibo - Fecha:", fecha);
  // fecha en formato YYYY-MM-DD, convertir a YYYYMMDD para el prefijo
  const fechaPrefix = fecha.replace(/-/g, "");
  console.log("getNextNumeroRecibo - Prefijo:", fechaPrefix);

  const { data, error } = await supabase
    .from("PAGO")
    .select("NumeroRecibo")
    .like("NumeroRecibo", `${fechaPrefix}%`);

  if (error) {
    console.error("Error obteniendo números de recibo:", error);
    throw new Error("No se pudo obtener el número de recibo");
  }

  console.log("getNextNumeroRecibo - Recibos existentes:", data);

  // Buscar el mayor consecutivo
  let max = 0;
  data.forEach((r) => {
    const numeroCompleto = r.NumeroRecibo;
    // Extraer solo los últimos dígitos después del prefijo de fecha (YYYYMMDD)
    const consecutivo = numeroCompleto.slice(8); // Después de YYYYMMDD
    const num = parseInt(consecutivo, 10);
    console.log(
      `getNextNumeroRecibo - Analizando: ${numeroCompleto} -> consecutivo: ${consecutivo} -> número: ${num}`
    );
    if (!isNaN(num) && num > max) max = num;
  });

  console.log("getNextNumeroRecibo - Máximo encontrado:", max);
  const next = (max + 1).toString().padStart(3, "0");
  const numeroRecibo = `${fechaPrefix}${next}`;
  console.log("getNextNumeroRecibo - Próximo número generado:", numeroRecibo);

  // Verificación adicional: asegurar que el número no existe
  const existe = data.find((r) => r.NumeroRecibo === numeroRecibo);
  if (existe) {
    console.error("¡ERROR! El número generado ya existe:", numeroRecibo);
    throw new Error(`El número de recibo ${numeroRecibo} ya existe`);
  }

  return numeroRecibo;
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
