import type { SceneAnalysis } from "./SceneTypes";

export type PlacementRegion =
  | "upper-left"
  | "upper-center"
  | "upper-right"
  | "middle-left"
  | "middle-right"
  | "lower-left"
  | "lower-right";

export type CompositionPlan = {
  scene: SceneAnalysis;
  templateId: "cyber-hero";
  headline: {
    region: PlacementRegion;
    x: number;
    y: number;
    maxWidth: number;
    scale: number;
    rotation: number;
  };
  body: {
    region: PlacementRegion;
    x: number;
    y: number;
    width: number;
    maxHeight: number;
  };
  keepClear: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    reason: string;
  }>;
  paletteBias: "cool" | "warm" | "balanced";
  score: number;
};
