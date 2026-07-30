import { searchTemplates } from "./TemplateSearch";
import type { ProductionTemplate, TemplateFilters } from "./types";

export class LibraryIndex {
  private templates = new Map<string, ProductionTemplate>();

  replace(items: ProductionTemplate[]): void {
    this.templates = new Map(items.map((item) => [item.id, item]));
  }
  all(): ProductionTemplate[] { return [...this.templates.values()]; }
  get(id: string): ProductionTemplate | undefined { return this.templates.get(id); }
  search(query = "", filters: TemplateFilters = {}): ProductionTemplate[] {
    return searchTemplates(this.all(), query, filters);
  }
  facets(field: "category" | "difficulty" | "audience" | "productionStyle" | "tags"): string[] {
    const values = this.all().flatMap((item) => field === "tags" ? item.tags : [String(item[field])]);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }
}
