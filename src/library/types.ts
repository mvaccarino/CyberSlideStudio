export type TemplateCategory = string;
export type TemplateDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type TemplateSlide = {
  title: string;
  body: string;
  cta: string;
};

export type ProductionTemplate = {
  id: string;
  title: string;
  category: TemplateCategory;
  description: string;
  difficulty: TemplateDifficulty;
  audience: string;
  estimatedSeconds: number;
  productionStyle: string;
  cameraStyle: string;
  captionStyle: string;
  musicStyle: string;
  voiceStyle: string;
  effectsStyle: string;
  thumbnailTitle: string;
  youtubeTitle: string;
  youtubeDescription: string;
  tiktokCaption: string;
  instagramCaption: string;
  hashtags: string[];
  posterPrompt: string;
  hook: string;
  voiceScript: string;
  slides: TemplateSlide[];
  tags: string[];
  version: string;
  author: string;
  created: string;
  modified: string;
};

export type TemplateFilters = {
  category?: string;
  difficulty?: string;
  audience?: string;
  maxEstimatedSeconds?: number;
  productionStyle?: string;
  tags?: string[];
};

export type TemplateValidation = {
  valid: boolean;
  errors: string[];
};

export type LibraryScanResult = {
  root: string;
  templates: ProductionTemplate[];
  errors: Array<{ filePath: string; errors: string[] }>;
};

export type LibraryActivity = {
  favorites: string[];
  recentlyUsed: Array<{ id: string; usedAt: string }>;
};

const STRING_FIELDS: Array<keyof ProductionTemplate> = [
  "id", "title", "category", "description", "difficulty", "audience",
  "productionStyle", "cameraStyle", "captionStyle", "musicStyle", "voiceStyle",
  "effectsStyle", "thumbnailTitle", "youtubeTitle", "youtubeDescription",
  "tiktokCaption", "instagramCaption", "posterPrompt", "hook", "voiceScript",
  "version", "author", "created", "modified",
];

export function validateProductionTemplate(value: unknown): TemplateValidation {
  const errors: string[] = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, errors: ["Template must be a JSON object."] };
  }
  const item = value as Record<string, unknown>;
  for (const field of STRING_FIELDS) {
    if (typeof item[field] !== "string" || !item[field].trim()) errors.push(`${field} must be a non-empty string.`);
  }
  if (!Number.isFinite(item.estimatedSeconds) || Number(item.estimatedSeconds) <= 0) errors.push("estimatedSeconds must be a positive number.");
  for (const field of ["hashtags", "tags"] as const) {
    if (!Array.isArray(item[field]) || item[field].some((entry) => typeof entry !== "string")) errors.push(`${field} must be an array of strings.`);
  }
  if (!Array.isArray(item.slides) || item.slides.length === 0) {
    errors.push("slides must be a non-empty array.");
  } else {
    item.slides.forEach((slide, index) => {
      if (!slide || typeof slide !== "object" || Array.isArray(slide)) {
        errors.push(`slides[${index}] must be an object.`);
        return;
      }
      for (const field of ["title", "body", "cta"]) {
        if (typeof (slide as Record<string, unknown>)[field] !== "string") errors.push(`slides[${index}].${field} must be a string.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}
