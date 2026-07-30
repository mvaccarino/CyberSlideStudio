import type { SlideTextOverlayConfiguration } from "./types";
export const STYLE_TO_EDITORIAL: Record<
  string,
  SlideTextOverlayConfiguration["posterStyle"]
> = {
  "Cybersecurity Professional": "Editorial Bold",
  "Netflix Documentary": "Documentary",
  Corporate: "Corporate",
  Educational: "Educational",
  "Fast Social": "Fast Social",
  "Viral Short": "Viral Alert",
  "News Report": "News Report",
};
export const OVERLAY_THEME_SETTINGS: Record<
  string,
  Partial<SlideTextOverlayConfiguration>
> = {
  "Cybersecurity Professional": {
    titleFont: "Arial Narrow",
    fontSize: 92,
    titleColor: "#FFFFFF",
    highlightColor: "#20D7FF",
    gradientOpacity: 0.46,
  },
  "Netflix Documentary": {
    titleFont: "Georgia",
    fontSize: 78,
    titleColor: "#FFFFFF",
    highlightColor: "#E5B96B",
    gradientOpacity: 0.4,
  },
  Corporate: {
    titleFont: "Arial",
    fontSize: 74,
    titleColor: "#FFFFFF",
    highlightColor: "#5ED7FF",
    gradientOpacity: 0.36,
  },
  Educational: {
    titleFont: "Arial",
    fontSize: 76,
    titleColor: "#FFFFFF",
    highlightColor: "#FFD166",
    gradientOpacity: 0.38,
  },
  "Fast Social": {
    titleFont: "Arial Narrow",
    fontSize: 96,
    titleColor: "#FFFFFF",
    highlightColor: "#FF4D67",
    gradientOpacity: 0.5,
  },
  "Viral Short": {
    titleFont: "Arial Narrow",
    fontSize: 100,
    titleColor: "#FFFFFF",
    highlightColor: "#FF3B4F",
    gradientOpacity: 0.54,
  },
  "News Report": {
    titleFont: "Arial",
    fontSize: 76,
    titleColor: "#FFFFFF",
    highlightColor: "#49C9FF",
    gradientOpacity: 0.44,
  },
};
export const applyOverlayTheme = (
  settings: SlideTextOverlayConfiguration,
  theme: string,
): SlideTextOverlayConfiguration => ({
  ...settings,
  ...OVERLAY_THEME_SETTINGS[theme],
  theme,
  enabled: true,
  headlineMode: "brief",
  posterStyle: STYLE_TO_EDITORIAL[theme] || "Editorial Bold",
  bodyOverlayEnabled: false,
  freshness: null,
});
