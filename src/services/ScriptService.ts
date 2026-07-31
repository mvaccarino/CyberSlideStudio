import type { Slide, SlideValidationIssue } from "../models";
import {
  parseCyberSlideScript,
  serializeCyberSlideScript,
  type ParsedSlide,
  type SlideField,
} from "../parser/parseScript";
import { createSlide } from "./ProjectFactory";
import { generateEditorialPackage } from "../editorial/EditorialPackageDirector";

const parserFields = new Set<SlideField | "slide">([
  "title",
  "body",
  "cta",
  "notes",
  "slide",
]);

function toModelValidation(slide: ParsedSlide): SlideValidationIssue[] {
  return slide.issues.map((issue, index) => ({
    id: `${slide.id}-${issue.field}-${index}`,
    severity: issue.severity,
    field: issue.field,
    message: issue.message,
  }));
}

export function scriptToProjectSlides(
  script: string,
  existingSlides: Slide[],
): {
  slides: Slide[];
  ignoredPreamble: string[];
  globalIssueCount: number;
} {
  const parsed = parseCyberSlideScript(script);

  const slides = parsed.slides.map((parsedSlide, index) => {
    const existing = existingSlides[index];
    const base = existing ?? createSlide(index + 1);

    return {
      ...base,
      number: index + 1,
      title: parsedSlide.title,
      body: parsedSlide.body,
      cta: parsedSlide.cta,
      notes: parsedSlide.notes,
      editorialPackage: base.editorialPackage?.manuallyEdited ? base.editorialPackage : generateEditorialPackage({title:parsedSlide.title,body:parsedSlide.body,cta:parsedSlide.cta,layoutTemplate:base.layoutTemplateId,posterPrompt:base.editorialPackage?.posterPrompt,motionHint:base.editorialPackage?.motionHint,captionHint:base.editorialPackage?.captionHint}),
      editorial: base.editorialPackage?.manuallyEdited ? base.editorial : null,
      validation: toModelValidation(parsedSlide),
      status: parsedSlide.isValid ? ("ready" as const) : ("draft" as const),
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    slides,
    ignoredPreamble: parsed.ignoredPreamble,
    globalIssueCount: parsed.globalIssues.length,
  };
}

export function projectSlidesToScript(
  slides: Slide[],
  preamble: string[] = [],
): string {
  const parserSlides: ParsedSlide[] = slides.map((slide, index) => ({
    id: slide.id,
    number: index + 1,
    title: slide.title,
    body: slide.body,
    cta: slide.cta,
    notes: slide.notes,
    issues: slide.validation
      .filter(
        (issue) =>
          parserFields.has(issue.field as SlideField | "slide") &&
          issue.severity !== "info",
      )
      .map((issue) => ({
        severity: issue.severity === "error" ? "error" : "warning",
        field: issue.field as SlideField | "slide",
        message: issue.message,
      })),
    isValid: slide.validation.length === 0,
  }));

  return serializeCyberSlideScript(parserSlides, preamble);
}
