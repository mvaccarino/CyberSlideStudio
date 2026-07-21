import { createContext } from "react";
import type { Project, ProjectSettings, Slide } from "../models";

export type SlideContentPatch = Partial<
  Pick<
    Slide,
    | "title"
    | "body"
    | "cta"
    | "notes"
    | "layout"
    | "theme"
    | "captionSafeZonePercent"
    | "status"
    | "validation"
  >
>;

export type ProjectStoreValue = {
  project: Project;
  selectedSlideId: string | null;
  selectedSlide: Slide | null;
  isDirty: boolean;
  setProject: (project: Project) => void;
  createNewProject: (name?: string) => void;
  renameProject: (name: string) => void;
  setProjectScript: (script: string) => void;
  setScriptAndSlides: (script: string, slides: Slide[]) => void;
  updateProjectSettings: (patch: Partial<ProjectSettings>) => void;
  selectSlide: (slideId: string | null) => void;
  addSlide: (afterSlideId?: string) => string;
  duplicateSlide: (slideId: string) => string | null;
  updateSlide: (slideId: string, patch: SlideContentPatch) => void;
  replaceSlides: (slides: Slide[]) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (orderedSlideIds: string[]) => void;
  markSaved: () => void;
};

export const ProjectStoreContext =
  createContext<ProjectStoreValue | null>(null);
