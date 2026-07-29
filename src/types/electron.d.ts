import type { ProductionPackagePayload } from "../production/types";
import type { Slide } from "../models/Slide";
import type { CyberSlideVoice, CyberSlideVoiceProgress, CyberSlideVoiceStatus, VoiceGenerationResult } from "../voice/types";

type ProjectMenuAction = "new" | "open" | "save" | "saveAs";
type OpenProjectResult = { filePath: string; contents: string } | null;
type SaveProjectResult = { filePath: string } | null;
type GeneratedPosterResult = { dataUrl: string; filePath: string; revisedPrompt?: string | null };

declare global {
  interface Window {
    cyberSlideStudio: {
      platform: string;
      version: string;
      openProject: () => Promise<OpenProjectResult>;
      saveProject: (contents: string, suggestedName: string) => Promise<SaveProjectResult>;
      saveProjectAs: (contents: string, suggestedName: string) => Promise<SaveProjectResult>;
      clearCurrentProjectPath: () => Promise<void>;
      onProjectMenuAction: (callback: (action: ProjectMenuAction) => void) => () => void;
      saveFinalSlide: (payload: { dataUrl: string; slideNumber: number; projectName: string }) => Promise<{ filePath: string }>;
      saveFluxApiKey: (apiKey: string) => Promise<boolean>;
      hasFluxApiKey: () => Promise<boolean>;
      testFluxConnection: () => Promise<{ connected: boolean; credits?: number }>;
      generateFluxBackground: (payload: { prompt: string; width?: number; height?: number; model?: string }) => Promise<{ id?: string; request_id?: string; polling_url?: string }>;
      generateAndSaveFluxBackground: (payload: { prompt: string; slideNumber: number; model?: string }) => Promise<{ requestId: string; filePath: string; dataUrl: string }>;
      waitForFluxGeneration: (requestId: string) => Promise<unknown>;
      saveOpenAIApiKey: (apiKey: string) => Promise<boolean>;
      hasOpenAIApiKey: () => Promise<boolean>;
      testOpenAIConnection: () => Promise<{ connected: boolean; model: string }>;
      generateOpenAIPosters: (payload: { prompt: string; slideNumber: number; projectName: string; count?: number; quality?: "low" | "medium" | "high" }) => Promise<{ posters: GeneratedPosterResult[] }>;
      exportProductionPackage: (payload: ProductionPackagePayload) => Promise<{ folderPath: string } | null>;
      getCyberSlideVoiceStatus: () => Promise<CyberSlideVoiceStatus>;
      prepareCyberSlideVoice: () => Promise<CyberSlideVoiceStatus>;
      listCyberSlideVoices: () => Promise<CyberSlideVoice[]>;
      previewCyberSlideVoice: (payload: { projectName: string; voiceId: string; speed: number; text?: string }) => Promise<{ outputPath: string; durationSeconds: number }>;
      generateCyberSlideVoice: (payload: { projectName: string; voiceId: string; speed: number; paddingBefore: number; paddingAfter: number; slides: Slide[] }) => Promise<VoiceGenerationResult>;
      openVoiceoverFolder: (projectName: string) => Promise<string>;
      onCyberSlideVoiceProgress: (callback: (progress: CyberSlideVoiceProgress) => void) => () => void;
    };
  }
}

export type { ProjectMenuAction };
export {};
