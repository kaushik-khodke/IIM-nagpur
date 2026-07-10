import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n/config.ts";
import { GoogleOAuthProvider } from "@react-oauth/google";

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

  // Service Worker Registration for installable PWA support
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully:", reg.scope);
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("New updates are loaded. Reloading...");
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    });
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  );