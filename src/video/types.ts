export type VideoMotionPreset =
  | "slow-zoom-in"
  | "slow-zoom-out"
  | "pan-left"
  | "pan-right";

export type VideoTransitionPreset =
  | "fade"
  | "wipe-left"
  | "wipe-right"
  | "slide-left"
  | "slide-right";

export type VideoScene = {
  slideNumber: number;
  imagePath: string;
  durationSeconds: number;
  motion: VideoMotionPreset;
  transition: VideoTransitionPreset;
  transitionSeconds: number;
};

export type NativeVideoPlan = {
  projectName: string;
  width: 1080;
  height: 1920;
  fps: 30;
  scenes: VideoScene[];
  voiceoverPath?: string;
  outputFileName?: string;
};

export type NativeVideoRenderProgress = {
  renderId: string;
  phase:
    | "preparing"
    | "rendering-scenes"
    | "assembling"
    | "adding-audio"
    | "complete"
    | "cancelled"
    | "error";
  sceneNumber?: number;
  completedScenes: number;
  totalScenes: number;
  percent: number;
  message: string;
};

export type NativeVideoRenderResult = {
  renderId: string;
  filePath: string;
  durationSeconds: number;
};
