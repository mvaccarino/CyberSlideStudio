import type { CompositionPlan, PlacementRegion } from "./DesignDecision";
import type { RegionScore, SceneAnalysis } from "./SceneTypes";

const WIDTH = 1080;
const HEIGHT = 1920;
const SAFE_ZONE_TOP = Math.round(HEIGHT * 0.8);

function placementName(region: RegionScore): PlacementRegion {
  const horizontal = region.x < 0.34 ? "left" : region.x > 0.55 ? "right" : "center";
  const vertical = region.y < 0.26 ? "upper" : region.y < 0.55 ? "middle" : "lower";
  if (horizontal === "center") return vertical === "upper" ? "upper-center" : "middle-left";
  return `${vertical}-${horizontal}` as PlacementRegion;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function chooseHeadlineRegion(scene: SceneAnalysis): RegionScore {
  const candidates = scene.negativeSpace.filter((region) => region.y < 0.5);

  if (scene.sceneClass === "centered-corridor" || scene.sceneClass === "centered-subject") {
    return candidates.find((region) => region.x < 0.34) ?? candidates.find((region) => region.x > 0.55) ?? candidates[0] ?? scene.negativeSpace[0];
  }

  if (scene.sceneClass === "left-weighted") {
    return candidates.find((region) => region.x > 0.55) ?? candidates[0] ?? scene.negativeSpace[0];
  }

  if (scene.sceneClass === "right-weighted") {
    return candidates.find((region) => region.x < 0.34) ?? candidates[0] ?? scene.negativeSpace[0];
  }

  return candidates[0] ?? scene.negativeSpace[0];
}

export function createCompositionPlan(scene: SceneAnalysis): CompositionPlan {
  const region = chooseHeadlineRegion(scene);
  const placement = placementName(region);
  const preserveCenter = scene.sceneClass === "centered-corridor" || scene.sceneClass === "centered-subject";
  const left = placement.includes("left");
  const headlineWidth = preserveCenter ? 650 : 760;
  const headlineX = left ? 58 : WIDTH - headlineWidth - 58;
  const headlineY = clamp(Math.round(region.y * HEIGHT) + 42, 55, 310);
  const bodyWidth = preserveCenter ? 500 : 650;
  const bodyX = left ? WIDTH - bodyWidth - 54 : 54;
  const bodyY = preserveCenter
    ? Math.min(SAFE_ZONE_TOP - 350, Math.round(scene.likelyVanishingPoint.y * HEIGHT) + 260)
    : Math.min(SAFE_ZONE_TOP - 340, 820);

  const keepClear = preserveCenter
    ? [{
        x: Math.round(WIDTH * 0.34),
        y: Math.round(HEIGHT * 0.22),
        width: Math.round(WIDTH * 0.32),
        height: Math.round(HEIGHT * 0.56),
        reason: scene.sceneClass === "centered-corridor" ? "Preserve central corridor and vanishing point" : "Preserve probable centered subject",
      }]
    : [];

  const contrastScore = 1 - Math.abs(region.brightness - 0.35);
  const preservationScore = preserveCenter ? 0.92 : 0.76;

  return {
    scene,
    templateId: "cyber-hero",
    headline: {
      region: placement,
      x: headlineX,
      y: headlineY,
      maxWidth: headlineWidth,
      scale: preserveCenter ? 0.72 : 0.84,
      rotation: left ? -4.2 : 3.4,
    },
    body: {
      region: left ? "middle-right" : "middle-left",
      x: bodyX,
      y: clamp(bodyY, 690, SAFE_ZONE_TOP - 330),
      width: bodyWidth,
      maxHeight: 300,
    },
    keepClear,
    paletteBias: scene.dominantBrightness < 0.36 ? "cool" : scene.centerBrightness > 0.62 ? "warm" : "balanced",
    score: region.placementScore * 0.42 + contrastScore * 0.23 + preservationScore * 0.35,
  };
}
