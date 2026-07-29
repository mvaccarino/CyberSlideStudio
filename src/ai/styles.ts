import type { PosterStyleId } from "./types";

type StyleDefinition = {
  id: PosterStyleId;
  name: string;
  artDirection: string;
  typography: string;
  color: string;
  composition: string;
  avoid: string;
};

export const POSTER_STYLES: readonly StyleDefinition[] = [
  {
    id: "enterprise-security",
    name: "Enterprise Security",
    artDirection: "Premium enterprise cybersecurity campaign, confident, authoritative, polished, modern and credible.",
    typography: "Bold condensed sans-serif advertising typography with immaculate kerning, strong hierarchy and restrained dimensional depth.",
    color: "Deep navy and black foundation with controlled cyan, electric blue and small warm highlights.",
    composition: "Structured asymmetric advertising layout, cinematic focal subject, disciplined grid and generous breathing room.",
    avoid: "Avoid gaming aesthetics, excessive HUD clutter, cheap neon, generic dashboard cards and presentation-slide styling.",
  },
  {
    id: "cinematic-cyber",
    name: "Cinematic Cyber",
    artDirection: "Cinematic technology thriller key art with premium commercial lighting and realistic environmental storytelling.",
    typography: "Large integrated campaign headline, dramatic but readable, with selective depth, shadow and controlled perspective.",
    color: "Moody blue-black scene with volumetric cyan light and selective amber contrast.",
    composition: "Poster-like visual journey, one dominant hero image, typography integrated into negative space without covering the subject.",
    avoid: "Avoid random code overlays, floating UI boxes, overcomplicated circuitry and unreadable text effects.",
  },
  {
    id: "editorial-tech",
    name: "Editorial Tech",
    artDirection: "Award-quality technology magazine cover and editorial campaign with intelligent visual metaphor.",
    typography: "Crisp editorial headline system, strong scale contrast, refined spacing and selective accent color.",
    color: "High-contrast editorial palette with black, white and one saturated accent family.",
    composition: "Editorial crop, purposeful whitespace, modern magazine rhythm and confident alignment.",
    avoid: "Avoid corporate stock-photo layouts, glossy software panels and decorative elements without editorial purpose.",
  },
  {
    id: "minimal-premium",
    name: "Minimal Premium",
    artDirection: "Luxury technology launch campaign: simple, quiet, refined and extremely intentional.",
    typography: "Elegant modern sans serif, fewer words per line, precise spacing, no exaggerated effects.",
    color: "Near-black or soft neutral background with white typography and one subtle luminous accent.",
    composition: "One hero object or symbol, abundant negative space and a calm premium layout.",
    avoid: "Avoid clutter, cyberpunk tropes, visible template frames, excessive gradients and busy background detail.",
  },
] as const;

export function getPosterStyle(id: PosterStyleId) {
  return POSTER_STYLES.find((style) => style.id === id) ?? POSTER_STYLES[0];
}
