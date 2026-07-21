type ProjectMenuAction = "new" | "open" | "save" | "saveAs";

type OpenProjectResult = {
  filePath: string;
  contents: string;
} | null;

type SaveProjectResult = {
  filePath: string;
} | null;

declare global {
  interface Window {
    cyberSlideStudio: {
      platform: string;
      version: string;
      openProject: () => Promise<OpenProjectResult>;
      saveProject: (
        contents: string,
        suggestedName: string,
      ) => Promise<SaveProjectResult>;
      saveProjectAs: (
        contents: string,
        suggestedName: string,
      ) => Promise<SaveProjectResult>;
      clearCurrentProjectPath: () => Promise<void>;
      onProjectMenuAction: (
        callback: (action: ProjectMenuAction) => void,
      ) => () => void;
    };
  }
}

export type { ProjectMenuAction };
export {};
