export type HeadlineEmphasis = "none" | "accent" | "gradient";

export type HeadlineLine = {
  words: string[];
  emphasis: HeadlineEmphasis;
  scale: number;
  rotation: number;
  offsetX: number;
};

export type HeadlineStyle =
  | "blockbuster"
  | "editorial"
  | "staggered"
  | "compact"
  | "impact";

export type BodyStyle = "glass-card" | "outlined-card" | "minimal-band";

export type TypographyPlan = {
  style: HeadlineStyle;
  headlineLines: HeadlineLine[];
  headlineFontSize: number;
  headlineLineHeight: number;
  bodyStyle: BodyStyle;
  bodyLead: string;
  bodyEmphasis: string;
  bodyTail: string;
  bodyFontSize: number;
  bodyLineHeight: number;
  accentVariant: "cyan" | "gold" | "coral" | "violet" | "green";
};

const STOP_WORDS = new Set([
  "A",
  "AN",
  "AND",
  "ARE",
  "AS",
  "AT",
  "BE",
  "BY",
  "FOR",
  "FROM",
  "HOW",
  "IN",
  "IS",
  "IT",
  "OF",
  "ON",
  "OR",
  "THE",
  "THIS",
  "TO",
  "WHY",
  "WITH",
  "YOU",
  "YOUR",
]);

function normalizeWord(word: string): string {
  return word.replace(/[^\w]/g, "").toUpperCase();
}

function splitHeadline(headline: string): string[] {
  return headline
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
}

function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function chooseEmphasisWords(
  headlineWords: string[],
  focalWords: string[],
): Set<string> {
  const normalizedFocal = focalWords.map(normalizeWord).filter(Boolean);
  const chosen = new Set(normalizedFocal.slice(0, 2));

  if (chosen.size === 0) {
    headlineWords
      .map(normalizeWord)
      .filter((word) => word.length >= 5 && !STOP_WORDS.has(word))
      .sort((a, b) => b.length - a.length)
      .slice(0, 2)
      .forEach((word) => chosen.add(word));
  }

  return chosen;
}

function groupWords(words: string[], style: HeadlineStyle): string[][] {
  if (words.length <= 3) return words.map((word) => [word]);

  if (style === "blockbuster") {
    if (words.length === 4) {
      return [[words[0]], [words[1]], [words[2]], [words[3]]];
    }

    return [
      words.slice(0, 1),
      words.slice(1, 2),
      words.slice(2, Math.min(4, words.length)),
      words.slice(Math.min(4, words.length)),
    ].filter((line) => line.length);
  }

  if (style === "editorial") {
    if (words.length === 4) {
      return [words.slice(0, 2), [words[2]], [words[3]]];
    }

    return [
      words.slice(0, 2),
      words.slice(2, 4),
      words.slice(4),
    ].filter((line) => line.length);
  }

  if (style === "compact") {
    const lines: string[][] = [];
    let cursor = 0;

    while (cursor < words.length) {
      const remaining = words.length - cursor;
      const take = remaining > 3 ? 2 : remaining;
      lines.push(words.slice(cursor, cursor + take));
      cursor += take;
    }

    return lines.slice(0, 4);
  }

  if (style === "impact") {
    if (words.length === 4) {
      return [[words[0]], words.slice(1, 3), [words[3]]];
    }

    return [
      words.slice(0, 1),
      words.slice(1, 3),
      words.slice(3),
    ].filter((line) => line.length);
  }

  // staggered
  return words.map((word) => [word]).slice(0, 5);
}

function createHeadlineLines(
  headline: string,
  focalWords: string[],
  style: HeadlineStyle,
): HeadlineLine[] {
  const words = splitHeadline(headline);
  const emphasisWords = chooseEmphasisWords(words, focalWords);
  const grouped = groupWords(words, style);

  return grouped.map((lineWords, index) => {
    const hasFocal = lineWords.some((word) =>
      emphasisWords.has(normalizeWord(word)),
    );

    const emphasis: HeadlineEmphasis = hasFocal
      ? index % 2 === 0
        ? "gradient"
        : "accent"
      : "none";

    const styleSettings: Record<
      HeadlineStyle,
      { scales: number[]; rotations: number[]; offsets: number[] }
    > = {
      blockbuster: {
        scales: [1.08, 1.15, 1.02, 1.12],
        rotations: [-2.5, -1.3, 0.5, -1.2],
        offsets: [0, 12, 2, 24],
      },
      editorial: {
        scales: [1, 1.06, 1.12],
        rotations: [0, 0, 0],
        offsets: [0, 0, 18],
      },
      staggered: {
        scales: [1.02, 1.12, 1.06, 1.14, 1.02],
        rotations: [-1.3, 0.8, -0.8, 1.1, 0],
        offsets: [0, 42, 4, 58, 16],
      },
      compact: {
        scales: [1, 1.06, 1.1, 1],
        rotations: [0, 0, 0, 0],
        offsets: [0, 0, 0, 0],
      },
      impact: {
        scales: [1.18, 1, 1.15],
        rotations: [-1.5, 0, 1],
        offsets: [0, 20, 2],
      },
    };

    const settings = styleSettings[style];

    return {
      words: lineWords,
      emphasis,
      scale: settings.scales[index] ?? 1,
      rotation: settings.rotations[index] ?? 0,
      offsetX: settings.offsets[index] ?? 0,
    };
  });
}

function splitBody(
  supportingText: string,
  focalWords: string[],
): {
  lead: string;
  emphasis: string;
  tail: string;
} {
  const text = supportingText.trim();

  if (!text) {
    return { lead: "", emphasis: "", tail: "" };
  }

  const numericPhrase = text.match(/\b\d[\d,]*(?:\s+\w+){0,2}/);

  if (numericPhrase?.index !== undefined) {
    return {
      lead: text.slice(0, numericPhrase.index).trim(),
      emphasis: numericPhrase[0].trim(),
      tail: text
        .slice(numericPhrase.index + numericPhrase[0].length)
        .trim(),
    };
  }

  const focal = focalWords
    .map((word) => word.trim())
    .filter((word) => word.length >= 3)
    .sort((a, b) => b.length - a.length);

  for (const phrase of focal) {
    const index = text.toLowerCase().indexOf(phrase.toLowerCase());

    if (index >= 0) {
      return {
        lead: text.slice(0, index).trim(),
        emphasis: text.slice(index, index + phrase.length).trim(),
        tail: text.slice(index + phrase.length).trim(),
      };
    }
  }

  const words = text.split(/\s+/);
  const midpoint = Math.max(1, Math.floor(words.length / 2));

  return {
    lead: words.slice(0, midpoint).join(" "),
    emphasis: words.slice(midpoint, Math.min(midpoint + 3, words.length)).join(" "),
    tail: words.slice(Math.min(midpoint + 3, words.length)).join(" "),
  };
}

export function createTypographyPlan(input: {
  headline: string;
  supportingText: string;
  focalWords: string[];
}): TypographyPlan {
  const words = splitHeadline(input.headline);

  const availableStyles: HeadlineStyle[] =
    words.length >= 5
      ? ["editorial", "compact", "staggered"]
      : ["blockbuster", "editorial", "impact", "staggered"];

  const style = randomItem(availableStyles);
  const headlineLines = createHeadlineLines(
    input.headline,
    input.focalWords,
    style,
  );
  const body = splitBody(input.supportingText, input.focalWords);

  const longestLine = Math.max(
    ...headlineLines.map((line) => line.words.join(" ").length),
    1,
  );

  const baseSize =
    longestLine >= 16
      ? 94
      : longestLine >= 12
        ? 108
        : 126;

  return {
    style,
    headlineLines,
    headlineFontSize: baseSize,
    headlineLineHeight: Math.round(baseSize * 0.91),
    bodyStyle: randomItem([
      "glass-card",
      "outlined-card",
      "minimal-band",
    ] as const),
    bodyLead: body.lead,
    bodyEmphasis: body.emphasis,
    bodyTail: body.tail,
    bodyFontSize: 42,
    bodyLineHeight: 56,
    accentVariant: randomItem([
      "cyan",
      "gold",
      "coral",
      "violet",
      "green",
    ] as const),
  };
}
