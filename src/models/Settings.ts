export type CanvasOrientation = "portrait" | "landscape" | "square";

export type ExportFormat = "png" | "jpg";

export type ProjectSettings = {
  canvas: {
    width: number;
    height: number;
    orientation: CanvasOrientation;
  };
  captionSafeZonePercent: number;
  defaultTheme: string;
  defaultLayout: string;
  autoSaveEnabled: boolean;
  export: {
    format: ExportFormat;
    quality: number;
    includeCaptionSafeZoneGuide: boolean;
    outputDirectory: string | null;
  };
  generation: {
    imageProvider: "flux" | "none";
    model: string;
    aspectRatio: string;
    promptEnhancementEnabled: boolean;
  };
};
