import type { Project, ProjectSettings, Slide } from "../models";
import { DEFAULT_PRODUCTION_STYLE } from "../aiDirector/productionStyles";
import { DEFAULT_BRAND_CTA } from "../brand/BrandCTAEngine";
import { loadBrandSettings } from "../brand/BrandSettingsService";
import { loadSubtitleSafeArea } from "../composition/CompositionDirector";
import { createCompositionPlan } from "../editorial/CompositionPlan";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createDefaultSettings(): ProjectSettings {
  return {
    canvas: {
      width: 1080,
      height: 1920,
      orientation: "portrait",
    },
    captionSafeZonePercent: 25,
    defaultTheme: "enterprise-cyber",
    defaultLayout: "auto",
    autoSaveEnabled: true,
    export: {
      format: "png",
      quality: 100,
      includeCaptionSafeZoneGuide: false,
      outputDirectory: null,
    },
    generation: {
      imageProvider: "none",
      model: "",
      aspectRatio: "9:16",
      promptEnhancementEnabled: true,
    },
  };
}

export function createSlide(number: number): Slide {
  const now = new Date().toISOString();

  return {
    id: createId("slide"),
    number,
    title: "",
    body: "",
    cta: "",
    notes: "",
    layout: "auto",
    theme: "project-default",
    background: {
      prompt: "",
      negativePrompt: "",
      imagePath: null,
      provider: "none",
      generationId: null,
      promptOverride: "",
      workingImagePath: null,
      approvedImagePath: null,
      approvedAt: null,
      approvalLocked: false,
    },
    typography: {
      focalWords: [],
      titleScale: 1,
      bodyScale: 1,
      titleAlignment: "left",
      bodyAlignment: "left",
    },
    editorial: null,
    layoutTemplateId: "editorial-left",
    compositionPlan: createCompositionPlan({title:"",body:"",captionSafeZonePercent:25},"editorial-left"),
    headlineLineBreaks: [],
    textStyleOverrides: {},
    compositionValidation: null,
    layoutWarnings: [],
    compositionFingerprint: null,
    workingImageFingerprint: null,
    approvedImageFingerprint: null,
    lastImagePrompt: "",
    captionSafeZonePercent: 25,
    status: "draft",
    validation: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();
  const brandSettings = loadBrandSettings();
  const subtitleSafeArea = loadSubtitleSafeArea();
  const firstSlide = createSlide(1);
  firstSlide.cta = brandSettings.defaultCTA || DEFAULT_BRAND_CTA;
  firstSlide.captionSafeZonePercent = subtitleSafeArea;

  return {
    id: createId("project"),
    name,
    version: "1.0.0",
    script: "",
    sourceTemplateId: null,
    voiceScript: "",
    posterPrompt: "",
    motionStyle: "",
    slides: [firstSlide],
    brandSettings,
    ctaPreference: "default",
    templateCTA: null,
    settings: {
      ...createDefaultSettings(),
      captionSafeZonePercent: subtitleSafeArea,
    },
    productionStyle: DEFAULT_PRODUCTION_STYLE,
    cameraStyle: DEFAULT_PRODUCTION_STYLE.cameraStyle,
    captionStyle: DEFAULT_PRODUCTION_STYLE.captionStyle,
    transitionStyle: DEFAULT_PRODUCTION_STYLE.transitionStyle,
    voiceStyle: DEFAULT_PRODUCTION_STYLE.voiceStyle,
    musicStyle: DEFAULT_PRODUCTION_STYLE.musicStyle,
    effectsStyle: DEFAULT_PRODUCTION_STYLE.effectsStyle,
    pipelineStatus: {
      script: "current",
      images: "waiting",
      voice: "waiting",
      music: "waiting",
      video: "waiting",
      publish: "waiting",
    },
    approvedAssetManifest: [],
    slideTextOverlay: {
      enabled: true,
      headlineMode: "brief",
      posterStyle: "Editorial Bold",
      posterTextMode: "persistent",
      alignment: "auto",
      highlightColor: "#20D7FF",
      showLayoutGuides: false,
      theme: "Cybersecurity Professional",
      duration: 1.8,
      fontSize: 138,
      maximumLines: 5,
      topMargin: 180,
      fadeInDuration: 0.18,
      fadeOutDuration: 0.35,
      gradientEnabled: true,
      gradientOpacity: 0.42,
      titleFont: "Impact",
      titleColor: "#FFFFFF",
      bodyOverlayEnabled: false,
      generatedPath: null,
      generatedAt: null,
      freshness: null,
      layoutFingerprint: null,
    },
    subtitles: {
      enabled: true,
      style: "CyberSlide",
      fontSize: 54,
      wordsPerGroup: 5,
      highlightColor: "#20D7FF",
      safeAreaPercent: subtitleSafeArea,
      safeMargin: 240,
      verticalPosition: "safe-center",
      gradientEnabled: true,
      gradientOpacity: 0.34,
      layoutWarnings: [],
      captionsJsonPath: null,
      srtPath: null,
      assPath: null,
      generatedAt: null,
      freshness: null,
    },
    finalRender: null,
    music: {
      mode: "auto-match",
      sourcePath: null,
      projectPath: null,
      displayTitle: "",
      category: "",
      durationSeconds: 0,
      selectionReason: "",
      gain: 0.18,
      fadeInSeconds: 0.5,
      fadeOutSeconds: 1.2,
      duckingEnabled: true,
      duckingAmount: 0.65,
      lastPreparedAt: null,
      finalMusicPath: null,
      finalMixPath: null,
    },
    voiceover: {
      narrationPath: null,
      timingPath: null,
      totalDurationSeconds: 0,
      generatedAt: null,
      ctaFingerprint: null,
      sourceFingerprint: null,
      scenes: [],
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      author: "",
      description: "",
      tags: [],
    },
  };
}
