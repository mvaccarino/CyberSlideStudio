import type {
  SlideTextOverlayConfiguration,
  SubtitleConfiguration,
} from "./types";
type LegacyRecord = Record<string, unknown>;
export function migrateTextRenderingSettings(
  overlay: LegacyRecord,
  subtitles: LegacyRecord,
  fallbackOverlay: SlideTextOverlayConfiguration,
  fallbackSubtitles: SubtitleConfiguration,
  safeArea: number,
  hasNarration: boolean,
): {
  overlay: SlideTextOverlayConfiguration;
  subtitles: SubtitleConfiguration;
} {
  const resolvedSafeArea = safeArea === 20 || safeArea === 30 ? safeArea : 25;
  return {
    overlay: {
      ...fallbackOverlay,
      ...overlay,
      enabled: true,
      headlineMode: "brief",
      posterStyle: "Editorial Bold",
      posterTextMode:
        overlay.posterTextMode === "brief" ? "brief" : "persistent",
      alignment: "auto",
      showLayoutGuides: overlay.showLayoutGuides === true,
      highlightColor:
        typeof overlay.highlightColor === "string"
          ? overlay.highlightColor
          : "#20D7FF",
      duration: typeof overlay.duration === "number" ? overlay.duration : 2.4,
      maximumLines: 5,
      bodyOverlayEnabled: false,
      generatedPath:
        typeof overlay.generatedPath === "string"
          ? overlay.generatedPath
          : null,
    } as SlideTextOverlayConfiguration,
    subtitles: {
      ...fallbackSubtitles,
      ...subtitles,
      enabled: hasNarration ? true : subtitles.enabled !== false,
      safeAreaPercent: resolvedSafeArea,
      verticalPosition: subtitles.verticalPosition === "low" || subtitles.verticalPosition === "high" ? subtitles.verticalPosition : "safe-center",
      layoutWarnings: Array.isArray(subtitles.layoutWarnings)
        ? subtitles.layoutWarnings
        : [],
    } as SubtitleConfiguration,
  };
}
