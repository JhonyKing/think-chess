import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Importar utilidades de prueba de email (solo para desarrollo)
if (import.meta.env.DEV) {
  import("./utils/testEmailService.js");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
