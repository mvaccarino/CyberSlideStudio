import type {
  NativeVideoPlan,
  VideoMotionPreset,
  VideoScene,
  VideoTransitionPreset,
} from "./types";

const MOTIONS: readonly VideoMotionPreset[] = [
  "slow-zoom-in",
  "pan-right",
  "slow-zoom-out",
  "pan-left",
];

const TRANSITIONS: readonly VideoTransitionPreset[] = [
  "fade",
  "slide-left",
  "wipe-left",
  "slide-right",
];

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return clamp(words / 2.5 + 0.65, 3.2, 8);
}

export function buildNativeVideoPlan(input: {
  projectName: string;
  slides: Array<{
    number: number;
    imagePath?: string;
    title: string;
    body: string;
  }>;
  voiceoverPath?: string;
}): NativeVideoPlan {
  const scenes: VideoScene[] = input.slides
    .filter(
      (slide): slide is typeof slide & { imagePath: string } =>
        Boolean(slide.imagePath),
    )
    .map((slide, index) => ({
      slideNumber: slide.number,
      imagePath: slide.imagePath,
      durationSeconds: estimateDuration(
        [slide.title, slide.body].filter(Boolean).join(" "),
      ),
      motion: MOTIONS[index % MOTIONS.length],
      transition: TRANSITIONS[index % TRANSITIONS.length],
      transitionSeconds: 0.3,
    }));

  if (scenes.length === 0) {
    throw new Error("Generate or finalize at least one slide before rendering.");
  }

  return {
    projectName: input.projectName,
    width: 1080,
    height: 1920,
    fps: 30,
    scenes,
    voiceoverPath: input.voiceoverPath,
    outputFileName: `${input.projectName}-Final-Video.mp4`,
  };
}
