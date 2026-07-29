export type SceneClass =
  | "centered-corridor"
  | "centered-subject"
  | "left-weighted"
  | "right-weighted"
  | "top-open"
  | "bottom-open"
  | "balanced"
  | "abstract";

export type RegionScore = {
  x: number;
  y: number;
  width: number;
  height: number;
  brightness: number;
  detail: number;
  contrast: number;
  placementScore: number;
};

export type SceneAnalysis = {
  sceneClass: SceneClass;
  symmetry: number;
  centerBrightness: number;
  centerDetail: number;
  visualWeightX: number;
  visualWeightY: number;
  dominantBrightness: number;
  negativeSpace: RegionScore[];
  likelyVanishingPoint: { x: number; y: number; confidence: number };
};
