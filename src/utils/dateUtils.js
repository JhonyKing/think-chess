/**
 * UTILIDADES DE FECHA CRÍTICAS PARA EL SISTEMA
 * ============================================
 *
 * SUPER IMPORTANTE: Este archivo contiene funciones críticas para manejar fechas
 * correctamente en todo el sistema. NUNCA usar new Date() directamente sin estas funciones.
 */

/**
 * Obtiene la fecha y hora actual REAL del sistema
 * @returns {Date} Fecha actual
 */
export function getCurrentDateTime() {
  return new Date();
}

/**
 * Obtiene el mes actual (0-11) donde enero = 0, febrero = 1, etc.
 * @returns {number} Mes actual (0-11)
 */
export function getCurrentMonth() {
  const now = getCurrentDateTime();
  return now.getMonth();
}

/**
 * Obtiene el año actual
 * @returns {number} Año actual (ej: 2025)
 */
export function getCurrentYear() {
  const now = getCurrentDateTime();
  return now.getFullYear();
}

/**
 * Obtiene el nombre del mes actual en español
 * @returns {string} Nombre del mes (ej: "Agosto")
 */
export function getCurrentMonthName() {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return monthNames[getCurrentMonth()];
}

/**
 * Obtiene el campo correspondiente en la tabla CURSO para el mes actual
 * @param {string} tipo - "Bajas" o "Altas"
 * @returns {string} Campo de la base de datos (ej: "BajasAgosto")
 */
export function getCurrentMonthField(tipo = "Bajas") {
  const monthFields = [
    `${tipo}Enero`,
    `${tipo}Febrero`,
    `${tipo}Marzo`,
    `${tipo}Abril`,
    `${tipo}Mayo`,
    `${tipo}Junio`,
    `${tipo}Julio`,
    `${tipo}Agosto`,
    `${tipo}Septiembre`,
    `${tipo}Octubre`,
    `${tipo}Noviembre`,
    `${tipo}Diciembre`,
  ];
  return monthFields[getCurrentMonth()];
}

/**
 * Obtiene fecha y hora en formato ISO para la base de datos
 * @returns {string} Fecha en formato ISO (ej: "2025-08-23T15:30:45.123Z")
 */
export function getCurrentISOString() {
  return getCurrentDateTime().toISOString();
}

/**
 * Formatea una fecha para mostrar al usuario
 * @param {Date} date - Fecha a formatear (opcional, usa fecha actual si no se proporciona)
 * @param {boolean} includeTime - Si incluir la hora (default: true)
 * @returns {string} Fecha formateada (ej: "23/08/2025 15:30" o "23/08/2025")
 */
export function formatDateForDisplay(date = null, includeTime = true) {
  const targetDate = date || getCurrentDateTime();
  const day = targetDate.getDate().toString().padStart(2, "0");
  const month = (targetDate.getMonth() + 1).toString().padStart(2, "0");
  const year = targetDate.getFullYear();

  let formatted = `${day}/${month}/${year}`;

  if (includeTime) {
    const hours = targetDate.getHours().toString().padStart(2, "0");
    const minutes = targetDate.getMinutes().toString().padStart(2, "0");
    formatted += ` ${hours}:${minutes}`;
  }

  return formatted;
}

/**
 * Debug: Imprime información completa de la fecha actual
 * USAR SOLO PARA DEBUGGING
 */
export function debugCurrentDate() {
  const now = getCurrentDateTime();
  console.log("🕐 INFORMACIÓN COMPLETA DE FECHA ACTUAL:");
  console.log("📅 Fecha completa:", now);
  console.log("📅 Año:", getCurrentYear());
  console.log("📅 Mes (0-11):", getCurrentMonth());
  console.log("📅 Mes nombre:", getCurrentMonthName());
  console.log("📅 Campo Bajas:", getCurrentMonthField("Bajas"));
  console.log("📅 Campo Altas:", getCurrentMonthField("Altas"));
  console.log("📅 ISO String:", getCurrentISOString());
  console.log("📅 Display:", formatDateForDisplay());
}

