export type ProductionSlide = {
  number: number;
  headline: string;
  body: string;
  cta: string;
  imageDataUrl?: string;
};

import type { MusicConfiguration } from "../models/Project";
import type { SlideTextOverlayConfiguration, SubtitleConfiguration } from "../captions/types";

export type ProductionPackageInput = {
  projectName: string;
  theme: string;
  layout: string;
  slides: ProductionSlide[];
  music?: MusicConfiguration;
  slideTextOverlay?: SlideTextOverlayConfiguration;
  subtitles?: SubtitleConfiguration;
};

export type ProductionPackagePayload = {
  projectName: string;
  files: Array<{ relativePath: string; contents: string }>;
  images: Array<{ relativePath: string; dataUrl: string }>;
  pdfs: Array<{ relativePath: string; html: string }>;
  attachments: Array<{ relativePath: string; sourcePath: string }>;
};
