import type { LibraryActivity, LibraryScanResult } from "./types";

function api() {
  if (!window.cyberSlideStudio) throw new Error("The Content Library is only available in CyberSlide Studio.");
  return window.cyberSlideStudio;
}

export const TemplateLoader = {
  scan: (): Promise<LibraryScanResult> => api().scanContentLibrary(),
  activity: (): Promise<LibraryActivity> => api().getContentLibraryActivity(),
  toggleFavorite: (id: string): Promise<LibraryActivity> => api().toggleContentLibraryFavorite(id),
  recordUsed: (id: string): Promise<LibraryActivity> => api().recordContentLibraryUse(id),
  openFolder: (): Promise<void> => api().openContentLibrary(),
};
