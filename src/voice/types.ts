export type CyberSlideVoice = {
  id: string;
  name: string;
  gender: string;
  accent: string;
  description: string;
  enabled: boolean;
};

export type CyberSlideVoiceStatus = {
  provider: string;
  engine: string;
  modelId: string;
  dtype: string;
  modelReady: boolean;
  requiresSubscription: boolean;
  runsLocally: boolean;
};

export type CyberSlideVoiceProgress = {
  phase: "model" | "ready" | "scene" | "complete";
  percent: number;
  message: string;
  currentScene?: number;
  totalScenes?: number;
};

export type VoiceTimingScene = {
  slideNumber: number;
  text: string;
  audioPath: string;
  audioDurationSeconds: number;
  paddingBeforeSeconds: number;
  paddingAfterSeconds: number;
  sceneStartSeconds: number;
  sceneEndSeconds: number;
  sceneDurationSeconds: number;
};

export type VoiceGenerationResult = {
  folderPath: string;
  timingPath: string;
  narrationPath: string;
  generatedAt: string;
  totalDurationSeconds: number;
  scenes: VoiceTimingScene[];
};
