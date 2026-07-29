import type { BodyRenderer } from "./types";
import {
  LEFT,
  createAccentGradient,
  roundRect,
  wrapText,
} from "./utils";

function splitEmphasis(text: string): { lead: string; emphasis: string; tail: string } {
  const numeric = text.match(/\b\d[\d,]*(?:\s+\w+){0,2}/);
  if (numeric?.index !== undefined) {
    return {
      lead: text.slice(0, numeric.index).trim(),
      emphasis: numeric[0].trim(),
      tail: text.slice(numeric.index + numeric[0].length).trim(),
    };
  }

  const words = text.trim().split(/\s+/);
  const start = Math.max(1, Math.floor(words.length / 2));
  return {
    lead: words.slice(0, start).join(" "),
    emphasis: words.slice(start, Math.min(start + 3, words.length)).join(" "),
    tail: words.slice(Math.min(start + 3, words.length)).join(" "),
  };
}

function drawStyledWords(
  context: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  emphasis: string,
  foreground: string,
  palette: readonly [string, string, string],
): void {
  let cursor = x;
  const normalizedEmphasis = emphasis.toLowerCase();

  line.split(/\s+/).forEach((word) => {
    const clean = word.replace(/[^\w]/g, "").toLowerCase();
    const highlighted =
      normalizedEmphasis.length > 0 &&
      (normalizedEmphasis.includes(clean) || clean.includes(normalizedEmphasis));

    context.font = `${highlighted ? "800" : "500"} 42px Arial, Helvetica, sans-serif`;
    context.fillStyle = highlighted
      ? createAccentGradient(context, cursor, y, 240, 48, palette)
      : foreground;
    context.shadowColor = "rgba(0,0,0,.72)";
    context.shadowBlur = 14;
    context.fillText(word, cursor, y);
    cursor += context.measureText(`${word} `).width;
  });

  context.shadowBlur = 0;
}

function renderBodyBase(
  input: Parameters<BodyRenderer>[0],
  startY: number,
  variant: "hud" | "glass" | "alert",
) {
  const { context } = input;
  const width = input.width - LEFT * 2;
  const split = splitEmphasis(input.supportingText);
  const fullText = [split.lead, split.emphasis, split.tail].filter(Boolean).join(" ");

  context.font = "500 42px Arial, Helvetica, sans-serif";
  const lines = wrapText(context, fullText, width - 116).slice(0, 4);
  const height = Math.max(200, lines.length * 60 + 88);

  context.save();
  context.shadowColor = "rgba(0,0,0,.66)";
  context.shadowBlur = 38;
  context.shadowOffsetY = 18;

  if (variant === "hud") {
    roundRect(context, LEFT, startY, width, height, 18);
    context.fillStyle = "rgba(3,12,22,.84)";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = input.accentPalette[0];
    context.stroke();

    context.strokeStyle = input.accentPalette[1];
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(LEFT + width - 190, startY);
    context.lineTo(LEFT + width - 34, startY);
    context.stroke();

    context.beginPath();
    context.moveTo(LEFT, startY + 32);
    context.lineTo(LEFT, startY + height - 32);
    context.stroke();
  } else if (variant === "glass") {
    roundRect(context, LEFT, startY, width, height, 30);
    context.fillStyle = "rgba(4,14,24,.76)";
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = "rgba(255,255,255,.2)";
    context.stroke();

    context.fillStyle = createAccentGradient(
      context,
      LEFT,
      startY,
      width,
      8,
      input.accentPalette,
    );
    context.fillRect(LEFT + 24, startY + 22, width - 48, 5);
  } else {
    roundRect(context, LEFT, startY, width, height, 10);
    const gradient = context.createLinearGradient(LEFT, startY, LEFT + width, startY);
    gradient.addColorStop(0, "rgba(8,8,14,.94)");
    gradient.addColorStop(1, "rgba(8,8,14,.58)");
    context.fillStyle = gradient;
    context.fill();

    context.fillStyle = input.accentPalette[0];
    context.fillRect(LEFT, startY, 10, height);

    context.fillStyle = input.accentPalette[2];
    context.fillRect(LEFT + 24, startY + height - 12, 160, 6);
  }

  context.restore();

  let y = startY + 42;
  lines.forEach((line) => {
    drawStyledWords(
      context,
      line,
      LEFT + 42,
      y,
      split.emphasis,
      input.foreground,
      input.accentPalette,
    );
    y += 60;
  });

  return {
    x: LEFT,
    y: startY,
    width,
    height,
    bottom: startY + height,
  };
}

export const renderBodyHud: BodyRenderer = (input, startY) =>
  renderBodyBase(input, startY, "hud");

export const renderBodyGlass: BodyRenderer = (input, startY) =>
  renderBodyBase(input, startY, "glass");

export const renderBodyAlert: BodyRenderer = (input, startY) =>
  renderBodyBase(input, startY, "alert");
