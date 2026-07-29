import type { HeadlineRenderer } from "./types";
import {
  LEFT,
  chooseEmphasisWords,
  createAccentGradient,
  drawDimensionalText,
  fitFontSize,
  splitWords,
} from "./utils";

function lineGroups(headline: string, style: "hero" | "editorial" | "magazine"): string[] {
  const words = splitWords(headline).map((word) => word.toUpperCase());

  if (style === "hero") {
    if (words.length === 4) return [words[0], words[1], words[2], words[3]];
    return words.map((word) => word).slice(0, 5);
  }

  if (style === "editorial") {
    if (words.length === 4) return [`${words[0]} ${words[1]}`, words[2], words[3]];
    return [words.slice(0, 2).join(" "), words.slice(2, 4).join(" "), words.slice(4).join(" ")]
      .filter(Boolean);
  }

  if (words.length === 4) return [words[0], `${words[1]} ${words[2]}`, words[3]];
  return [words.slice(0, 1).join(" "), words.slice(1, 3).join(" "), words.slice(3).join(" ")]
    .filter(Boolean);
}

function colorForLine(
  line: string,
  emphasis: Set<string>,
  palette: readonly [string, string, string],
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): string | CanvasGradient {
  const isEmphasis = line
    .split(/\s+/)
    .some((word) => emphasis.has(word.replace(/[^\w]/g, "").toUpperCase()));

  if (!isEmphasis) return "#F7FBFF";
  return createAccentGradient(context, x, y, width, height, palette);
}

export const renderHeadlineHero: HeadlineRenderer = (input, startY) => {
  const lines = lineGroups(input.headline, "hero");
  const maxWidth = input.width - LEFT * 2;
  const fontSize = fitFontSize(input.context, lines, 132, maxWidth);
  const emphasis = chooseEmphasisWords(input.headline, input.focalWords);
  let y = startY;
  let widest = 0;

  lines.forEach((line, index) => {
    const rotation = index % 2 === 0 ? -2.2 : 0.7;
    const x = LEFT + (index % 2 === 0 ? 0 : 28);
    const fill = colorForLine(
      line,
      emphasis,
      input.accentPalette,
      input.context,
      x,
      y,
      maxWidth,
      fontSize,
    );
    widest = Math.max(
      widest,
      drawDimensionalText(input.context, line, x, y, fontSize, fill, rotation, maxWidth),
    );
    y += Math.round(fontSize * 0.84);
  });

  return { x: LEFT, y: startY, width: widest, height: y - startY, bottom: y };
};

export const renderHeadlineEditorial: HeadlineRenderer = (input, startY) => {
  const lines = lineGroups(input.headline, "editorial");
  const maxWidth = input.width - LEFT * 2;
  const fontSize = fitFontSize(input.context, lines, 116, maxWidth);
  const emphasis = chooseEmphasisWords(input.headline, input.focalWords);
  let y = startY;
  let widest = 0;

  lines.forEach((line, index) => {
    const scale = index === lines.length - 1 ? 1.12 : 1;
    const size = Math.round(fontSize * scale);
    const x = LEFT + (index === 1 ? 18 : 0);
    const fill = colorForLine(
      line,
      emphasis,
      input.accentPalette,
      input.context,
      x,
      y,
      maxWidth,
      size,
    );
    widest = Math.max(
      widest,
      drawDimensionalText(input.context, line, x, y, size, fill, 0, maxWidth),
    );
    y += Math.round(size * 0.88);
  });

  return { x: LEFT, y: startY, width: widest, height: y - startY, bottom: y };
};

export const renderHeadlineDiagonal: HeadlineRenderer = (input, startY) => {
  const lines = lineGroups(input.headline, "magazine");
  const maxWidth = input.width - LEFT * 2;
  const fontSize = fitFontSize(input.context, lines, 124, maxWidth);
  const emphasis = chooseEmphasisWords(input.headline, input.focalWords);
  let y = startY;
  let widest = 0;

  lines.forEach((line, index) => {
    const x = LEFT + index * 24;
    const rotation = -4 + index * 1.35;
    const size = Math.round(fontSize * (index === 1 ? 1.09 : 1));
    const fill = colorForLine(
      line,
      emphasis,
      input.accentPalette,
      input.context,
      x,
      y,
      maxWidth,
      size,
    );
    widest = Math.max(
      widest,
      drawDimensionalText(input.context, line, x, y, size, fill, rotation, maxWidth),
    );
    y += Math.round(size * 0.82);
  });

  return { x: LEFT, y: startY, width: widest, height: y - startY, bottom: y };
};
