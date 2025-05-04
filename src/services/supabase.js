import { createClient } from "@supabase/supabase-js";
// Use environment variables for security and flexibility
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Basic check if variables are loaded
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL or Key is missing. Check your .env file and VITE_ prefix."
  );
  // Optionally throw an error or handle this state appropriately
  // throw new Error("Supabase configuration missing.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
// Export the URL as a named export
export { supabaseUrl };

//Archivo para crear la conexión con Supabase
