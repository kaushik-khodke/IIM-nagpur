import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "./i18n/config.ts";

  createRoot(document.getElementById("root")!).render(<App />);