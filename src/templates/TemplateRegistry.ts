import type { CreativeTemplate } from "./types";
import { cyberHeroTemplate } from "./CyberHero/template";

const templates: readonly CreativeTemplate[] = [cyberHeroTemplate];

export function getTemplate(id: string): CreativeTemplate {
  return templates.find((template) => template.id === id) ?? cyberHeroTemplate;
}
