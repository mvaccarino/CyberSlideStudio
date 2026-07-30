const COMPOSITION_DIRECTIVE = `Compose the primary subject on the right side of the vertical frame when practical.

Reserve the left 38-45% as clean dark editorial negative space for deterministic oversized stacked typography and a short supporting line.

Keep a clear visual gutter between the editorial text zone and the visual subject zone.

Keep the bottom configured subtitle-safe area visually simple for dynamic narration captions.

Do not place faces, eyes, heads, hands, phones, laptops, screens, warning dialogs, security icons, focal objects, or important action inside the editorial text zone or caption-safe zone.

Do not generate any written headline, caption, logo, watermark, or UI text inside the source image.

When right-side subject placement is impractical, reserve the clearest opposing side as editorial negative space while preserving the three distinct zones.`;

function normalizeSafeArea(value) {
  const number = Number(value);
  return number === 20 || number === 30 ? number : 25;
}

function composePosterPrompt(prompt, safeArea) {
  const base = String(prompt || "")
    .replace(COMPOSITION_DIRECTIVE, "")
    .replace(/\n*Active configured subtitle-safe area:[^\n]*/gi, "")
    .trim();
  return `${base}

${COMPOSITION_DIRECTIVE}

Active configured subtitle-safe area: the bottom ${normalizeSafeArea(safeArea)}% of the frame. Keep this entire area free of primary-subject detail.`;
}

module.exports = {
  COMPOSITION_DIRECTIVE,
  normalizeSafeArea,
  composePosterPrompt,
};
