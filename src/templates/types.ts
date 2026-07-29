import type { CompositionPlan } from "../artDirector/DesignDecision";

export type TemplateRenderInput = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  safeZoneTop: number;
  headline: string;
  supportingText: string;
  cta?: string;
  focalWords: string[];
  foreground: string;
  plan: CompositionPlan;
};

export type CreativeTemplate = {
  id: string;
  name: string;
  render: (input: TemplateRenderInput) => void;
};
