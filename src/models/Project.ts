import type { ProjectSettings } from "./Settings";
import type { Slide } from "./Slide";

export type ProjectMetadata = {
  createdAt: string;
  updatedAt: string;
  author: string;
  description: string;
  tags: string[];
};

export type Project = {
  id: string;
  name: string;
  version: string;
  script: string;
  slides: Slide[];
  settings: ProjectSettings;
  metadata: ProjectMetadata;
};
