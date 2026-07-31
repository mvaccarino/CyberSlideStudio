import type { ApprovedAsset, ProductionStyleName } from "../aiDirector/types";
import type { Slide } from "../models/Slide";
import type { EditorialPosterStyle, SlideEditorialLayout } from "./types";
import { decideEditorialLayout, decisionFromCompositionPlan } from "./EditorialLayoutDirector";
import { migrateEditorialPackage, validateEditorialPackage } from "./EditorialPackageDirector";
import { getLayoutTemplate } from "./LayoutTemplates";

export const EDITORIAL_PRESETS: Record<
  EditorialPosterStyle,
  {
    font: string;
    headlineSize: number;
    supportSize: number;
    highlightColor: string;
    alignment: "left" | "center";
    gradientOpacity: number;
    uppercase: boolean;
  }
> = {
  "Editorial Bold": {
    font: "Impact", headlineSize: 138, supportSize: 44, highlightColor: "#20D7FF", alignment: "left", gradientOpacity: 0.46, uppercase: true,
  },
  "CyberSlide Bold": {
    font: "Arial Narrow",
    headlineSize: 92,
    supportSize: 34,
    highlightColor: "#20D7FF",
    alignment: "left",
    gradientOpacity: 0.46,
    uppercase: true,
  },
  Documentary: {
    font: "Georgia",
    headlineSize: 78,
    supportSize: 32,
    highlightColor: "#E5B96B",
    alignment: "left",
    gradientOpacity: 0.4,
    uppercase: true,
  },
  Corporate: {
    font: "Arial",
    headlineSize: 74,
    supportSize: 31,
    highlightColor: "#5ED7FF",
    alignment: "left",
    gradientOpacity: 0.36,
    uppercase: true,
  },
  Educational: {
    font: "Arial",
    headlineSize: 76,
    supportSize: 32,
    highlightColor: "#FFD166",
    alignment: "left",
    gradientOpacity: 0.38,
    uppercase: true,
  },
  "Fast Social": {
    font: "Arial Narrow",
    headlineSize: 96,
    supportSize: 34,
    highlightColor: "#FF4D67",
    alignment: "left",
    gradientOpacity: 0.5,
    uppercase: true,
  },
  "Viral Alert": {
    font: "Arial Narrow",
    headlineSize: 100,
    supportSize: 34,
    highlightColor: "#FF3B4F",
    alignment: "left",
    gradientOpacity: 0.54,
    uppercase: true,
  },
  "News Report": {
    font: "Arial",
    headlineSize: 76,
    supportSize: 31,
    highlightColor: "#49C9FF",
    alignment: "left",
    gradientOpacity: 0.44,
    uppercase: true,
  },
  Minimal: { font: "Arial", headlineSize: 72, supportSize: 29, highlightColor: "#FFFFFF", alignment: "left", gradientOpacity: 0.28, uppercase: true },
};
export const STYLE_TO_EDITORIAL: Record<
  ProductionStyleName,
  EditorialPosterStyle
> = {
  "Cybersecurity Professional": "Editorial Bold",
  "Netflix Documentary": "Documentary",
  Corporate: "Corporate",
  Educational: "Educational",
  "Fast Social": "Fast Social",
  "Viral Short": "Viral Alert",
  "News Report": "News Report",
};
const GENERIC =
  /^(why this matters|take action today|build a stronger routine|stay safe online)$/i;
const clean = (v: string) =>
  v
    .replace(/[^\p{L}\p{N}'’\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
const words = (v: string) => clean(v).split(/\s+/).filter(Boolean);
const normalize = (v: string) => clean(v).toLocaleLowerCase();
export function simplifyDisplayHeadline(title: string): string {
  let value = clean(title)
    .replace(/\s+IN PLAIN ENGLISH$/i, " PLAIN ENGLISH")
    .replace(/\s+(?:IN|A|THE|TO)\s+(?=PLAIN ENGLISH$)/i, " ")
    .replace(/^A Real (.+) Moment$/i, "$1 IN ACTION")
    .replace(/^The (.+) Consequence$/i, "THE COST OF $1")
    .replace(/^Use (.+) More Safely$/i, "$1 SAFETY CHECK")
    .replace(/^Remember This About (.+)$/i, "NEXT STEPS FOR $1")
    .replace(/^(.+), In Plain English$/i, "WHAT $1 MEANS");
  if (GENERIC.test(value)) value = "THE RISK YOU CAN STOP";
  const list = words(value).filter((word) => !/^(IN|A|THE|TO)$/i.test(word)).slice(0, 9);
  while (list.length < 3) list.push("MATTERS");
  return list.join(" ").toUpperCase();
}
export function imageAwarePlacement(
  analysis?: ApprovedAsset["analysis"],
): Pick<SlideEditorialLayout, "layoutAlignment" | "posterTextRegion"> {
  const decision = decideEditorialLayout({ analysis });
  return { layoutAlignment: decision.alignment, posterTextRegion: decision.alignment === "left" ? "upper-left" : "upper-right" };
}
export function validateEditorial(layout: SlideEditorialLayout): string[] {
  const errors: string[] = [];
  if (!normalize(layout.displayHeadline).includes(normalize(layout.emphasizedText)))
    errors.push("Emphasized text must appear inside the headline.");
  if (GENERIC.test(layout.displayHeadline))
    errors.push("Editorial headline is generic.");
  const a = new Set(words(layout.displayHeadline.toLowerCase())),
    b = new Set(words(layout.supportingLine.toLowerCase()));
  const overlap =
    [...a].filter((v) => b.has(v)).length /
    Math.max(1, new Set([...a, ...b]).size);
  if (overlap > 0.72) errors.push("Headline and support are near-duplicates.");
  if (layout.headlineLines?.some((line) => /^(IN|A|THE|TO)$/i.test(line.text.trim())))
    errors.push("Headline contains an isolated filler-word line.");
  if (layout.headlineLines?.length > 5) errors.push("Headline exceeds five lines.");
  if (words(layout.supportingLine).length > 16)
    errors.push("Supporting line exceeds the safe layout.");
  return errors;
}
export function generateEditorialLayouts(
  slides: Slide[],
  assets: ApprovedAsset[],
  brandCTA: string,
): Slide[] {
  void brandCTA;
  const bySlide = new Map(assets.map((a) => [a.slideNumber, a]));
  return slides.map((slide) => {
    const editorialPackage = slide.editorialPackage || migrateEditorialPackage(slide);
    const displayHeadline = editorialPackage.displayHeadline,
      emphasizedText = editorialPackage.highlightPhrase;
    const existing = slide.editorial;
    const approvedAsset = bySlide.get(slide.number);
    const decision = slide.compositionPlan
      ? decisionFromCompositionPlan(slide.compositionPlan, approvedAsset?.analysis)
      : decideEditorialLayout({
          analysis: approvedAsset?.analysis,
          override: existing?.layoutOverride || "auto",
          captionSafePercent: slide.captionSafeZonePercent === 20 || slide.captionSafeZonePercent === 30 ? slide.captionSafeZonePercent : 25,
          headlineWidth: existing?.manualOverride ? existing.headlineWidth : undefined,
          supportWidth: existing?.manualOverride ? existing.supportWidth : undefined,
          textVerticalPosition: existing?.textVerticalPosition,
        });
    const layoutTemplate = getLayoutTemplate(slide.layoutTemplateId);
    const placement = { layoutAlignment: decision.alignment, posterTextRegion: decision.alignment === "left" ? "upper-left" as const : "upper-right" as const };
    const supportingLine = editorialPackage.supportLine;
    const headlineSize = Math.max(layoutTemplate.headlineSizeRange[0], existing?.headlineSize || Math.min(160,layoutTemplate.headlineSizeRange[1]));
    const stackLayout = existing?.manualOverride ? existing.stackLayout : "Block Stack";
    const lineOffsets = existing?.manualOverride ? existing.lineOffsets : [];
    const exactLines = displayHeadline.split(/\r?\n/).filter(Boolean);
    const headlineLines = exactLines.map((text,index)=>({text,xOffset:lineOffsets[index]||0,width:existing?.headlineWidth||decision.maximumHeadlineWidth,fontSize:headlineSize,alignment:decision.alignment,emphasized:text.trim().toLocaleLowerCase()===emphasizedText.trim().toLocaleLowerCase()}));
    const editorial: SlideEditorialLayout = {
      displayHeadline,
      emphasizedText,
      supportingLine,
      ...placement,
      layoutOverride: existing?.layoutOverride || "auto",
      headlineWidth: existing?.manualOverride ? existing.headlineWidth : decision.maximumHeadlineWidth,
      headlineSize,
      headlineFont: existing?.headlineFont || layoutTemplate.headlineFontFamily[0],
      headlineWeight: existing?.headlineWeight || "Heavy",
      stackLayout,
      lineSpacing: existing?.manualOverride ? existing.lineSpacing : layoutTemplate.lineSpacing,
      subjectGutter: existing?.subjectGutter || layoutTemplate.subjectSafeGutter,
      lineOffsets: headlineLines.map((line) => line.xOffset),
      headlineLines,
      supportWidth: existing?.manualOverride ? existing.supportWidth : decision.maximumSupportWidth,
      supportSize: existing?.manualOverride ? existing.supportSize : layoutTemplate.supportSize,
      textVerticalPosition: existing?.textVerticalPosition || decision.headlineAnchorPoint.y,
      highlightColor: existing?.highlightColor || "#20D7FF",
      decision,
      sourceImagePath: approvedAsset?.path || null,
      manualOverride: existing?.manualOverride || false,
      validationWarnings: [...decision.layoutWarnings],
    };
    editorial.validationWarnings = [
      ...decision.layoutWarnings,
      ...validateEditorialPackage(editorialPackage),
    ];
    return { ...slide, editorialPackage, editorial, headlineLineBreaks: headlineLines.map(line=>line.text), layoutWarnings:[...(slide.layoutWarnings||[]),...editorial.validationWarnings] };
  });
}
