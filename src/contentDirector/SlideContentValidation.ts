export type SlidePair = { title: string; body: string; cta?: string };
export function normalizeSlideText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const words = (value: string) =>
  normalizeSlideText(value).split(" ").filter(Boolean);
function editSimilarity(left: string, right: string): number {
  const a = normalizeSlideText(left),
    b = normalizeSlideText(right),
    row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = previous;
    }
  }
  return 1 - row[b.length] / Math.max(1, a.length, b.length);
}
export function titleBodySimilarity(title: string, body: string): number {
  const titleWords = words(title),
    bodyWords = words(body),
    titleSet = new Set(titleWords),
    bodySet = new Set(bodyWords),
    intersection = [...titleSet].filter((word) => bodySet.has(word)).length,
    dice = (2 * intersection) / Math.max(1, titleSet.size + bodySet.size);
  return Math.max(dice, editSimilarity(title, body));
}
export function validateSlidePair(slide: SlidePair): string[] {
  const errors: string[] = [],
    titleWords = words(slide.title),
    bodyWords = words(slide.body),
    title = normalizeSlideText(slide.title),
    body = normalizeSlideText(slide.body);
  if (!title) errors.push("Slide title is required.");
  if (titleWords.length > 10) errors.push("Slide title exceeds 10 words.");
  if (!body) errors.push("Slide body is required.");
  if (bodyWords.length < 5)
    errors.push("Slide body must add substantive information.");
  if (bodyWords.length > 32)
    errors.push("Slide body is too long for vertical video.");
  if (title && title === body)
    errors.push("Slide title and body are duplicates.");
  const appendedWords =
    bodyWords.slice(0, titleWords.length).join(" ") === titleWords.join(" ")
      ? bodyWords.length - titleWords.length
      : Number.POSITIVE_INFINITY;
  if (appendedWords >= 0 && appendedWords <= 2)
    errors.push("Slide body merely appends one or two words to the title.");
  if (
    title &&
    body &&
    title !== body &&
    titleBodySimilarity(title, body) >= 0.82
  )
    errors.push("Slide title and body are near-duplicates.");
  if (
    (slide.cta && body === normalizeSlideText(slide.cta)) ||
    (/^(follow|click|subscribe|share|save)\b/.test(body) &&
      bodyWords.length <= 12)
  )
    errors.push("Slide body cannot consist only of a CTA.");
  return [...new Set(errors)];
}
