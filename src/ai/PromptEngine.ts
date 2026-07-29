import { getPosterStyle } from "./styles";
import type { PosterBrief, PosterPromptResult } from "./types";

const CONCEPT_DIRECTIONS = [
  "Hero campaign: one iconic subject and immediate visual impact",
  "Visual metaphor: communicate the security lesson through one memorable symbolic scene",
  "Editorial campaign: intelligent magazine composition with strong headline rhythm",
  "Cinematic narrative: a decisive moment that implies risk, protection or consequence",
] as const;

function exactTextBlock(label: string, value?: string): string {
  if (!value?.trim()) return `${label}: OMIT THIS ELEMENT ENTIRELY.`;
  return `${label} — reproduce exactly, character-for-character:\n<<<${value.trim()}>>>`;
}

export function buildPosterPromptV2(brief: PosterBrief): PosterPromptResult {
  const style = getPosterStyle(brief.styleId);
  const direction = CONCEPT_DIRECTIONS[brief.conceptIndex % CONCEPT_DIRECTIONS.length];
  const focal = brief.focalWords.length ? brief.focalWords.join(", ") : "determine the strongest one or two words";

  const prompt = `
ROLE
Act as a senior advertising art director, graphic designer and commercial photographer creating a finished vertical campaign poster—not a presentation slide and not a background image.

DELIVERABLE
Create one complete, publication-ready vertical poster at the requested portrait dimensions. Integrate the artwork, headline, supporting copy and optional CTA into one intentional composition. The image must be ready to export with no manual typography overlay required.

CREATIVE OBJECTIVE
Communicate a practical cybersecurity lesson to ${brief.audience.replaceAll("-", " ")} viewers. The poster must stop a short-form viewer immediately, remain understandable in under two seconds and feel credible enough for a major technology brand.

CREATIVE DIRECTION
Direction: ${direction}.
Style system: ${style.name}.
Art direction: ${style.artDirection}
Typography: ${style.typography}
Color: ${style.color}
Composition: ${style.composition}
Theme context: ${brief.theme}. Layout hint: ${brief.layoutHint}.
Focal words: ${focal}. Emphasize them selectively without turning every word into a different style.
Highlight color: use ${brief.highlightColor} as the exact dominant accent color for the focal or highlighted headline words. Preserve strong readability and do not substitute a different accent hue.

EXACT ON-IMAGE TEXT
${exactTextBlock("HEADLINE", brief.headline)}
${exactTextBlock("SUPPORTING COPY", brief.supportingText)}
${exactTextBlock("CALL TO ACTION", brief.cta)}

TEXT ACCURACY REQUIREMENTS
The text above is content, not a suggestion. Spell every displayed word exactly. Do not paraphrase, add words, duplicate words, invent labels, add logos, add watermarks, add fake interface text or add decorative microcopy. Use normal readable English letterforms. The selected highlighted words must use the requested highlight color ${brief.highlightColor}; white or neutral text may be used for all other words. If the supporting copy is too long, prioritize exact headline accuracy and render the supporting copy as a compact, highly legible secondary block without changing it.

LAYOUT REQUIREMENTS
Use the headline and supporting copy as one coherent visual composition. Maintain clear hierarchy: headline first, visual story second, supporting copy third, CTA last. Keep essential content out of the bottom 20 percent because that area is reserved for social-video captions. The bottom caption-safe area may continue the artwork but must remain visually quiet and contain no essential text. Preserve faces, hands and the primary object. Do not cover the central focal subject. Use professional spacing, alignment and optical balance.

FINISH QUALITY
Premium advertising campaign, award-quality poster design, realistic lighting where appropriate, strong depth, excellent typography, clean edges, intentional detail, no visible template guides. The result should look designed by an expert creative team.

NEGATIVE DIRECTION
${style.avoid} Avoid misspellings, malformed letters, gibberish, repeated headline fragments, illegible tiny copy, text cropped by edges, excessive glass panels, generic UI widgets, clip-art locks, random glowing lines and text simply pasted on top of a photograph.
`.trim();

  return { prompt, directionName: direction, styleId: style.id };
}
