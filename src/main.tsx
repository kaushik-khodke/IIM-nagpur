import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "./i18n/config.ts";

  // Suppress THREE.Clock deprecation warning from @react-three/fiber v8 (fixed in v10)
  const _origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    _origWarn.apply(console, args);
  };

  createRoot(document.getElementById("root")!).render(<App />);