import type { CtaRenderer, DecorationRenderer } from "./types";
import { createAccentGradient } from "./utils";

export const renderCornerBrackets: DecorationRenderer = (
  input,
  headline,
  body,
) => {
  const { context } = input;
  context.save();
  context.strokeStyle = input.accentPalette[0];
  context.lineWidth = 5;

  context.beginPath();
  context.moveTo(headline.x - 18, headline.y + 30);
  context.lineTo(headline.x - 18, headline.y - 12);
  context.lineTo(headline.x + 120, headline.y - 12);
  context.stroke();

  context.beginPath();
  context.moveTo(body.x + body.width - 170, body.y + body.height + 14);
  context.lineTo(body.x + body.width + 12, body.y + body.height + 14);
  context.lineTo(body.x + body.width + 12, body.y + body.height - 74);
  context.stroke();

  context.restore();
};

export const renderSpeedLines: DecorationRenderer = (
  input,
  headline,
) => {
  const { context } = input;
  const startX = Math.min(
    input.width - 330,
    headline.x + Math.min(headline.width, 520),
  );
  let y = headline.y + 20;

  for (let index = 0; index < 4; index += 1) {
    context.fillStyle = createAccentGradient(
      context,
      startX,
      y,
      250 - index * 32,
      8,
      input.accentPalette,
    );
    context.fillRect(startX + index * 18, y, 250 - index * 32, 6);
    y += 18;
  }
};

export const renderTechDots: DecorationRenderer = (
  input,
  _headline,
  body,
) => {
  const { context } = input;
  context.save();

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      context.globalAlpha = 0.16 + (column + row) * 0.02;
      context.fillStyle = input.accentPalette[(row + column) % 3];
      context.beginPath();
      context.arc(
        body.x + body.width - 150 + column * 17,
        body.bottom + 58 + row * 17,
        4,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  context.restore();
};

export const renderFooterCta: CtaRenderer = (input, startY) => {
  if (!input.cta?.trim()) return;

  const { context } = input;
  context.font = "800 31px Arial, Helvetica, sans-serif";
  context.fillStyle = input.foreground;
  context.fillText(input.cta.toUpperCase(), 76, startY);

  context.fillStyle = createAccentGradient(
    context,
    76,
    startY + 48,
    360,
    6,
    input.accentPalette,
  );
  context.fillRect(76, startY + 48, 360, 6);
};
