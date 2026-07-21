# Required edit to src/main.tsx

Wrap the application with `ProjectStoreProvider`.

Replace the current contents of `src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ProjectStoreProvider } from "./state/ProjectStore";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProjectStoreProvider>
      <App />
    </ProjectStoreProvider>
  </StrictMode>,
);
```

This installs the centralized project store at the root of the React application.

Task 2 does not yet refactor `App.tsx` to consume the store. That integration is Sprint 2 Task 3.
