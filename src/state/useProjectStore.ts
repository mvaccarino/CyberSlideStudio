import { useContext } from "react";
import { ProjectStoreContext } from "./ProjectStoreContext";

export function useProjectStore() {
  const store = useContext(ProjectStoreContext);

  if (!store) {
    throw new Error(
      "useProjectStore must be used inside a ProjectStoreProvider.",
    );
  }

  return store;
}
