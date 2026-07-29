import type { CreativeTemplate, TemplateRenderInput } from "../types";

function words(text: string): string[] {
  return text.trim().toUpperCase().split(/\s+/).filter(Boolean);
}

function normalize(text: string): string {
  return text.replace(/[^\w]/g, "").toUpperCase();
}

function lines(text: string): string[] {
  const all = words(text);
  if (all.length <= 4) return all;
  return [all.slice(0, 1).join(" "), all.slice(1, 3).join(" "), all.slice(3, 5).join(" "), all.slice(5).join(" ")].filter(Boolean);
}

function font(size: number): string {
  return `900 italic ${size}px Impact, "Arial Black", Arial, sans-serif`;
}

function fit(context: CanvasRenderingContext2D, text: string, desired: number, maxWidth: number): number {
  for (let size = desired; size >= 62; size -= 3) {
    context.font = font(size);
    if (context.measureText(text).width <= maxWidth) return size;
  }
  return 62;
}

function cool(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): CanvasGradient {
  const g = context.createLinearGradient(x, y, x + width, y + height);
  g.addColorStop(0, "#33F3FF");
  g.addColorStop(0.48, "#00B9FF");
  g.addColorStop(1, "#315DFF");
  return g;
}

function white(context: CanvasRenderingContext2D, y: number, height: number): CanvasGradient {
  const g = context.createLinearGradient(0, y, 0, y + height);
  g.addColorStop(0, "#FFFFFF");
  g.addColorStop(0.58, "#F5F8FC");
  g.addColorStop(1, "#AEBCCC");
  return g;
}

function drawLine(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, maxWidth: number, fill: string | CanvasGradient, rotation: number): void {
  context.save();
  context.translate(x, y);
  context.rotate((rotation * Math.PI) / 180);
  context.transform(1, 0, -0.14, 1, 0, 0);
  context.font = font(size);
  context.textBaseline = "top";
  context.lineJoin = "round";

  for (let depth = 16; depth >= 1; depth -= 1) {
    context.fillStyle = depth % 2 === 0 ? "#05070A" : "#111820";
    context.fillText(text, depth * 1.12, depth * 1.02, maxWidth);
  }

  context.strokeStyle = "#020408";
  context.lineWidth = Math.max(7, size * 0.065);
  context.strokeText(text, 0, 0, maxWidth);
  context.shadowColor = "rgba(0,0,0,.78)";
  context.shadowBlur = 24;
  context.shadowOffsetX = 10;
  context.shadowOffsetY = 14;
  context.fillStyle = fill;
  context.fillText(text, 0, 0, maxWidth);
  context.restore();
}

function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  let line = "";
  text.trim().split(/\s+/).forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      result.push(line);
      line = word;
    } else line = candidate;
  });
  if (line) result.push(line);
  return result;
}

function emphasis(text: string): string {
  const numeric = text.match(/\b\d[\d,]*(?:\s+\w+){0,2}/);
  if (numeric) return numeric[0].toLowerCase();
  const all = text.trim().split(/\s+/);
  return all.slice(Math.floor(all.length / 2), Math.floor(all.length / 2) + 3).join(" ").toLowerCase();
}

function render(input: TemplateRenderInput): void {
  const { context, plan } = input;
  const headlineLines = lines(input.headline);
  const focal = new Set(input.focalWords.map(normalize));
  let y = plan.headline.y;

  headlineLines.forEach((line, index) => {
    const desired = Math.round((index === 1 ? 142 : 124) * plan.headline.scale);
    const size = fit(context, line, desired, plan.headline.maxWidth);
    const highlighted = line.split(/\s+/).some((word) => focal.has(normalize(word)));
    drawLine(
      context,
      line,
      plan.headline.x + index * 12,
      y,
      size,
      plan.headline.maxWidth - index * 12,
      highlighted || index === headlineLines.length - 1 ? cool(context, plan.headline.x, y, plan.headline.maxWidth, size) : white(context, y, size),
      plan.headline.rotation + index * 0.7,
    );
    y += Math.round(size * 0.69);
  });

  const bodyX = plan.body.x;
  const bodyY = plan.body.y;
  const bodyWidth = plan.body.width;
  const key = emphasis(input.supportingText);
  context.font = "500 38px Arial, Helvetica, sans-serif";
  const bodyLines = wrap(context, input.supportingText, bodyWidth - 58).slice(0, 4);
  const bodyHeight = Math.min(plan.body.maxHeight, Math.max(174, bodyLines.length * 52 + 68));

  context.save();
  context.shadowColor = "rgba(0,0,0,.72)";
  context.shadowBlur = 30;
  context.shadowOffsetY = 16;
  context.beginPath();
  context.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 18);
  context.fillStyle = "rgba(2,12,23,.88)";
  context.fill();
  const border = context.createLinearGradient(bodyX, bodyY, bodyX + bodyWidth, bodyY);
  border.addColorStop(0, "#24E8FF");
  border.addColorStop(0.55, "#247CFF");
  border.addColorStop(1, "#C14FFF");
  context.strokeStyle = border;
  context.lineWidth = 3;
  context.stroke();
  context.restore();

  context.fillStyle = "#24E8FF";
  context.fillRect(bodyX + 26, bodyY + 24, 78, 4);
  context.font = "700 16px Arial, Helvetica, sans-serif";
  context.fillStyle = "rgba(255,255,255,.68)";
  context.fillText("SECURITY INSIGHT", bodyX + 26, bodyY + 18);

  let textY = bodyY + 62;
  bodyLines.forEach((line) => {
    let cursor = bodyX + 26;
    line.split(/\s+/).forEach((word) => {
      const clean = word.replace(/[^\w]/g, "").toLowerCase();
      const highlighted = key.includes(clean) || clean.includes(key);
      context.font = `${highlighted ? "800" : "500"} 38px Arial, Helvetica, sans-serif`;
      context.fillStyle = highlighted ? cool(context, cursor, textY, 210, 44) : input.foreground;
      context.fillText(word, cursor, textY);
      cursor += context.measureText(`${word} `).width;
    });
    textY += 52;
  });
}

export const cyberHeroTemplate: CreativeTemplate = {
  id: "cyber-hero",
  name: "CyberHero",
  render,
};
