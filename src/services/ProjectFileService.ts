import type { Project, ProjectSettings, Slide } from "../models";
import {
  createDefaultSettings,
  createProject,
  createSlide,
} from "./ProjectFactory";

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
    slides: slides.length ? slides : [createSlide(1)],
    settings: normalizeSettings(parsed.settings),
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
