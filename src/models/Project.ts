import type { ProjectSettings } from "./Settings";
import type { Slide } from "./Slide";
import type {
  ApprovedAsset,
  PipelineStatus,
  ProductionStyle,
} from "../aiDirector/types";
import type {
  SlideTextOverlayConfiguration,
  SubtitleConfiguration,
} from "../captions/types";
import type { BrandSettings, CtaPreference } from "../brand/BrandCTAEngine";

export type MusicMode = "auto-match" | "auto-rotate" | "custom" | "none";
export type MusicConfiguration = {
  mode: MusicMode;
  sourcePath: string | null;
  projectPath: string | null;
  displayTitle: string;
  category: string;
  durationSeconds: number;
  selectionReason: string;
  gain: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  duckingEnabled: boolean;
  duckingAmount: number;
  lastPreparedAt: string | null;
  finalMusicPath: string | null;
  finalMixPath: string | null;
};
export type VoiceoverConfiguration = {
  narrationPath: string | null;
  timingPath: string | null;
  totalDurationSeconds: number;
  generatedAt: string | null;
  ctaFingerprint: string | null;
  sourceFingerprint: string | null;
  scenes: Array<{
    slideNumber: number;
    text: string;
    audioPath: string;
    audioDurationSeconds: number;
    paddingBeforeSeconds: number;
    paddingAfterSeconds: number;
    sceneStartSeconds: number;
    sceneEndSeconds: number;
    sceneDurationSeconds: number;
  }>;
};

export type ProjectMetadata = {
  createdAt: string;
  updatedAt: string;
  author: string;
  description: string;
  tags: string[];
};

export type FinalRender = {
  filePath: string;
  durationSeconds: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  renderedAt: string;
  layoutFingerprint: string | null;
};

export type Project = {
  id: string;
  name: string;
  version: string;
  script: string;
  sourceTemplateId: string | null;
  brandSettings: BrandSettings;
  ctaPreference: CtaPreference;
  templateCTA: string | null;
  voiceScript: string;
  posterPrompt: string;
  motionStyle: string;
  slides: Slide[];
  settings: ProjectSettings;
  productionStyle: ProductionStyle;
  cameraStyle: string;
  captionStyle: string;
  transitionStyle: string;
  voiceStyle: string;
  musicStyle: string;
  effectsStyle: string;
  pipelineStatus: PipelineStatus;
  approvedAssetManifest: ApprovedAsset[];
  slideTextOverlay: SlideTextOverlayConfiguration;
  subtitles: SubtitleConfiguration;
  finalRender: FinalRender | null;
  music: MusicConfiguration;
  voiceover: VoiceoverConfiguration;
  metadata: ProjectMetadata;
};
