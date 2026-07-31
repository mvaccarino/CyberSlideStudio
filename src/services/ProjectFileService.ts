import type { Project, ProjectSettings, Slide } from "../models";
import { migrateEditorialPackage } from "../editorial/EditorialPackageDirector";
import {
  createDefaultSettings,
  createProject,
  createSlide,
} from "./ProjectFactory";
import { DEFAULT_BRAND_CTA } from "../brand/BrandCTAEngine";
import { migrateTextRenderingSettings } from "../captions/migration";
import { decideEditorialLayout } from "../editorial/EditorialLayoutDirector";
import { createCompositionPlan, emptyValidationResult } from "../editorial/CompositionPlan";
import { DEFAULT_LAYOUT_TEMPLATE_ID, getLayoutTemplate, type LayoutTemplateId } from "../editorial/LayoutTemplates";

const CURRENT_PROJECT_VERSION = "1.0.0";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSettings(value: unknown): ProjectSettings {
  const defaults = createDefaultSettings();

  if (!isRecord(value)) {
    return defaults;
  }

  const canvas = isRecord(value.canvas) ? value.canvas : {};
  const exportSettings = isRecord(value.export) ? value.export : {};
  const generation = isRecord(value.generation) ? value.generation : {};

  return {
    ...defaults,
    ...value,
    canvas: {
      ...defaults.canvas,
      ...canvas,
    },
    export: {
      ...defaults.export,
      ...exportSettings,
    },
    generation: {
      ...defaults.generation,
      ...generation,
    },
  } as ProjectSettings;
}

function normalizeSlide(value: unknown, index: number): Slide {
  const defaults = createSlide(index + 1);

  if (!isRecord(value)) {
    return defaults;
  }

  const background = isRecord(value.background) ? value.background : {};
  const typography = isRecord(value.typography) ? value.typography : {};
  const title = typeof value.title === "string" ? value.title : "";
  const body = typeof value.body === "string" ? value.body : "";
  const requestedLayout = typeof value.layoutTemplateId === "string" ? value.layoutTemplateId : DEFAULT_LAYOUT_TEMPLATE_ID;
  const layoutTemplateId = getLayoutTemplate(requestedLayout).id as LayoutTemplateId;
  const compositionSeed = { ...defaults, title, body, captionSafeZonePercent: value.captionSafeZonePercent === 20 || value.captionSafeZonePercent === 30 ? value.captionSafeZonePercent : 25 };

  return {
    ...defaults,
    ...value,
    id: typeof value.id === "string" ? value.id : defaults.id,
    number: index + 1,
    title: typeof value.title === "string" ? value.title : "",
    body: typeof value.body === "string" ? value.body : "",
    cta: typeof value.cta === "string" ? value.cta : "",
    notes: typeof value.notes === "string" ? value.notes : "",
    background: {
      ...defaults.background,
      ...background,
    },
    typography: {
      ...defaults.typography,
      ...typography,
    },
    editorialPackage: migrateEditorialPackage({title,body,cta:typeof value.cta === "string" ? value.cta : "",layoutTemplateId,editorial:isRecord(value.editorial) ? value.editorial : null}, value.editorialPackage),
    editorial: isRecord(value.editorial)
      ? (() => {
          const legacy = value.editorial;
          const layoutOverride = legacy.layoutOverride === "text-left" || legacy.layoutOverride === "text-right" || legacy.layoutOverride === "top-left" || legacy.layoutOverride === "top-right" ? legacy.layoutOverride : "auto";
          const decision = decideEditorialLayout({ override: layoutOverride });
          return {
            ...legacy,
            layoutAlignment: decision.alignment,
            posterTextRegion: decision.alignment === "left" ? "upper-left" : "upper-right",
            layoutOverride,
            headlineWidth: legacy.manualOverride === true && typeof legacy.headlineWidth === "number" ? legacy.headlineWidth : decision.maximumHeadlineWidth,
            headlineSize: legacy.manualOverride === true && typeof legacy.headlineSize === "number" ? Math.max(112, legacy.headlineSize) : 138,
            headlineFont: typeof legacy.headlineFont === "string" ? legacy.headlineFont : "Impact",
            headlineWeight: legacy.headlineWeight === "Black" ? "Black" : "Heavy",
            stackLayout: typeof legacy.stackLayout === "string" ? legacy.stackLayout : "Editorial Rag",
            lineSpacing: legacy.manualOverride === true && typeof legacy.lineSpacing === "number" ? legacy.lineSpacing : -6,
            subjectGutter: typeof legacy.subjectGutter === "number" ? legacy.subjectGutter : 54,
            lineOffsets: Array.isArray(legacy.lineOffsets) ? legacy.lineOffsets : [],
            headlineLines: Array.isArray(legacy.headlineLines) ? legacy.headlineLines : [],
            supportWidth: legacy.manualOverride === true && typeof legacy.supportWidth === "number" ? legacy.supportWidth : decision.maximumSupportWidth,
            supportSize: typeof legacy.supportSize === "number" ? legacy.supportSize : 44,
            textVerticalPosition: typeof legacy.textVerticalPosition === "number" ? legacy.textVerticalPosition : decision.headlineAnchorPoint.y,
            highlightColor: typeof legacy.highlightColor === "string" ? legacy.highlightColor : "#20D7FF",
            decision,
            sourceImagePath: typeof legacy.sourceImagePath === "string" ? legacy.sourceImagePath : null,
            validationWarnings: [...decision.layoutWarnings, ...(Array.isArray(legacy.validationWarnings) ? legacy.validationWarnings : [])],
          } as Slide["editorial"];
        })()
      : null,
    layoutTemplateId,
    compositionPlan: isRecord(value.compositionPlan) ? value.compositionPlan as Slide["compositionPlan"] : createCompositionPlan(compositionSeed, layoutTemplateId),
    headlineLineBreaks: Array.isArray(value.headlineLineBreaks) ? value.headlineLineBreaks.filter((item): item is string => typeof item === "string") : [],
    textStyleOverrides: isRecord(value.textStyleOverrides) ? value.textStyleOverrides as Slide["textStyleOverrides"] : {},
    compositionValidation: isRecord(value.compositionValidation) ? value.compositionValidation as Slide["compositionValidation"] : (typeof background.approvedImagePath === "string" ? emptyValidationResult() : null),
    layoutWarnings: Array.isArray(value.layoutWarnings) ? value.layoutWarnings.filter((item): item is string => typeof item === "string") : (typeof background.approvedImagePath === "string" ? ["Approved image predates layout-first planning; regenerate only if visual zones do not match."] : []),
    compositionFingerprint: typeof value.compositionFingerprint === "string" ? value.compositionFingerprint : null,
    workingImageFingerprint: typeof value.workingImageFingerprint === "string" ? value.workingImageFingerprint : null,
    workingGeneratedAt: typeof value.workingGeneratedAt === "string" ? value.workingGeneratedAt : null,
    approvedImageFingerprint: typeof value.approvedImageFingerprint === "string" ? value.approvedImageFingerprint : null,
    lastImagePrompt: typeof value.lastImagePrompt === "string" ? value.lastImagePrompt : "",
    validation: Array.isArray(value.validation) ? value.validation : [],
  } as Slide;
}

export function serializeProject(project: Project): string {
  return JSON.stringify(
    {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      metadata: {
        ...project.metadata,
        updatedAt: new Date().toISOString(),
      },
    },
    null,
    2,
  );
}

export function deserializeProject(contents: string): Project {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!isRecord(parsed)) {
    throw new Error("This is not a valid CyberSlide project.");
  }

  const fallback = createProject();
  const rawSlides = Array.isArray(parsed.slides) ? parsed.slides : [];
  const slides = rawSlides.map(normalizeSlide);

  const metadata = isRecord(parsed.metadata) ? parsed.metadata : {};
  const music = isRecord(parsed.music) ? parsed.music : {};
  const voiceover = isRecord(parsed.voiceover) ? parsed.voiceover : {};
  const productionStyle = isRecord(parsed.productionStyle)
    ? parsed.productionStyle
    : fallback.productionStyle;
  const slideTextOverlay = isRecord(parsed.slideTextOverlay)
    ? parsed.slideTextOverlay
    : {};
  const subtitles = isRecord(parsed.subtitles) ? parsed.subtitles : {};
  const brandSettings = isRecord(parsed.brandSettings)
    ? parsed.brandSettings
    : {};
  const finalCTA = slides.at(-1)?.cta.trim() || "";
  const ctaPreference =
    parsed.ctaPreference === "template" || parsed.ctaPreference === "default"
      ? parsed.ctaPreference
      : finalCTA && finalCTA !== DEFAULT_BRAND_CTA
        ? "template"
        : "default";

  const normalizedProjectSettings = normalizeSettings(parsed.settings);
  const hasNarration =
    typeof voiceover.narrationPath === "string" ||
    (Array.isArray(voiceover.scenes) && voiceover.scenes.length > 0);
  const migratedText = migrateTextRenderingSettings(
    slideTextOverlay,
    subtitles,
    fallback.slideTextOverlay,
    fallback.subtitles,
    normalizedProjectSettings.captionSafeZonePercent,
    hasNarration,
  );
  return {
    ...fallback,
    ...parsed,
    id: typeof parsed.id === "string" ? parsed.id : fallback.id,
    name:
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name
        : "Untitled Project",
    version:
      typeof parsed.version === "string"
        ? parsed.version
        : CURRENT_PROJECT_VERSION,
    script: typeof parsed.script === "string" ? parsed.script : "",
    sourceTemplateId:
      typeof parsed.sourceTemplateId === "string"
        ? parsed.sourceTemplateId
        : null,
    brandSettings: { ...fallback.brandSettings, ...brandSettings },
    ctaPreference,
    templateCTA:
      typeof parsed.templateCTA === "string"
        ? parsed.templateCTA
        : ctaPreference === "template"
          ? finalCTA
          : null,
    voiceScript:
      typeof parsed.voiceScript === "string" ? parsed.voiceScript : "",
    posterPrompt:
      typeof parsed.posterPrompt === "string" ? parsed.posterPrompt : "",
    motionStyle:
      typeof parsed.motionStyle === "string" ? parsed.motionStyle : "",
    slides: slides.length ? slides : [createSlide(1)],
    settings: normalizedProjectSettings,
    productionStyle: { ...fallback.productionStyle, ...productionStyle },
    cameraStyle:
      typeof parsed.cameraStyle === "string"
        ? parsed.cameraStyle
        : String(productionStyle.cameraStyle || fallback.cameraStyle),
    captionStyle:
      typeof parsed.captionStyle === "string"
        ? parsed.captionStyle
        : String(productionStyle.captionStyle || fallback.captionStyle),
    transitionStyle:
      typeof parsed.transitionStyle === "string"
        ? parsed.transitionStyle
        : String(productionStyle.transitionStyle || fallback.transitionStyle),
    voiceStyle:
      typeof parsed.voiceStyle === "string"
        ? parsed.voiceStyle
        : String(productionStyle.voiceStyle || fallback.voiceStyle),
    musicStyle:
      typeof parsed.musicStyle === "string"
        ? parsed.musicStyle
        : String(productionStyle.musicStyle || fallback.musicStyle),
    effectsStyle:
      typeof parsed.effectsStyle === "string"
        ? parsed.effectsStyle
        : String(productionStyle.effectsStyle || fallback.effectsStyle),
    pipelineStatus: isRecord(parsed.pipelineStatus)
      ? { ...fallback.pipelineStatus, ...parsed.pipelineStatus }
      : fallback.pipelineStatus,
    approvedAssetManifest: Array.isArray(parsed.approvedAssetManifest)
      ? parsed.approvedAssetManifest
      : [],
    slideTextOverlay: migratedText.overlay,
    subtitles: migratedText.subtitles,
    finalRender:
      isRecord(parsed.finalRender) &&
      typeof parsed.finalRender.filePath === "string"
        ? ({ ...parsed.finalRender, layoutFingerprint: typeof parsed.finalRender.layoutFingerprint === "string" ? parsed.finalRender.layoutFingerprint : null } as Project["finalRender"])
        : null,
    music: {
      ...fallback.music,
      ...music,
      mode:
        music.mode === "auto-match" ||
        music.mode === "auto-rotate" ||
        music.mode === "custom" ||
        music.mode === "none"
          ? music.mode
          : fallback.music.mode,
    },
    voiceover: {
      ...fallback.voiceover,
      ...voiceover,
      scenes: Array.isArray(voiceover.scenes) ? voiceover.scenes : [],
    },
    metadata: {
      ...fallback.metadata,
      ...metadata,
      createdAt:
        typeof metadata.createdAt === "string"
          ? metadata.createdAt
          : fallback.metadata.createdAt,
      updatedAt: new Date().toISOString(),
      tags: Array.isArray(metadata.tags)
        ? metadata.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
    },
  } as Project;
}

export function projectNameFromPath(filePath: string): string {
  const fileName = filePath.split(/[\\/]/).pop() ?? "Untitled Project";
  return fileName.replace(/\.cslide$/i, "");
}
