import type {
  MessageAnalysis,
  RecommendedLayout,
  SlideEmotion,
} from "./MessageAnalyzer";

export type TypographyRecommendation = {
  style:
    | "large-condensed"
    | "bold-stacked"
    | "editorial"
    | "minimal"
    | "warning";
  hierarchy: "single-line" | "two-line" | "three-line" | "stacked";
  titleAlignment: "left" | "center" | "right";
  bodyAlignment: "left" | "center" | "right";
  emphasis: string[];
};

export type PaletteRecommendation = {
  name: string;
  background: string;
  foreground: string;
  accent: string;
  secondaryAccent: string;
};

export type CreativeRecommendation = {
  headline: string;
  supportingText: string;
  layout: RecommendedLayout;
  emotion: SlideEmotion;
  typography: TypographyRecommendation;
  backgroundConcept: string;
  backgroundPrompt: string;
  focalWords: string[];
  palette: PaletteRecommendation;
  confidence: number;
  rationale: string[];
};

const paletteByEmotion: Record<SlideEmotion, PaletteRecommendation> = {
  urgency: {
    name: "Critical Alert",
    background: "#080B12",
    foreground: "#F6FAFF",
    accent: "#FF4D67",
    secondaryAccent: "#FFB547",
  },
  warning: {
    name: "Threat Warning",
    background: "#090C13",
    foreground: "#F6FAFF",
    accent: "#FFB547",
    secondaryAccent: "#FF4D67",
  },
  trust: {
    name: "Secure Confidence",
    background: "#06111C",
    foreground: "#EAFBFF",
    accent: "#20D7FF",
    secondaryAccent: "#39E7A1",
  },
  confidence: {
    name: "Executive Cyber",
    background: "#06111C",
    foreground: "#F1FBFF",
    accent: "#20D7FF",
    secondaryAccent: "#4D7CFF",
  },
  inspiration: {
    name: "Future Forward",
    background: "#07101C",
    foreground: "#F4FBFF",
    accent: "#8D5CFF",
    secondaryAccent: "#20D7FF",
  },
  education: {
    name: "Enterprise Learning",
    background: "#06111C",
    foreground: "#EEF9FF",
    accent: "#20D7FF",
    secondaryAccent: "#4D7CFF",
  },
};

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function shorten(text: string, maxWords: number): string {
  const words = normalize(text).split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function buildHeadline(analysis: MessageAnalysis): string {
  const primary = normalize(analysis.primaryMessage);

  if (analysis.intent === "warning" && !primary.startsWith("STOP")) {
    const focal = analysis.focalWords[0] ?? "THE RISK";
    return `STOP ${focal}`.toUpperCase();
  }

  if (
    analysis.intent === "instruction" &&
    !/^(USE|ENABLE|CREATE|PROTECT|AVOID|CHECK|INSTALL)\b/.test(primary)
  ) {
    const focal = analysis.focalWords[0] ?? primary;
    return `USE ${focal}`.toUpperCase();
  }

  return shorten(primary, 7).toUpperCase();
}

function buildSupportingText(analysis: MessageAnalysis): string {
  const text = normalize(analysis.supportingMessage);

  if (!text) {
    if (analysis.intent === "call-to-action") {
      return "Take the next step and protect what matters.";
    }

    if (analysis.intent === "warning") {
      return "One weak decision can expose every connected account.";
    }

    return "A simple change can make a meaningful security difference.";
  }

  if (analysis.intent === "warning") {
    return shorten(text, 14);
  }

  return shorten(text, 18);
}

function recommendTypography(
  layout: RecommendedLayout,
  emotion: SlideEmotion,
  focalWords: string[],
): TypographyRecommendation {
  if (layout === "bold-warning" || emotion === "urgency") {
    return {
      style: "warning",
      hierarchy: "stacked",
      titleAlignment: "left",
      bodyAlignment: "left",
      emphasis: focalWords.slice(0, 2),
    };
  }

  if (layout === "minimal-cta") {
    return {
      style: "minimal",
      hierarchy: "two-line",
      titleAlignment: "center",
      bodyAlignment: "center",
      emphasis: focalWords.slice(0, 1),
    };
  }

  if (layout === "split-statement" || layout === "comparison") {
    return {
      style: "editorial",
      hierarchy: "three-line",
      titleAlignment: "left",
      bodyAlignment: "left",
      emphasis: focalWords.slice(0, 2),
    };
  }

  return {
    style: "large-condensed",
    hierarchy: "three-line",
    titleAlignment: "left",
    bodyAlignment: "left",
    emphasis: focalWords.slice(0, 2),
  };
}

function backgroundConceptFor(
  analysis: MessageAnalysis,
): string {
  if (analysis.intent === "warning") {
    return "Cyber threat incident scene with visible risk and tension";
  }

  if (analysis.intent === "instruction") {
    return "Secure digital workflow showing the recommended action";
  }

  if (analysis.intent === "call-to-action") {
    return "Confident future-facing cybersecurity environment";
  }

  if (analysis.intent === "comparison") {
    return "Split visual contrasting insecure and secure outcomes";
  }

  return "Modern enterprise cybersecurity environment";
}

function buildBackgroundPrompt(
  analysis: MessageAnalysis,
  concept: string,
  palette: PaletteRecommendation,
): string {
  const focal = analysis.focalWords.join(", ");

  return [
    concept,
    "photorealistic",
    "cinematic enterprise cybersecurity aesthetic",
    `dominant palette ${palette.background}, ${palette.accent}, ${palette.secondaryAccent}`,
    focal ? `visual symbolism for ${focal}` : "",
    "premium Microsoft Security and CrowdStrike campaign quality",
    "dramatic volumetric lighting",
    "clean 9:16 vertical composition",
    "strong visual subject in upper 65 percent",
    "empty lower 20 percent reserved for captions",
    "no text",
    "no logos",
    "no interface labels",
    "no watermark",
  ]
    .filter(Boolean)
    .join(", ");
}

export function createCreativeRecommendation(
  analysis: MessageAnalysis,
): CreativeRecommendation {
  const headline = buildHeadline(analysis);
  const supportingText = buildSupportingText(analysis);
  const palette = paletteByEmotion[analysis.emotion];
  const typography = recommendTypography(
    analysis.recommendedLayout,
    analysis.emotion,
    analysis.focalWords,
  );
  const backgroundConcept = backgroundConceptFor(analysis);
  const backgroundPrompt = buildBackgroundPrompt(
    analysis,
    backgroundConcept,
    palette,
  );

  return {
    headline,
    supportingText,
    layout: analysis.recommendedLayout,
    emotion: analysis.emotion,
    typography,
    backgroundConcept,
    backgroundPrompt,
    focalWords: analysis.focalWords,
    palette,
    confidence: Math.min(0.98, analysis.confidence + 0.02),
    rationale: [
      ...analysis.rationale,
      `Rewrote the headline for ${analysis.intent} communication.`,
      `Selected ${typography.style.replaceAll("-", " ")} typography.`,
      `Built a ${palette.name.toLowerCase()} palette.`,
    ],
  };
}
