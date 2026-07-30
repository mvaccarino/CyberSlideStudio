import { DEFAULT_BRAND_SETTINGS, type BrandSettings } from "./BrandCTAEngine";
const STORAGE_KEY = "cyberslide:brand-settings";
export function loadBrandSettings(): BrandSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_BRAND_SETTINGS };
  try {
    return {
      ...DEFAULT_BRAND_SETTINGS,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch {
    return { ...DEFAULT_BRAND_SETTINGS };
  }
}
export function saveBrandSettings(settings: BrandSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
