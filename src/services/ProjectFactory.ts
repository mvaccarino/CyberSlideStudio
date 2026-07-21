import type { Project, ProjectSettings, Slide } from "../models";

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
    captionSafeZonePercent: 20,
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
    },
    typography: {
      focalWords: [],
      titleScale: 1,
      bodyScale: 1,
      titleAlignment: "left",
      bodyAlignment: "left",
    },
    captionSafeZonePercent: 20,
    status: "draft",
    validation: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();

  return {
    id: createId("project"),
    name,
    version: "1.0.0",
    script: "",
    slides: [createSlide(1)],
    settings: createDefaultSettings(),
    metadata: {
      createdAt: now,
      updatedAt: now,
      author: "",
      description: "",
      tags: [],
    },
  };
}
