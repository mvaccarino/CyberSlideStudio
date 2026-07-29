import type { CompositionPlan } from "./DesignDecision";
import { createCompositionPlan } from "./CompositionPlanner";
import { analyzeScene } from "./SceneAnalyzer";

export async function directSlide(image: HTMLImageElement): Promise<CompositionPlan> {
  const scene = await analyzeScene(image);
  return createCompositionPlan(scene);
}
