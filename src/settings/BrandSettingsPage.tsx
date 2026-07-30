import { useState } from "react";
import type { Project } from "../models/Project";
import { applyProjectCTA, type BrandSettings } from "../brand/BrandCTAEngine";
import {
  loadBrandSettings,
  saveBrandSettings,
} from "../brand/BrandSettingsService";
import { AISettings } from "./AISettings";
import {
  loadSubtitleSafeArea,
  saveSubtitleSafeArea,
  type SubtitleSafeArea,
} from "../composition/CompositionDirector";
type Props = { project: Project; onProjectChange: (project: Project) => void };
export function BrandSettingsPage({ project, onProjectChange }: Props) {
  const [settings, setSettings] = useState<BrandSettings>(() =>
    loadBrandSettings(),
  );
  const [saved, setSaved] = useState(false);
  const [safeArea, setSafeArea] = useState<SubtitleSafeArea>(() =>
    loadSubtitleSafeArea(),
  );
  const fields: Array<[keyof BrandSettings, string]> = [
    ["brand", "Brand"],
    ["channelName", "Channel Name"],
    ["defaultCTA", "Default CTA"],
    ["website", "Website"],
    ["youtube", "YouTube"],
    ["tiktok", "TikTok"],
    ["instagram", "Instagram"],
  ];
  const save = () => {
    const normalized = { ...settings, defaultCTA: settings.defaultCTA.trim() };
    saveBrandSettings(normalized);
    saveSubtitleSafeArea(safeArea);
    const next = {
      ...project,
      brandSettings: normalized,
      settings: { ...project.settings, captionSafeZonePercent: safeArea },
      slides: project.slides.map((slide) => ({
        ...slide,
        captionSafeZonePercent: safeArea,
      })),
    };
    onProjectChange(
      next.ctaPreference === "default" ? applyProjectCTA(next) : next,
    );
    setSaved(true);
  };
  return (
    <div className="settings-page">
      <section className="ai-settings-panel">
        <div>
          <p className="eyebrow">BRAND SETTINGS</p>
          <h2>Default Brand CTA</h2>
        </div>
        <div className="ai-settings-card">
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              {key === "defaultCTA" ? (
                <textarea
                  value={settings[key]}
                  onChange={(event) => {
                    setSaved(false);
                    setSettings({ ...settings, [key]: event.target.value });
                  }}
                />
              ) : (
                <input
                  value={settings[key]}
                  onChange={(event) => {
                    setSaved(false);
                    setSettings({ ...settings, [key]: event.target.value });
                  }}
                />
              )}
            </label>
          ))}
          <label>
            Subtitle Safe Area
            <select
              value={safeArea}
              onChange={(event) => {
                setSaved(false);
                setSafeArea(Number(event.target.value) as SubtitleSafeArea);
              }}
            >
              <option value={20}>20%</option>
              <option value={25}>25% (default)</option>
              <option value={30}>30%</option>
            </select>
          </label>
          <button className="primary-button" onClick={save}>
            Save Brand Settings
          </button>
          {saved && (
            <p>Brand settings saved. New projects will inherit them.</p>
          )}
        </div>
      </section>
      <AISettings />
    </div>
  );
}
