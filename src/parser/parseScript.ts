export type SlideField = "title" | "body" | "cta" | "notes";

export type SlideIssue = {
  severity: "warning" | "error";
  field: SlideField | "slide";
  message: string;
};

export type ParsedSlide = {
  id: string;
  number: number;
  title: string;
  body: string;
  cta: string;
  notes: string;
  issues: SlideIssue[];
  isValid: boolean;
};

export type ParseResult = {
  slides: ParsedSlide[];
  ignoredPreamble: string[];
  globalIssues: SlideIssue[];
};

const SLIDE_PATTERN = /^slide\s+(\d+)\s*:?\s*$/i;
const FIELD_PATTERN = /^(title|body|cta|notes)\s*:\s*(.*)$/i;

function emptySlide(number: number): ParsedSlide {
  return {
    id: `slide-${number}`,
    number,
    title: "",
    body: "",
    cta: "",
    notes: "",
    issues: [],
    isValid: false,
  };
}

export function validateSlide(slide: ParsedSlide): ParsedSlide {
  const issues: SlideIssue[] = [];

  if (!slide.title.trim()) {
    issues.push({
      severity: "warning",
      field: "title",
      message: "Missing Title",
    });
  }

  if (!slide.body.trim()) {
    issues.push({
      severity: "warning",
      field: "body",
      message: "Missing Body",
    });
  }

  return {
    ...slide,
    title: slide.title.trim(),
    body: slide.body.trim(),
    cta: slide.cta.trim(),
    notes: slide.notes.trim(),
    issues,
    isValid: issues.length === 0,
  };
}

export function parseCyberSlideScript(input: string): ParseResult {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const slides: ParsedSlide[] = [];
  const ignoredPreamble: string[] = [];
  const globalIssues: SlideIssue[] = [];

  let currentSlide: ParsedSlide | null = null;
  let currentField: SlideField | null = null;
  let parsingStarted = false;

  const commitSlide = () => {
    if (!currentSlide) return;
    slides.push(validateSlide(currentSlide));
    currentSlide = null;
    currentField = null;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const slideMatch = trimmed.match(SLIDE_PATTERN);

    if (!parsingStarted) {
      if (slideMatch) {
        parsingStarted = true;
        currentSlide = emptySlide(Number(slideMatch[1]));
      } else if (trimmed) {
        ignoredPreamble.push(trimmed);
      }
      continue;
    }

    if (slideMatch) {
      commitSlide();
      currentSlide = emptySlide(Number(slideMatch[1]));
      continue;
    }

    if (!currentSlide) continue;

    const fieldMatch = trimmed.match(FIELD_PATTERN);
    if (fieldMatch) {
      currentField = fieldMatch[1].toLowerCase() as SlideField;
      const inlineValue = fieldMatch[2].trim();

      if (inlineValue) {
        currentSlide[currentField] = inlineValue;
      }
      continue;
    }

    if (!trimmed) {
      if (currentField && currentSlide[currentField]) {
        currentSlide[currentField] += "\n";
      }
      continue;
    }

    if (!currentField) {
      currentSlide.issues.push({
        severity: "warning",
        field: "slide",
        message: `Unlabeled text ignored: "${trimmed.slice(0, 48)}${
          trimmed.length > 48 ? "…" : ""
        }"`,
      });
      continue;
    }

    currentSlide[currentField] = currentSlide[currentField]
      ? `${currentSlide[currentField]}\n${trimmed}`
      : trimmed;
  }

  commitSlide();

  if (!parsingStarted) {
    globalIssues.push({
      severity: "error",
      field: "slide",
      message: 'No slides found. Start the script with "Slide 1".',
    });
  }

  const normalizedSlides = slides
    .sort((a, b) => a.number - b.number)
    .map((slide, index) => {
      const duplicateCount = slides.filter(
        (candidate) => candidate.number === slide.number
      ).length;

      const duplicateIssue: SlideIssue[] =
        duplicateCount > 1
          ? [
              {
                severity: "warning",
                field: "slide",
                message: `Duplicate slide number ${slide.number}`,
              },
            ]
          : [];

      const allIssues = [...slide.issues, ...duplicateIssue];

      return {
        ...slide,
        id: `slide-${slide.number}-${index}`,
        issues: allIssues,
        isValid: allIssues.length === 0,
      };
    });

  return {
    slides: normalizedSlides,
    ignoredPreamble,
    globalIssues,
  };
}

function serializeField(label: string, value: string): string {
  if (!value.trim()) {
    return `${label}:\n`;
  }

  return `${label}:\n${value.trim()}`;
}

export function serializeCyberSlideScript(
  slides: ParsedSlide[],
  preamble: string[] = []
): string {
  const scriptBody = slides
    .map((slide, index) => {
      const number = index + 1;
      const sections = [
        `Slide ${number}`,
        serializeField("Title", slide.title),
        serializeField("Body", slide.body),
      ];

      if (slide.cta.trim()) {
        sections.push(serializeField("CTA", slide.cta));
      }

      if (slide.notes.trim()) {
        sections.push(serializeField("Notes", slide.notes));
      }

      return sections.join("\n\n");
    })
    .join("\n\n");

  const cleanedPreamble = preamble.map((line) => line.trim()).filter(Boolean);

  return cleanedPreamble.length
    ? `${cleanedPreamble.join("\n")}\n\n${scriptBody}`
    : scriptBody;
}
