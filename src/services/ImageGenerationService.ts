import { projectNameFromPath } from "./ProjectFileService";

export type GenerationState =
  | "idle"
  | "submitting"
  | "generating"
  | "downloading"
  | "complete"
  | "failed";

export type GenerationJob = {
  slideId: string;
  requestId?: string;
  state: GenerationState;
  progress: number;
  imagePath?: string;
  error?: string;
};

export async function generateBackground(
  prompt: string,
  model = "flux-pro-1.1",
) {
  return window.cyberSlideStudio.generateFluxBackground({
    prompt,
    model,
    width: 1080,
    height: 1920,
  });
}

export async function waitForBackground(
  requestId: string,
) {
  return window.cyberSlideStudio.waitForFluxGeneration(requestId);
}

export function projectAssetPath(
  projectFile: string,
  slideNumber: number,
) {
  const project = projectNameFromPath(projectFile);

  return `${project}/assets/slide-${String(slideNumber).padStart(2, "0")}.png`;
}