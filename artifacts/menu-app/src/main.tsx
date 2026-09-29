import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

/* Registrar Service Worker para PWA y audio en segundo plano */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const base = import.meta.env.BASE_URL ?? "/";
    navigator.serviceWorker
      .register(`${base}sw.js`)
      .catch(() => { /* SW no crítico — ignorar errores en dev */ });
  });
}
