import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "./i18n/config.ts";

  // Override fetch to forward requests to the Render backend when deployed on Vercel
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string" && (input.startsWith("/api") || input.startsWith("/uploads"))) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
      const base = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
      input = `${base}${input}`;
    }
    return originalFetch(input, init);
  };

  // Suppress THREE.Clock deprecation warning from @react-three/fiber v8 (fixed in v10)
  const _origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _origWarn.apply(console, args);
  };

  createRoot(document.getElementById("root")!).render(<App />);