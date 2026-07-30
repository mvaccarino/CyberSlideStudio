import type { Project } from "../models/Project";
export const DEFAULT_BRAND_CTA =
  "Click the Follow button to see new cybersecurity tips every day.";
export type CtaPreference = "default" | "template";
export type BrandSettings = {
  brand: string;
  channelName: string;
  defaultCTA: string;
  website: string;
  youtube: string;
  tiktok: string;
  instagram: string;
};
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  brand: "CyberSlide",
  channelName: "",
  defaultCTA: DEFAULT_BRAND_CTA,
  website: "",
  youtube: "",
  tiktok: "",
  instagram: "",
};
export function appendCTA(
  script: string,
  cta: string,
  previousCTA?: string | null,
): string {
  let value = script.trim();
  if (previousCTA?.trim() && value.endsWith(previousCTA.trim()))
    value = value.slice(0, -previousCTA.trim().length).trim();
  return value.endsWith(cta.trim())
    ? value
    : `${value}${value ? " " : ""}${cta.trim()}`;
}
export function resolveProjectCTA(project: Project): string {
  return project.ctaPreference === "template" && project.templateCTA?.trim()
    ? project.templateCTA.trim()
    : project.brandSettings.defaultCTA.trim() || DEFAULT_BRAND_CTA;
}
export function applyProjectCTA(project: Project): Project {
  const cta = resolveProjectCTA(project);
  return {
    ...project,
    slides: project.slides.map((slide, index) =>
      index === project.slides.length - 1 ? { ...slide, cta } : slide,
    ),
    voiceScript: appendCTA(project.voiceScript, cta, project.templateCTA),
  };
}
