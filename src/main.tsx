import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ProjectStoreProvider } from "./state/ProjectStoreProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectStoreProvider>
      <App />
    </ProjectStoreProvider>
  </StrictMode>,
);
