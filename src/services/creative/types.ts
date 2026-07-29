export type AccentPalette = readonly [string, string, string];

export type CreativeRenderContext = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  safeZoneTop: number;
  headline: string;
  supportingText: string;
  cta?: string;
  focalWords: string[];
  foreground: string;
  accentPalette: AccentPalette;
};

export type HeadlineBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
};

export type BodyBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  bottom: number;
};

export type HeadlineRenderer = (
  input: CreativeRenderContext,
  startY: number,
) => HeadlineBounds;

export type BodyRenderer = (
  input: CreativeRenderContext,
  startY: number,
) => BodyBounds;

export type DecorationRenderer = (
  input: CreativeRenderContext,
  headline: HeadlineBounds,
  body: BodyBounds,
) => void;

export type CtaRenderer = (
  input: CreativeRenderContext,
  startY: number,
) => void;
