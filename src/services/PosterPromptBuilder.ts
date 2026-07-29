import { buildPosterPromptV2 } from "../ai/PromptEngine";
import type { PosterAudience, PosterPlatform, PosterStyleId } from "../ai/types";

type PosterPromptInput = {
  headline: string;
  supportingText: string;
  cta?: string;
  theme: string;
  layout: string;
  focalWords: string[];
  styleId?: PosterStyleId;
  platform?: PosterPlatform;
  audience?: PosterAudience;
  conceptIndex?: number;
  highlightColor?: string;
};

export function buildPosterPrompt(input: PosterPromptInput): string {
  return buildPosterPromptV2({
    headline: input.headline,
    supportingText: input.supportingText,
    cta: input.cta,
    focalWords: input.focalWords,
    styleId: input.styleId ?? "enterprise-security",
    platform: input.platform ?? "short-form-vertical",
    audience: input.audience ?? "small-business",
    theme: input.theme,
    layoutHint: input.layout,
    conceptIndex: input.conceptIndex ?? 0,
    highlightColor: input.highlightColor ?? "#00B7FF",
  }).prompt;
}
