import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), eslint()],
});

/*Este archivo configura Vite, el bundler (herramienta para 
desarrollo y build).

react() activa el soporte de React en Vite.

eslint() le dice a Vite que también use ESLint automáticamente 
cuando estés desarrollando. Así, si cometes errores de código o 
, Vite te los muestra en consola o en el navegador.

En resumen, Esto le dice a Vite que use React y ESLint como plugins.*/
