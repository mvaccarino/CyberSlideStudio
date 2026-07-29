export type SlideEmotion =
  | "urgency"
  | "trust"
  | "education"
  | "warning"
  | "confidence"
  | "inspiration";

export type MessageIntent =
  | "awareness"
  | "instruction"
  | "warning"
  | "comparison"
  | "call-to-action"
  | "explanation";

export type RecommendedLayout =
  | "cinematic-hero"
  | "bold-warning"
  | "split-statement"
  | "minimal-cta"
  | "comparison"
  | "checklist";

export type MessageAnalysis = {
  primaryMessage: string;
  supportingMessage: string;
  focalWords: string[];
  emotion: SlideEmotion;
  intent: MessageIntent;
  recommendedLayout: RecommendedLayout;
  confidence: number;
  rationale: string[];
};

const urgentWords = [
  "stop",
  "never",
  "immediately",
  "danger",
  "risk",
  "breach",
  "attack",
  "warning",
  "exposed",
  "stolen",
  "ransomware",
];

const actionWords = [
  "use",
  "enable",
  "protect",
  "follow",
  "create",
  "update",
  "avoid",
  "check",
  "turn on",
  "install",
];

const trustWords = [
  "secure",
  "safe",
  "trusted",
  "protect",
  "privacy",
  "confidence",
];

const comparisonWords = [
  "instead",
  "versus",
  "vs",
  "better",
  "worse",
  "before",
  "after",
  "compare",
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "but",
  "by",
  "for",
  "from",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "were",
  "with",
  "you",
  "your",
]);

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function includesAny(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase();
  return words.some((word) => normalized.includes(word));
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function sentenceFromBody(body: string): string {
  const firstSentence = normalize(body).split(/(?<=[.!?])\s+/)[0] ?? "";
  return firstSentence.replace(/[.!?]+$/, "");
}

function extractFocalWords(title: string, body: string): string[] {
  const source = `${title} ${body}`
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const scored = source
    .map((word) => {
      const cleaned = word.toLowerCase();
      let score = cleaned.length;

      if (urgentWords.includes(cleaned)) score += 12;
      if (actionWords.includes(cleaned)) score += 8;
      if (trustWords.includes(cleaned)) score += 7;
      if (stopWords.has(cleaned)) score -= 20;
      if (/^\d+%?$/.test(cleaned)) score += 10;

      return {
        word: word.replace(/^[^\w]+|[^\w]+$/g, ""),
        cleaned,
        score,
      };
    })
    .filter((item) => item.word && !stopWords.has(item.cleaned))
    .sort((a, b) => b.score - a.score);

  const unique: string[] = [];

  for (const item of scored) {
    const upper = item.word.toUpperCase();
    if (!unique.includes(upper)) {
      unique.push(upper);
    }
    if (unique.length === 3) break;
  }

  return unique;
}

function detectIntent(title: string, body: string, cta: string): MessageIntent {
  const all = `${title} ${body} ${cta}`.toLowerCase();

  if (cta.trim() || includesAny(all, ["follow", "download", "learn more"])) {
    return "call-to-action";
  }

  if (includesAny(all, comparisonWords)) {
    return "comparison";
  }

  if (includesAny(all, urgentWords)) {
    return "warning";
  }

  if (includesAny(all, actionWords)) {
    return "instruction";
  }

  if (includesAny(all, ["why", "how", "what", "means", "works"])) {
    return "explanation";
  }

  return "awareness";
}

function detectEmotion(
  title: string,
  body: string,
  intent: MessageIntent,
): SlideEmotion {
  const all = `${title} ${body}`.toLowerCase();

  if (intent === "warning") {
    return includesAny(all, ["breach", "attack", "stolen", "ransomware"])
      ? "urgency"
      : "warning";
  }

  if (intent === "call-to-action") return "inspiration";
  if (includesAny(all, trustWords)) return "trust";
  if (includesAny(all, ["strong", "simple", "easy", "control"])) {
    return "confidence";
  }

  return "education";
}

function recommendLayout(
  intent: MessageIntent,
  emotion: SlideEmotion,
  body: string,
): RecommendedLayout {
  const bodyLength = normalize(body).split(/\s+/).filter(Boolean).length;

  if (intent === "call-to-action") return "minimal-cta";
  if (intent === "comparison") return "comparison";
  if (intent === "warning" || emotion === "urgency") return "bold-warning";
  if (body.includes("\n-") || body.includes("\n•")) return "checklist";
  if (bodyLength > 34) return "split-statement";

  return "cinematic-hero";
}

function buildPrimaryMessage(title: string, body: string): string {
  const normalizedTitle = normalize(title);

  if (normalizedTitle) {
    return normalizedTitle.toUpperCase();
  }

  const bodyLead = sentenceFromBody(body);
  return bodyLead
    ? titleCase(bodyLead).toUpperCase()
    : "UNTITLED MESSAGE";
}

function buildSupportingMessage(
  body: string,
  primaryMessage: string,
): string {
  const normalizedBody = normalize(body);

  if (!normalizedBody) return "";

  const sentences = normalizedBody.split(/(?<=[.!?])\s+/);
  const first = sentences[0]?.replace(/[.!?]+$/, "") ?? "";

  if (primaryMessage.toLowerCase().includes(first.toLowerCase())) {
    return sentences.slice(1).join(" ").trim();
  }

  return normalizedBody;
}

export function analyzeSlideMessage(input: {
  title: string;
  body: string;
  cta?: string;
}): MessageAnalysis {
  const title = normalize(input.title);
  const body = normalize(input.body);
  const cta = normalize(input.cta ?? "");

  const intent = detectIntent(title, body, cta);
  const emotion = detectEmotion(title, body, intent);
  const recommendedLayout = recommendLayout(intent, emotion, body);
  const primaryMessage = buildPrimaryMessage(title, body);
  const supportingMessage = buildSupportingMessage(body, primaryMessage);
  const focalWords = extractFocalWords(title, body);

  const confidenceSignals = [
    Boolean(title),
    Boolean(body),
    focalWords.length > 0,
    intent !== "awareness",
  ].filter(Boolean).length;

  const confidence = Math.min(0.95, 0.55 + confidenceSignals * 0.1);

  const rationale = [
    `Detected ${intent} intent.`,
    `Recommended ${recommendedLayout.replaceAll("-", " ")} layout.`,
    focalWords.length
      ? `Focal words: ${focalWords.join(", ")}.`
      : "No strong focal words detected.",
  ];

  return {
    primaryMessage,
    supportingMessage,
    focalWords,
    emotion,
    intent,
    recommendedLayout,
    confidence,
    rationale,
  };
}
