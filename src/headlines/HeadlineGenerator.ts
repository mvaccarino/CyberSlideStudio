export type HeadlineOption = {
  id: string;
  text: string;
  rationale: string;
};

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "but", "by",
  "can", "do", "for", "from", "has", "have", "if", "in", "is", "it",
  "its", "of", "on", "or", "that", "the", "their", "this", "to", "was",
  "were", "will", "with", "you", "your",
]);

function cleanSentence(text: string): string {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(" ");
}

function keywords(text: string): string[] {
  const counts = new Map<string, number>();

  cleanSentence(text)
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z]+)?/g)
    ?.forEach((word) => {
      if (word.length < 4 || STOP_WORDS.has(word)) return;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([word]) => word)
    .slice(0, 5);
}

function firstClause(text: string): string {
  const first = cleanSentence(text).split(/[.!?;:]/)[0]?.trim() ?? "";
  const words = first.split(/\s+/).filter(Boolean);
  return words.slice(0, 7).join(" ");
}

function uniqueOptions(options: HeadlineOption[]): HeadlineOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function generateHeadlineOptions(body: string): HeadlineOption[] {
  const cleaned = cleanSentence(body);
  const keyWords = keywords(cleaned);
  const primary = keyWords[0] ?? "security";
  const secondary = keyWords[1] ?? "risk";
  const clause = firstClause(cleaned);
  const lower = cleaned.toLowerCase();
  const options: HeadlineOption[] = [];

  if (/reuse|same password/.test(lower)) {
    options.push(
      { id: "reuse-1", text: "STOP REUSING PASSWORDS", rationale: "Direct warning" },
      { id: "reuse-2", text: "ONE PASSWORD ISN'T ENOUGH", rationale: "High-impact contrast" },
      { id: "reuse-3", text: "THE DANGER OF PASSWORD REUSE", rationale: "Educational framing" },
      { id: "reuse-4", text: "ONE BREACH CAN OPEN EVERY ACCOUNT", rationale: "Consequence-led hook" },
    );
  }

  if (/password manager/.test(lower)) {
    options.push(
      { id: "manager-1", text: "USE A PASSWORD MANAGER", rationale: "Clear action" },
      { id: "manager-2", text: "ONE MASTER PASSWORD. EVERY ACCOUNT.", rationale: "Benefit-led hook" },
      { id: "manager-3", text: "STRONGER PASSWORDS. LESS WORK.", rationale: "Concise value statement" },
      { id: "manager-4", text: "LET THE VAULT REMEMBER", rationale: "Visual metaphor" },
    );
  }

  if (/multi-factor|mfa|two-factor/.test(lower)) {
    options.push(
      { id: "mfa-1", text: "ADD A SECOND LOCK", rationale: "Simple metaphor" },
      { id: "mfa-2", text: "PASSWORDS ALONE AREN'T ENOUGH", rationale: "Risk-led hook" },
      { id: "mfa-3", text: "TURN ON MFA", rationale: "Direct action" },
      { id: "mfa-4", text: "ONE EXTRA STEP. MUCH MORE SECURITY.", rationale: "Benefit-led contrast" },
    );
  }

  if (/phish|email|link/.test(lower)) {
    options.push(
      { id: "phish-1", text: "THINK BEFORE YOU CLICK", rationale: "Recognizable action" },
      { id: "phish-2", text: "ONE CLICK CAN COST EVERYTHING", rationale: "Consequence-led hook" },
      { id: "phish-3", text: "SPOT THE PHISH", rationale: "Short educational hook" },
      { id: "phish-4", text: "THE EMAIL ISN'T WHAT IT SEEMS", rationale: "Curiosity hook" },
    );
  }

  if (/update|patch/.test(lower)) {
    options.push(
      { id: "patch-1", text: "UPDATE BEFORE ATTACKERS DO", rationale: "Urgent action" },
      { id: "patch-2", text: "PATCH THE GAP", rationale: "Short metaphor" },
      { id: "patch-3", text: "OLD SOFTWARE. OPEN DOOR.", rationale: "Risk contrast" },
      { id: "patch-4", text: "A SIMPLE UPDATE CAN STOP AN ATTACK", rationale: "Outcome-led hook" },
    );
  }

  options.push(
    { id: "generic-1", text: titleCase(clause).toUpperCase(), rationale: "Derived from the first key message" },
    { id: "generic-2", text: `THE HIDDEN RISK OF ${primary.toUpperCase()}`, rationale: "Risk-led educational hook" },
    { id: "generic-3", text: `${primary.toUpperCase()} CHANGES EVERYTHING`, rationale: "Bold transformation hook" },
    { id: "generic-4", text: `PROTECT YOUR ${secondary.toUpperCase()}`, rationale: "Action-oriented message" },
    { id: "generic-5", text: `DON'T IGNORE ${primary.toUpperCase()}`, rationale: "Urgent attention hook" },
    { id: "generic-6", text: `${primary.toUpperCase()}: WHAT YOU NEED TO KNOW`, rationale: "Educational framing" },
  );

  return uniqueOptions(options).slice(0, 8);
}

export function focalWordsFromHeadline(headline: string): string[] {
  return headline
    .toUpperCase()
    .match(/[A-Z0-9]+/g)
    ?.filter((word) => word.length >= 5)
    .slice(-2) ?? [];
}
