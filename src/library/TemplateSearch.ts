import type { ProductionTemplate, TemplateFilters } from "./types";

const normalize = (value: unknown) => String(value ?? "").toLocaleLowerCase();

export function searchableText(template: ProductionTemplate): string {
  return normalize([
    template.title, template.description, template.category, template.tags.join(" "),
    template.voiceScript, template.posterPrompt,
    template.slides.flatMap((slide) => [slide.title, slide.body, slide.cta]).join(" "),
  ].join(" "));
}

export function matchesSearch(template: ProductionTemplate, query: string): boolean {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = searchableText(template);
  return terms.every((term) => haystack.includes(term));
}

export function matchesFilters(template: ProductionTemplate, filters: TemplateFilters): boolean {
  if (filters.category && template.category !== filters.category) return false;
  if (filters.difficulty && template.difficulty !== filters.difficulty) return false;
  if (filters.audience && template.audience !== filters.audience) return false;
  if (filters.productionStyle && template.productionStyle !== filters.productionStyle) return false;
  if (filters.maxEstimatedSeconds && template.estimatedSeconds > filters.maxEstimatedSeconds) return false;
  if (filters.tags?.length && !filters.tags.every((tag) => template.tags.includes(tag))) return false;
  return true;
}

export function searchTemplates(templates: ProductionTemplate[], query = "", filters: TemplateFilters = {}): ProductionTemplate[] {
  return templates.filter((template) => matchesSearch(template, query) && matchesFilters(template, filters));
}
