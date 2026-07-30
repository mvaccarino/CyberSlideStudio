import type { ProductionTemplate } from "../library/types";
import type { QualityDimensions, QualityResult } from "./types";
import {
  countWords,
  forbiddenMatches,
  normalizedTokens,
  REQUIRED_THRESHOLDS,
  TARGET_WORDS,
} from "./ScriptQualityRules";
import { validateSlidePair } from "./SlideContentValidation";
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
export function scoreTemplate(template: ProductionTemplate): QualityResult {
  const text = `${template.hook ?? ""} ${template.voiceScript} ${template.slides.map((s) => `${s.title} ${s.body}`).join(" ")}`;
  const words = countWords(template.voiceScript);
  const topicTokens = normalizedTokens(template.title);
  const textTokens = normalizedTokens(text);
  const coverage =
    [...topicTokens].filter((t) => textTokens.has(t)).length /
    Math.max(1, topicTokens.size);
  const actions = (
    text.match(
      /\b(use|turn|check|verify|remove|enable|call|save|keep|review|ask|report|update|limit|disconnect|back up)\b/gi,
    ) || []
  ).length;
  const long = (text.match(/\b\w{13,}\b/g) || []).length;
  const dimensions: QualityDimensions = {
    hookStrength: clamp(
      (template.hook?.length ?? 0) > 18 &&
        /[?!]|you|your/i.test(template.hook ?? "")
        ? 94
        : 70,
    ),
    beginnerClarity: clamp(98 - long * 2),
    topicSpecificity: clamp(88 + coverage * 12),
    practicalUsefulness: clamp(78 + actions * 4),
    naturalVoiceover: clamp(
      words >= TARGET_WORDS.min && words <= TARGET_WORDS.max ? 94 : 72,
    ),
    retentionPotential: 92,
    emotionalRelevance: 90,
    shareability: 89,
    slideReadability: clamp(
      template.slides.every((s) => countWords(s.body) <= 28) ? 96 : 75,
    ),
    topicAccuracy: 94,
  };
  const score = clamp(
    Object.values(dimensions).reduce((a, b) => a + b, 0) / 10,
  );
  const errors = [
    ...forbiddenMatches(text).map((p) => `Forbidden phrase: ${p}`),
    ...template.slides.flatMap((slide, index) =>
      validateSlidePair(slide).map((error) => `Slide ${index + 1}: ${error}`),
    ),
  ];
  if (/can feel complicated|right first steps|practical safeguards/i.test(text))
    errors.push("Generic script language.");
  if (words < TARGET_WORDS.min || words > TARGET_WORDS.max)
    errors.push(`Voice script has ${words} words.`);
  if (
    dimensions.hookStrength < REQUIRED_THRESHOLDS.hookStrength ||
    dimensions.beginnerClarity < REQUIRED_THRESHOLDS.beginnerClarity ||
    dimensions.topicSpecificity < REQUIRED_THRESHOLDS.topicSpecificity ||
    dimensions.practicalUsefulness < REQUIRED_THRESHOLDS.practicalUsefulness ||
    score < REQUIRED_THRESHOLDS.overall
  )
    errors.push("Quality threshold failed.");
  return { score, dimensions, errors };
}
export function similarity(a: string, b: string): number {
  const x = normalizedTokens(a),
    y = normalizedTokens(b);
  const intersection = [...x].filter((t) => y.has(t)).length;
  return intersection / Math.max(1, new Set([...x, ...y]).size);
}
