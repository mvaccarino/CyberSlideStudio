import { getPosterStyle } from "./styles";
import type { PosterBrief, PosterPromptResult } from "./types";

const CONCEPT_DIRECTIONS = [
  "Hero campaign: one iconic real-world subject and immediate visual impact",
  "Visual metaphor: communicate the lesson through one concrete cinematic scene",
  "Editorial campaign: a photographic magazine composition with intentional negative space",
  "Cinematic narrative: a decisive realistic moment that implies risk, protection, or consequence",
] as const;

export function buildPosterPromptV2(brief: PosterBrief): PosterPromptResult {
  const style = getPosterStyle(brief.styleId);
  const direction = CONCEPT_DIRECTIONS[brief.conceptIndex % CONCEPT_DIRECTIONS.length];
  const topic = [brief.headline, brief.supportingText].filter(Boolean).join(" � ");
  const prompt = `
ROLE
Act as a senior advertising art director and commercial photographer creating source artwork for a deterministic vertical editorial composition.

DELIVERABLE
Create one cinematic vertical 9:16 photographic scene. Generate artwork only. CyberSlide will render all headline, support, CTA, and narration captions later as separate video-composition layers.

STORY
Topic and intended scene: ${topic}.
Direction: ${direction}.
Style system: ${style.name}. ${style.artDirection}
Theme context: ${brief.theme}.
Concrete focal subject: ${brief.focalWords.join(", ") || brief.headline}.

LAYOUT PLAN
${brief.compositionInstruction || "Reserve deliberate negative space for editorial typography and keep the lower quarter calm for captions."}

SOURCE-IMAGE RULES
Do not generate written words, headlines, captions, labels, logos, watermarks, readable interfaces, warning messages, split panels, or typography. Do not bake the supplied topic wording into the image. Preserve realistic faces, hands, devices, and environmental depth inside the requested subject zone.

FINISH
Premium cinematic photography, realistic lighting, strong depth, clean edges, natural directional darkness, and a smooth transition between negative space and the photographic subject. Avoid flat opaque panels, generic hacker silhouettes, clip-art locks, random glowing UI, malformed anatomy, and visible template guides.
`.trim();
  return { prompt, directionName: direction, styleId: style.id };
}
