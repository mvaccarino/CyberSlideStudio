import {
  PRODUCTION_STYLES,
  DEFAULT_PRODUCTION_STYLE,
} from "../aiDirector/productionStyles";
import type { ProductionStyleName } from "../aiDirector/types";
import { createProject, createSlide } from "../services/ProjectFactory";
import type { Project } from "../models/Project";
import type { ProductionTemplate } from "./types";
import { applyOverlayTheme } from "../captions/styles";
import { ensureCompositionPlan } from "../editorial/CompositionPlan";
import {
  appendCTA,
  applyProjectCTA,
  type CtaPreference,
} from "../brand/BrandCTAEngine";
export function projectFromTemplate(
  template: ProductionTemplate,
  ctaPreference: CtaPreference = "default",
): Project {
  const base = createProject(template.title);
  const style =
    PRODUCTION_STYLES[template.productionStyle as ProductionStyleName] ??
    DEFAULT_PRODUCTION_STYLE;
  const templateCTA = template.slides.at(-1)?.cta.trim() || null;
  const selectedCTA =
    ctaPreference === "template" && templateCTA
      ? templateCTA
      : base.brandSettings.defaultCTA;
  const slides = template.slides.map((item, index) => {
    const slide = createSlide(index + 1);
    return ensureCompositionPlan({
      ...slide,
      title: item.title,
      body: item.body,
      cta: index === template.slides.length - 1 ? selectedCTA : "",
      notes: index === 0 ? template.voiceScript : "",
      background: {
        ...slide.background,
        prompt: template.posterPrompt,
        promptOverride: template.posterPrompt,
      },
    });
  });
  const script = slides
    .map(
      (slide, index) =>
        `Slide ${index + 1}\n\nTitle:\n${slide.title}\n\nBody:\n${slide.body}\n\nCTA:\n${slide.cta}`,
    )
    .join("\n\n");
  return applyProjectCTA({
    ...base,
    name: template.title,
    script,
    slides,
    sourceTemplateId: template.id,
    ctaPreference,
    templateCTA,
    voiceScript: appendCTA(template.voiceScript, selectedCTA, templateCTA),
    posterPrompt: template.posterPrompt,
    motionStyle: template.cameraStyle,
    productionStyle: {
      ...style,
      cameraStyle: template.cameraStyle,
      captionStyle: template.captionStyle,
      musicStyle: template.musicStyle,
      voiceStyle: template.voiceStyle,
      effectsStyle: template.effectsStyle,
    },
    cameraStyle: template.cameraStyle,
    captionStyle: template.captionStyle,
    transitionStyle: style.transitionStyle,
    voiceStyle: template.voiceStyle,
    musicStyle: template.musicStyle,
    effectsStyle: template.effectsStyle,
    slideTextOverlay: applyOverlayTheme(base.slideTextOverlay, style.name),
    metadata: {
      ...base.metadata,
      description: template.description,
      tags: [...template.tags],
    },
  });
}
