import type { ProductionPackagePayload } from "../production/types";
import type { Slide } from "../models/Slide";
import type { MusicConfiguration } from "../models/Project";
import type { MusicLibraryResult, MusicTrack } from "../music/types";
import type {
  CyberSlideVoice,
  CyberSlideVoiceProgress,
  CyberSlideVoiceStatus,
  VoiceGenerationResult,
} from "../voice/types";
import type {
  NativeVideoPlan,
  NativeVideoRenderProgress,
  NativeVideoRenderResult,
} from "../video/types";
import type { LibraryActivity, LibraryScanResult } from "../library/types";
import type {
  CaptionGenerationResult,
  SlideTextOverlayConfiguration,
  SubtitleConfiguration,
} from "../captions/types";
type ProjectMenuAction = "new" | "open" | "save" | "saveAs";
type GeneratedPosterResult = {
  dataUrl: string;
  filePath: string;
  revisedPrompt?: string | null;
};
declare global {
  interface Window {
    cyberSlideStudio: {
      platform: string;
      version: string;
      openProject: () => Promise<{ filePath: string; contents: string } | null>;
      openRecentProject: (
        filePath: string,
      ) => Promise<{ filePath: string; contents: string }>;
      saveProject: (
        contents: string,
        suggestedName: string,
      ) => Promise<{ filePath: string } | null>;
      saveProjectAs: (
        contents: string,
        suggestedName: string,
      ) => Promise<{ filePath: string } | null>;
      clearCurrentProjectPath: () => Promise<void>;
      onProjectMenuAction: (
        callback: (action: ProjectMenuAction) => void,
      ) => () => void;
      saveFinalSlide: (payload: {
        dataUrl: string;
        slideNumber: number;
        projectName: string;
      }) => Promise<{ filePath: string }>;
      approveSlideImage: (payload: {
        sourcePath: string;
        slideNumber: number;
        projectName: string;
      }) => Promise<{ filePath: string; approvedAt: string; historyPath: string | null }>;
      readSlideImage: (filePath: string) => Promise<string>;
      openWorkingFolder: (projectName: string) => Promise<string>;
      saveFluxApiKey: (apiKey: string) => Promise<boolean>;
      hasFluxApiKey: () => Promise<boolean>;
      testFluxConnection: () => Promise<{
        connected: boolean;
        credits?: number;
      }>;
      generateFluxBackground: (payload: {
        prompt: string;
        width?: number;
        height?: number;
        model?: string;
      }) => Promise<{ id?: string; request_id?: string; polling_url?: string }>;
      generateAndSaveFluxBackground: (payload: {
        prompt: string;
        slideNumber: number;
        model?: string;
      }) => Promise<{ requestId: string; filePath: string; dataUrl: string }>;
      waitForFluxGeneration: (requestId: string) => Promise<unknown>;
      saveOpenAIApiKey: (apiKey: string) => Promise<boolean>;
      hasOpenAIApiKey: () => Promise<boolean>;
      testOpenAIConnection: () => Promise<{
        connected: boolean;
        model: string;
      }>;
      generateOpenAIPosters: (payload: {
        prompt: string;
        slideNumber: number;
        projectName: string;
        count?: number;
        quality?: "low" | "medium" | "high";
        subtitleSafeArea?: 20 | 25 | 30;
        requestId?: string;
      }) => Promise<{ posters: GeneratedPosterResult[] }>;
      exportProductionPackage: (
        payload: ProductionPackagePayload,
      ) => Promise<{ folderPath: string } | null>;
      getCyberSlideVoiceStatus: () => Promise<CyberSlideVoiceStatus>;
      prepareCyberSlideVoice: () => Promise<CyberSlideVoiceStatus>;
      listCyberSlideVoices: () => Promise<CyberSlideVoice[]>;
      previewCyberSlideVoice: (payload: {
        projectName: string;
        voiceId: string;
        speed: number;
        text?: string;
      }) => Promise<{ outputPath: string; durationSeconds: number }>;
      generateCyberSlideVoice: (payload: {
        projectName: string;
        voiceId: string;
        speed: number;
        paddingBefore: number;
        paddingAfter: number;
        slides: Slide[];
      }) => Promise<VoiceGenerationResult>;
      openVoiceoverFolder: (projectName: string) => Promise<string>;
      onCyberSlideVoiceProgress: (
        callback: (progress: CyberSlideVoiceProgress) => void,
      ) => () => void;
      checkNativeVideoRenderer: () => Promise<{
        available: boolean;
        ffmpegPath?: string;
        version?: string;
        error?: string;
      }>;
      cancelOpenAIPosterGeneration: (requestId: string) => Promise<boolean>;
      renderNativeVideo: (
        plan: NativeVideoPlan,
      ) => Promise<NativeVideoRenderResult>;
      cancelNativeVideo: (renderId: string) => Promise<boolean>;
      openVideo: (filePath: string) => Promise<string>;
      getVideoPreviewUrl: (filePath: string) => Promise<string>;
      openVideoFolder: (projectName: string) => Promise<string>;
      onNativeVideoProgress: (
        callback: (progress: NativeVideoRenderProgress) => void,
      ) => () => void;
      scanMusicLibrary: () => Promise<MusicLibraryResult>;
      autoSelectMusic: (payload: {
        mode: string;
        text: string;
      }) => Promise<MusicTrack>;
      selectCustomMusic: (payload: {
        projectName: string;
      }) => Promise<MusicTrack | null>;
      prepareMusicAudio: (payload: {
        projectName: string;
        config: MusicConfiguration;
        narrationPath: string | null;
        durationSeconds: number;
      }) => Promise<MusicConfiguration>;
      openMusicLibrary: () => Promise<string>;
      openProjectAudioFolder: (projectName: string) => Promise<string>;
      scanContentLibrary: () => Promise<LibraryScanResult>;
      getContentLibraryActivity: () => Promise<LibraryActivity>;
      toggleContentLibraryFavorite: (id: string) => Promise<LibraryActivity>;
      recordContentLibraryUse: (id: string) => Promise<LibraryActivity>;
      openContentLibrary: () => Promise<void>;
      generateCaptionAssets: (payload: {
        projectName: string;
        slides: Array<{
          number: number;
          editorialPackage: import("../editorial/EditorialPackageDirector").EditorialPackage;
          editorial?: import("../editorial/types").SlideEditorialLayout | null;
        }>;
        scenes: Array<{
          slideNumber: number;
          text: string;
          sceneStartSeconds: number;
          sceneEndSeconds: number;
          paddingBeforeSeconds: number;
          paddingAfterSeconds: number;
        }>;
        narrationPath: string | null;
        timingPath: string | null;
        narrationMarker: string | null;
        overlaySettings: SlideTextOverlayConfiguration;
        subtitleSettings: SubtitleConfiguration;
        force?: boolean;
      }) => Promise<CaptionGenerationResult>;
      openCaptionsFolder: (projectName: string) => Promise<string>;
    };
  }
}
export type { ProjectMenuAction };
export {};
