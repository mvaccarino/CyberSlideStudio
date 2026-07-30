import { LibraryIndex } from "./LibraryIndex";
import { TemplateLoader } from "./TemplateLoader";
import type { LibraryActivity, ProductionTemplate, TemplateFilters } from "./types";

export class ContentLibrary {
  readonly index = new LibraryIndex();
  activity: LibraryActivity = { favorites: [], recentlyUsed: [] };
  root = "";
  validationErrors: Array<{ filePath: string; errors: string[] }> = [];

  async load(): Promise<void> {
    const [scan, activity] = await Promise.all([TemplateLoader.scan(), TemplateLoader.activity()]);
    this.index.replace(scan.templates);
    this.root = scan.root;
    this.validationErrors = scan.errors;
    this.activity = activity;
  }
  search(query = "", filters: TemplateFilters = {}): ProductionTemplate[] {
    return this.index.search(query, filters);
  }
  async favorite(id: string): Promise<void> { this.activity = await TemplateLoader.toggleFavorite(id); }
  async used(id: string): Promise<void> { this.activity = await TemplateLoader.recordUsed(id); }
}

export * from "./types";
