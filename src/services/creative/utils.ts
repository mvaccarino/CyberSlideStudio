import type { AccentPalette } from "./types";

export const LEFT = 76;
export const RIGHT = 76;

export function normalizeWord(word: string): string {
  return word.replace(/[^\w]/g, "").toUpperCase();
}

export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function randomItem<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function createAccentGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: AccentPalette,
): CanvasGradient {
  const gradient = context.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.52, palette[1]);
  gradient.addColorStop(1, palette[2]);
  return gradient;
}

export function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = splitWords(text);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export function fitFontSize(
  context: CanvasRenderingContext2D,
  lines: string[],
  preferred: number,
  maxWidth: number,
  family = "Arial Black, Arial, Helvetica, sans-serif",
): number {
  for (let size = preferred; size >= 62; size -= 4) {
    context.font = `900 ${size}px ${family}`;
    if (lines.every((line) => context.measureText(line).width <= maxWidth)) {
      return size;
    }
  }
  return 62;
}

export function chooseEmphasisWords(
  headline: string,
  focalWords: string[],
): Set<string> {
  const normalized = focalWords.map(normalizeWord).filter(Boolean);
  const chosen = new Set(normalized.slice(0, 2));

  if (chosen.size === 0) {
    splitWords(headline)
      .map(normalizeWord)
      .filter((word) => word.length >= 5)
      .sort((a, b) => b.length - a.length)
      .slice(0, 2)
      .forEach((word) => chosen.add(word));
  }

  return chosen;
}

export function drawDimensionalText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string | CanvasGradient,
  rotation = 0,
  maxWidth?: number,
): number {
  context.save();
  context.translate(x, y);
  context.rotate((rotation * Math.PI) / 180);
  context.font = `900 ${fontSize}px Arial Black, Arial, Helvetica, sans-serif`;
  context.textBaseline = "top";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(0,0,0,.78)";
  context.lineWidth = Math.max(5, fontSize * 0.055);
  context.shadowColor = "rgba(0,0,0,.82)";
  context.shadowBlur = 26;
  context.shadowOffsetX = 10;
  context.shadowOffsetY = 15;
  context.fillStyle = fill;
  context.strokeText(text, 0, 0, maxWidth);
  context.fillText(text, 0, 0, maxWidth);
  const width = context.measureText(text).width;
  context.restore();
  return width;
}
