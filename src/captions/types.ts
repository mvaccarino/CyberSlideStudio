export type SlideTextOverlayConfiguration = {
  enabled: boolean;
  headlineMode: "off" | "brief" | "always-off";
  posterStyle:
    | "Editorial Bold"
    | "CyberSlide Bold"
    | "Documentary"
    | "Corporate"
    | "Educational"
    | "Fast Social"
    | "Viral Alert"
    | "News Report"
    | "Minimal";
  posterTextMode: "persistent" | "brief";
  alignment: "auto" | "left" | "center" | "right";
  highlightColor: string;
  showLayoutGuides: boolean;
  theme: string;
  duration: number;
  fontSize: number;
  maximumLines: number;
  topMargin: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  gradientEnabled: boolean;
  gradientOpacity: number;
  titleFont: string;
  titleColor: string;
  bodyOverlayEnabled: false;
  generatedPath: string | null;
  generatedAt: string | null;
  freshness: string | null;
  layoutFingerprint: string | null;
};
export type SubtitleConfiguration = {
  enabled: boolean;
  style: string;
  fontSize: number;
  wordsPerGroup: number;
  highlightColor: string;
  safeAreaPercent: 20 | 25 | 30;
  safeMargin: number;
  verticalPosition: "low" | "safe-center" | "high";
  gradientEnabled: boolean;
  gradientOpacity: number;
  layoutWarnings: string[];
  captionsJsonPath: string | null;
  srtPath: string | null;
  assPath: string | null;
  generatedAt: string | null;
  freshness: string | null;
};
export type CaptionGenerationResult = {
  overlay: SlideTextOverlayConfiguration;
  subtitles: SubtitleConfiguration;
  events: Array<{
    slideNumber: number;
    startSeconds: number;
    endSeconds: number;
    text: string;
    lines: string;
    words: string[];
    source?: "narration";
  }>;
  regenerated: { overlay: boolean; subtitles: boolean };
};
